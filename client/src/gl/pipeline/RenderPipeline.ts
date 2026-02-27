/**
 * RenderPipeline - Compiles a node graph into an execution plan and renders it.
 *
 * Flow: GraphState -> buildExecutionPlan() -> optimize() -> execute()
 */

import { GLContext, TexturePool } from '../core/GLContext';
import { ShaderDefinition, compileFragmentShader } from '../shaders/ShaderDefinition';
import { GraphNode, GraphEdge, DataType, ExecutionStep, ExecutionPlan, QualityLevel } from '@/types';
import { NodeRegistry } from '@/registry/NodeRegistry';
import { ShaderLibrary } from '../shaders/library';

interface GraphSnapshot {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

export class RenderPipeline {
  private ctx: GLContext;
  private pool: TexturePool;
  private compiledPrograms = new Map<string, boolean>();
  public lastPlan: ExecutionPlan | null = null;

  constructor(ctx: GLContext) {
    this.ctx = ctx;
    this.pool = new TexturePool(ctx);
  }

  /**
   * Build an execution plan from the graph state.
   * Performs topological sort and maps each node to a render pass.
   */
  buildExecutionPlan(graph: GraphSnapshot, outputWidth: number, outputHeight: number): ExecutionPlan {
    const plan: ExecutionPlan = [];

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

    // Generate execution steps for each node in topological order
    for (const nodeId of sortedNodeIds) {
      const node = graph.nodes.get(nodeId);
      if (!node || !node.enabled) continue;

      const def = NodeRegistry.get(node.definitionId);
      if (!def) continue;

      const shaderDef = ShaderLibrary.get(def.shaderId);
      if (!shaderDef) continue;

      // Determine input textures from incoming edges
      const inputTextures: string[] = [];
      const inputBindings: { name: string; textureId: string }[] = [];
      const incoming = incomingByNode.get(nodeId);

      for (let i = 0; i < def.inputs.length; i++) {
        const port = def.inputs[i];
        const edge = incoming?.get(port.id);
        if (edge) {
          const texId = `node_${edge.sourceNodeId}_out`;
          inputTextures.push(texId);
          inputBindings.push({ name: `u_input${i}`, textureId: texId });
        }
      }

      // Build uniforms from node parameters
      const uniforms: Record<string, number | number[] | boolean | string> = {};
      for (const paramDef of def.parameters) {
        const value = node.parameters[paramDef.id] ?? paramDef.defaultValue;
        if (typeof value === 'string' && (paramDef.type === 'color' || paramDef.type === 'hdrColor')) {
          uniforms[`u_${paramDef.id}`] = hexToVec3(value);
        } else {
          uniforms[`u_${paramDef.id}`] = value as number | number[] | boolean;
        }
      }

      // Tell shaders how many inputs are connected (for optional input detection)
      uniforms['u_inputCount'] = inputTextures.length;

      // Compile shader program if needed
      const programId = `shader_${def.shaderId}`;
      if (!this.compiledPrograms.has(programId)) {
        const fragSource = compileFragmentShader(shaderDef, Math.max(shaderDef.inputCount, def.inputs.length));
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

      plan.push({
        id: `step_${nodeId}`,
        programId,
        fragmentSource: '', // Already compiled
        inputTextures: inputBindings.map(b => b.textureId),
        outputTexture,
        uniforms,
        viewport: { width: outputWidth, height: outputHeight },
        sourceNodeId: nodeId,
      });
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
   * Returns true if the update was applied without recompilation.
   */
  updateNodeUniforms(nodeId: string, parameters: Record<string, number | string | boolean | number[]>): boolean {
    if (!this.lastPlan) return false;
    const step = this.lastPlan.find(s => s.sourceNodeId === nodeId);
    if (!step) return false;

    const node = { parameters } as GraphNode;
    const def = NodeRegistry.get(step.programId.replace('shader_', ''));
    if (!def) return false;

    for (const paramDef of def.parameters) {
      const value = parameters[paramDef.id] ?? paramDef.defaultValue;
      if (typeof value === 'string' && (paramDef.type === 'color' || paramDef.type === 'hdrColor')) {
        step.uniforms[`u_${paramDef.id}`] = hexToVec3(value);
      } else {
        step.uniforms[`u_${paramDef.id}`] = value as number | number[] | boolean;
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
