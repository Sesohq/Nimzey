/**
 * RenderPipeline - Compiles a node graph into an execution plan and renders it.
 *
 * Flow: GraphState -> buildExecutionPlan() -> optimize() -> execute()
 */

import { GLContext, TexturePool } from '../core/GLContext';
import { ShaderDefinition, compileFragmentShader, MappableParamInfo } from '../shaders/ShaderDefinition';
import { GraphNode, GraphEdge, DataType, ExecutionStep, ExecutionPlan, ParameterDefinition, QualityLevel } from '@/types';
import { NodeRegistry, getEffectiveInputs } from '@/registry/NodeRegistry';
import { ShaderLibrary } from '../shaders/library';

// Default texture IDs for unconnected inputs
const DEFAULT_TEX_BLACK = '_default_black';
const DEFAULT_TEX_CURVE = '_default_identity_curve';

interface GraphSnapshot {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

export class RenderPipeline {
  private ctx: GLContext;
  private pool: TexturePool;
  private compiledPrograms = new Map<string, boolean>();
  public lastPlan: ExecutionPlan | null = null;

  /** Pre-built parameter maps: definitionId -> (parameterId -> ParameterDefinition) */
  private parameterMaps = new Map<string, Map<string, ParameterDefinition>>();

  /** Index from nodeId -> ExecutionStep for fast lookup in updateNodeUniforms */
  private stepByNodeId = new Map<string, ExecutionStep>();

  private defaultsCreated = false;

  constructor(ctx: GLContext) {
    this.ctx = ctx;
    this.pool = new TexturePool(ctx);
  }

  /**
   * Lazily create default textures for unconnected inputs.
   * - Map / Numeric: 1×1 transparent-black (all zeros)
   * - Curve: 256×1 identity ramp (output = input, so node passes through unchanged)
   */
  private ensureDefaultTextures(): void {
    if (this.defaultsCreated) return;
    this.defaultsCreated = true;

    // 1×1 transparent black for Map/Numeric
    if (!this.ctx.getTexture(DEFAULT_TEX_BLACK)) {
      this.ctx.createManagedTexture(DEFAULT_TEX_BLACK, 1, 1, 'uint8');
    }

    // 256×1 identity curve (linear ramp: pixel at x has value x/255)
    if (!this.ctx.getTexture(DEFAULT_TEX_CURVE)) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 1;
      const ctx2d = canvas.getContext('2d')!;
      for (let x = 0; x < 256; x++) {
        ctx2d.fillStyle = `rgb(${x},${x},${x})`;
        ctx2d.fillRect(x, 0, 1, 1);
      }
      this.ctx.createManagedTexture(DEFAULT_TEX_CURVE, 256, 1, 'uint8', canvas);
    }
  }

  /** Get the default texture ID for a given DataType */
  private getDefaultTextureId(dataType: DataType): string {
    return dataType === DataType.Curve ? DEFAULT_TEX_CURVE : DEFAULT_TEX_BLACK;
  }

  /** Get or build the parameter map for a node definition */
  private getParameterMap(definitionId: string): Map<string, ParameterDefinition> | undefined {
    let paramMap = this.parameterMaps.get(definitionId);
    if (paramMap) return paramMap;

    const def = NodeRegistry.get(definitionId);
    if (!def) return undefined;

    paramMap = new Map<string, ParameterDefinition>();
    for (const p of def.parameters) {
      paramMap.set(p.id, p);
    }
    this.parameterMaps.set(definitionId, paramMap);
    return paramMap;
  }

  /**
   * Build an execution plan from the graph state.
   * Performs topological sort and maps each node to a render pass.
   */
  buildExecutionPlan(graph: GraphSnapshot, outputWidth: number, outputHeight: number): ExecutionPlan {
    const plan: ExecutionPlan = [];

    // Ensure default textures exist for unconnected inputs
    this.ensureDefaultTextures();

    // Build adjacency: for each node, track incoming edges (grouped by target port)
    const incomingByNode = new Map<string, Map<string, GraphEdge>>();
    const outgoingByNode = new Map<string, GraphEdge[]>();

    for (const edge of graph.edges.values()) {
      // Incoming: target node, keyed by target port
      let incoming = incomingByNode.get(edge.targetNodeId);
      if (!incoming) { incoming = new Map(); incomingByNode.set(edge.targetNodeId, incoming); }
      incoming.set(edge.targetPortId, edge);

      // Outgoing: source node
      let outgoing = outgoingByNode.get(edge.sourceNodeId);
      if (!outgoing) { outgoing = []; outgoingByNode.set(edge.sourceNodeId, outgoing); }
      outgoing.push(edge);
    }

    // Topological sort (Kahn's algorithm)
    const inDegree = new Map<string, number>();
    for (const node of graph.nodes.values()) {
      inDegree.set(node.id, 0);
    }
    for (const edge of graph.edges.values()) {
      inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sortedNodeIds: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sortedNodeIds.push(nodeId);
      const outgoing = outgoingByNode.get(nodeId) || [];
      for (const edge of outgoing) {
        const newDeg = (inDegree.get(edge.targetNodeId) || 1) - 1;
        inDegree.set(edge.targetNodeId, newDeg);
        if (newDeg === 0) queue.push(edge.targetNodeId);
      }
    }

    // Find the result node (render target)
    let resultNodeId: string | null = null;
    for (const node of graph.nodes.values()) {
      if (node.definitionId === 'result' || node.definitionId === 'result-pbr') {
        resultNodeId = node.id;
        break;
      }
    }

    // Clear the step-by-node index for the new plan
    this.stepByNodeId.clear();

    // Build a bypass map for disabled nodes: disabled node -> the texture it would pass through.
    // When a disabled node sits in a chain (A -> [disabled B] -> C), C should receive A's output.
    const bypassMap = new Map<string, string>(); // nodeId -> texture name to use instead
    for (const nodeId of sortedNodeIds) {
      const node = graph.nodes.get(nodeId);
      if (!node || node.enabled) continue;

      const def = NodeRegistry.get(node.definitionId);
      if (!def) continue;

      // Find the primary Map input edge (what feeds this disabled node)
      const incoming = incomingByNode.get(nodeId);
      const primaryInput = def.inputs.find(p => p.id === 'source' && p.dataType === DataType.Map)
        || def.inputs.find(p => p.dataType === DataType.Map);

      if (primaryInput && incoming) {
        const edge = incoming.get(primaryInput.id);
        if (edge) {
          // The upstream texture — resolve through bypass chain for consecutive disabled nodes
          let upstreamTex = `node_${edge.sourceNodeId}_out`;
          const upstreamBypass = bypassMap.get(edge.sourceNodeId);
          if (upstreamBypass) upstreamTex = upstreamBypass;
          bypassMap.set(nodeId, upstreamTex);
        }
      }
    }

    // Generate execution steps for each node in topological order
    for (const nodeId of sortedNodeIds) {
      const node = graph.nodes.get(nodeId);
      if (!node || !node.enabled) continue;

      const def = NodeRegistry.get(node.definitionId);
      if (!def) continue;

      // Image/external nodes with no inputs use uploaded textures directly —
      // skip shader execution to preserve the texture created by uploadImage().
      // The passthrough shader would fail anyway (expects u_input0 but nothing is bound).
      if (def.id === 'image' && def.inputs.length === 0) {
        continue;
      }

      const shaderDef = ShaderLibrary.get(def.shaderId);
      if (!shaderDef) continue;

      // Determine input textures from incoming edges.
      // Use getEffectiveInputs() which includes auto-generated map_ ports for mappable params.
      // ALWAYS fill every slot so u_input{i} indices match port indices.
      // Unconnected ports get a sensible default texture (black for Map, identity ramp for Curve).
      // When an input comes from a disabled node, use the bypass texture instead.
      const effectiveInputs = getEffectiveInputs(def);
      const allInputTextures: string[] = [];   // All slots (connected + defaults)
      let regularConnectedCount = 0;            // Only regular (non-map) connected inputs
      const incoming = incomingByNode.get(nodeId);

      for (let i = 0; i < effectiveInputs.length; i++) {
        const port = effectiveInputs[i];
        const edge = incoming?.get(port.id);
        if (edge) {
          // Check if the source node is disabled — use its bypass texture instead
          const bypass = bypassMap.get(edge.sourceNodeId);
          allInputTextures.push(bypass || `node_${edge.sourceNodeId}_out`);
          // Only count regular inputs (not map_ ports) for u_inputCount
          if (!port.id.startsWith('map_')) {
            regularConnectedCount++;
          }
        } else {
          // Bind a default texture so the shader uniform is never undefined
          allInputTextures.push(this.getDefaultTextureId(port.dataType));
        }
      }

      // Build uniforms from node parameters using pre-built parameter map
      const uniforms: Record<string, number | number[] | boolean | string> = {};
      const paramMap = this.getParameterMap(node.definitionId);

      // Collect mappable param info for shader compilation
      const mappableParams: MappableParamInfo[] = [];

      if (paramMap) {
        // Determine which params are mappable and their input indices
        let mapInputIdx = def.inputs.length; // Map inputs start after regular inputs
        for (const [paramId, paramDef] of paramMap) {
          const value = node.parameters[paramId] ?? paramDef.defaultValue;
          const isMappable = paramDef.mappable === true;
          const isMapConnected = isMappable && incoming?.has(`map_${paramId}`);

          if (isMappable) {
            // Track mappable param info for shader compilation
            const glslType = (paramDef.type === 'int' || paramDef.type === 'option') ? 'int' as const : 'float' as const;
            mappableParams.push({
              paramId,
              inputIndex: mapInputIdx,
              min: paramDef.min ?? 0,
              max: paramDef.max ?? 1,
              glslType,
            });

            // Set flag uniform: 1 if map input is connected, 0 if not
            uniforms[`u_has_map_${paramId}`] = isMapConnected ? 1 : 0;

            // Use underscore-prefixed uniform name for mappable params
            // (shader #define resolves u_paramId from _u_paramId or texture)
            if ((paramDef.type === 'color' || paramDef.type === 'hdrColor')) {
              if (typeof value === 'string') {
                uniforms[`_u_${paramId}`] = hexToVec3(value);
              } else if (Array.isArray(value)) {
                // Defensive: convert float array [r,g,b,a?] to vec3
                uniforms[`_u_${paramId}`] = [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
              } else {
                uniforms[`_u_${paramId}`] = value as number | number[] | boolean;
              }
            } else {
              uniforms[`_u_${paramId}`] = value as number | number[] | boolean;
            }

            mapInputIdx++;
          } else {
            // Non-mappable: use standard uniform name
            if ((paramDef.type === 'color' || paramDef.type === 'hdrColor')) {
              if (typeof value === 'string') {
                uniforms[`u_${paramId}`] = hexToVec3(value);
              } else if (Array.isArray(value)) {
                // Defensive: convert float array [r,g,b,a?] to vec3
                uniforms[`u_${paramId}`] = [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
              } else {
                uniforms[`u_${paramId}`] = value as number | number[] | boolean;
              }
            } else {
              uniforms[`u_${paramId}`] = value as number | number[] | boolean;
            }
          }
        }
      }

      // Tell shaders how many regular inputs are truly connected (for optional input detection)
      uniforms['u_inputCount'] = regularConnectedCount;

      // Compile shader program if needed
      // Use a program ID that includes mappable param count so recompilation happens
      // when the node definition changes (e.g., new mappable params added)
      const programId = mappableParams.length > 0
        ? `shader_${def.shaderId}_m${mappableParams.length}`
        : `shader_${def.shaderId}`;
      if (!this.compiledPrograms.has(programId)) {
        const effectiveInputCount = Math.max(shaderDef.inputCount, effectiveInputs.length);
        const fragSource = compileFragmentShader(
          shaderDef,
          effectiveInputCount,
          mappableParams.length > 0 ? mappableParams : undefined,
        );
        const prog = this.ctx.createProgram(programId, fragSource);
        if (prog) {
          this.compiledPrograms.set(programId, true);
        } else {
          console.error(`Failed to compile shader for ${def.shaderId}`);
          continue;
        }
      }

      // Output texture name
      const isResultNode = nodeId === resultNodeId;
      const outputTexture = isResultNode ? '' : `node_${nodeId}_out`;

      // Create output texture if needed (not for result node which renders to canvas)
      if (!isResultNode) {
        const existing = this.ctx.getTexture(outputTexture);
        if (!existing || existing.width !== outputWidth || existing.height !== outputHeight) {
          this.ctx.createManagedTexture(
            outputTexture, outputWidth, outputHeight,
            this.ctx.getBestFormat()
          );
        }
      }

      const step: ExecutionStep = {
        id: `step_${nodeId}`,
        programId,
        fragmentSource: '', // Already compiled
        inputTextures: allInputTextures,
        outputTexture,
        uniforms,
        viewport: { width: outputWidth, height: outputHeight },
        sourceNodeId: nodeId,
      };

      plan.push(step);
      this.stepByNodeId.set(nodeId, step);
    }

    this.lastPlan = plan;
    return plan;
  }

  /**
   * Execute a render plan.
   */
  execute(plan: ExecutionPlan): void {
    for (const step of plan) {
      const inputBindings = step.inputTextures.map((texId, i) => ({
        name: `u_input${i}`,
        textureId: texId,
      }));

      this.ctx.renderPass(
        step.programId,
        step.outputTexture || null,
        inputBindings,
        step.uniforms,
        step.viewport
      );
    }
  }

  /**
   * Convenience: build and execute in one call.
   */
  render(graph: GraphSnapshot, width: number, height: number): void {
    this.ctx.resize(width, height);
    const plan = this.buildExecutionPlan(graph, width, height);
    this.execute(plan);
  }

  /**
   * Update only the uniforms for a specific node (fast path for parameter changes).
   * Uses O(1) step lookup via stepByNodeId and O(1) parameter lookup via parameterMaps.
   * Returns true if the update was applied without recompilation.
   */
  updateNodeUniforms(nodeId: string, parameters: Record<string, number | string | boolean | number[]>): boolean {
    if (!this.lastPlan) return false;

    // O(1) step lookup instead of O(N) .find()
    const step = this.stepByNodeId.get(nodeId);
    if (!step) return false;

    // Extract the base shaderId from programId (remove _mN suffix if present)
    const definitionId = step.programId.replace('shader_', '').replace(/_m\d+$/, '');

    // Use pre-built parameter map for O(1) lookup per parameter
    const paramMap = this.getParameterMap(definitionId);
    if (!paramMap) return false;

    for (const [paramId, paramDef] of paramMap) {
      const value = parameters[paramId] ?? paramDef.defaultValue;
      // Mappable params use underscore-prefixed uniform names
      const uniformKey = paramDef.mappable ? `_u_${paramId}` : `u_${paramId}`;
      if ((paramDef.type === 'color' || paramDef.type === 'hdrColor')) {
        if (typeof value === 'string') {
          step.uniforms[uniformKey] = hexToVec3(value);
        } else if (Array.isArray(value)) {
          // Defensive: convert float array [r,g,b,a?] to vec3
          step.uniforms[uniformKey] = [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
        } else {
          step.uniforms[uniformKey] = value as number | number[] | boolean;
        }
      } else {
        step.uniforms[uniformKey] = value as number | number[] | boolean;
      }
    }
    return true;
  }

  /**
   * Get the result as a data URL.
   */
  toDataURL(): string {
    return this.ctx.getCanvas().toDataURL('image/png');
  }

  dispose(): void {
    this.pool.releaseAll();
    this.ctx.dispose();
  }
}

// ---- Helpers ----

function hexToVec3(hex: string): number[] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [r, g, b];
}
