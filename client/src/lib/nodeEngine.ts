import { 
  NodeDataType,
  NodeParameter,
  NodePort,
  NodeStore,
  NodeConnection
} from '@shared/nodeTypes';
import { v4 as uuidv4 } from 'uuid';

// Color mapping for data types
export const getTypeColor = (type: NodeDataType): string => {
  switch (type) {
    case 'image':
      return '#3b82f6'; // blue-500
    case 'mask':
      return '#8b5cf6'; // purple-500
    case 'float':
      return '#22c55e'; // green-500
    case 'color':
      return '#eab308'; // yellow-500
    case 'vector2':
      return '#f97316'; // orange-500
    case 'texture':
      return '#6366f1'; // indigo-500
    case 'boolean':
      return '#ef4444'; // red-500
    case 'string':
      return '#6b7280'; // gray-500
    case 'blendSettings':
      return '#ec4899'; // pink-500
    default:
      return '#9ca3af'; // gray-400
  }
};

// Type compatibility checking
export const areTypesCompatible = (sourceType: NodeDataType, targetType: NodeDataType): boolean => {
  // Same types are always compatible
  if (sourceType === targetType) return true;
  
  // Type-specific conversions
  switch (targetType) {
    case 'float':
      // Color channels can be converted to float
      return sourceType === 'color';
      
    case 'mask':
      // Image alpha can be used as mask
      return sourceType === 'image';
      
    case 'image':
      // Textures can be used as images, masks can be displayed as grayscale images
      return sourceType === 'texture' || sourceType === 'mask';
      
    default:
      return false;
  }
};

// Check if a connection between nodes is valid based on port types
export const isConnectionValid = (
  sourceNode: NodeStore,
  sourcePortId: string,
  targetNode: NodeStore,
  targetPortId: string
): boolean => {
  // Find the source port (could be an output port or a parameter)
  const sourceOutputPort = sourceNode.outputs.find(port => port.id === sourcePortId);
  const sourceParameter = sourceNode.parameters.find(param => param.id === sourcePortId);
  
  if (!sourceOutputPort && !sourceParameter) {
    console.warn(`Source port ${sourcePortId} not found on node ${sourceNode.id}`);
    return false;
  }
  
  // Find the target port (could be an input port or a parameter)
  const targetInputPort = targetNode.inputs.find(port => port.id === targetPortId);
  const targetParameter = targetNode.parameters.find(param => param.id === targetPortId);
  
  if (!targetInputPort && !targetParameter) {
    console.warn(`Target port ${targetPortId} not found on node ${targetNode.id}`);
    return false;
  }
  
  // Get the types
  const sourceType = sourceOutputPort?.type || sourceParameter?.type;
  const targetType = targetInputPort?.type || targetParameter?.type;
  
  if (!sourceType || !targetType) {
    console.warn('Source or target type not found');
    return false;
  }
  
  // Check type compatibility
  return areTypesCompatible(sourceType, targetType);
};

// Check if a new connection would create a cycle in the graph
export const wouldCreateCycle = (
  sourceId: string,
  targetId: string,
  nodes: NodeStore[],
  connections: NodeConnection[]
): boolean => {
  // Creating a connection to yourself is always a cycle
  if (sourceId === targetId) return true;
  
  // Helper function to find downstream nodes
  const findDownstreamNodes = (nodeId: string, visited = new Set<string>()): boolean => {
    // If we've seen this node already, we found a cycle
    if (visited.has(nodeId)) return false;
    
    // Add this node to visited
    visited.add(nodeId);
    
    // For all outgoing connections from this node
    const outgoingConnections = connections.filter(conn => conn.sourceNodeId === nodeId);
    
    for (const conn of outgoingConnections) {
      // If any downstream node is the original source, we have a cycle
      if (conn.targetNodeId === sourceId) {
        return true;
      }
      
      // Recursively check downstream nodes
      const newVisited = new Set<string>(visited);
      if (findDownstreamNodes(conn.targetNodeId, newVisited)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Start the search from the target node
  return findDownstreamNodes(targetId);
};

// Cache for storing processing results
export class NodeResultCache {
  private cache: Map<string, Map<string, any>>;
  
  constructor() {
    this.cache = new Map();
  }
  
  set(nodeId: string, portId: string, value: any): void {
    if (!this.cache.has(nodeId)) {
      this.cache.set(nodeId, new Map());
    }
    
    this.cache.get(nodeId)?.set(portId, value);
  }
  
  get(nodeId: string, portId: string): any {
    return this.cache.get(nodeId)?.get(portId);
  }
  
  has(nodeId: string, portId: string): boolean {
    const nodeCache = this.cache.get(nodeId);
    if (!nodeCache) return false;
    return !!nodeCache.has(portId);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Sort nodes in processing order (topological sort)
export const sortNodesForProcessing = (
  nodes: NodeStore[],
  connections: NodeConnection[]
): NodeStore[] => {
  const visited = new Set<string>();
  const result: NodeStore[] = [];
  
  // Helper function for depth-first traversal
  const visit = (nodeId: string): void => {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    
    // Process all incoming connections first
    const incomingConnections = connections.filter(conn => conn.targetNodeId === nodeId);
    
    for (const conn of incomingConnections) {
      visit(conn.sourceNodeId);
    }
    
    // Add this node to the result
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      result.push(node);
    }
  };
  
  // Start with nodes that have no outgoing connections (endpoints)
  const startNodes = nodes.filter(node => 
    !connections.some(conn => conn.sourceNodeId === node.id)
  );
  
  // If there are no endpoints, just process all nodes
  if (startNodes.length === 0) {
    for (const node of nodes) {
      visit(node.id);
    }
  } else {
    for (const node of startNodes) {
      visit(node.id);
    }
  }
  
  // Add any remaining nodes that weren't visited (disconnected nodes)
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      result.push(node);
    }
  }
  
  return result;
};

// Get input data for a node based on its connections
export const getNodeInputs = (
  node: NodeStore,
  connections: NodeConnection[],
  resultCache: NodeResultCache
): Record<string, any> => {
  const inputs: Record<string, any> = {};
  
  // Find all connections targeting this node
  const incomingConnections = connections.filter(conn => conn.targetNodeId === node.id);
  
  // Gather data from incoming connections
  for (const conn of incomingConnections) {
    // Get the cached result from the source node
    const value = resultCache.get(conn.sourceNodeId, conn.sourcePortId);
    
    if (value !== undefined) {
      inputs[conn.targetPortId] = value;
    }
  }
  
  // For parameters without connections, use their default values
  node.parameters.forEach(param => {
    if (inputs[param.id] === undefined) {
      inputs[param.id] = param.value !== undefined ? param.value : param.defaultValue;
    }
  });
  
  // For input ports without connections, use undefined
  node.inputs.forEach(input => {
    if (inputs[input.id] === undefined) {
      inputs[input.id] = undefined;
    }
  });
  
  return inputs;
};

// Process the entire node graph and return the results
export const processNodeGraph = (
  nodes: NodeStore[],
  connections: NodeConnection[]
): NodeResultCache => {
  const resultCache = new NodeResultCache();
  
  // Sort nodes for processing
  const sortedNodes = sortNodesForProcessing(nodes, connections);
  
  // Process each node in order
  for (const node of sortedNodes) {
    // Skip disabled nodes
    if (!node.enabled) continue;
    
    try {
      // Get inputs for this node
      const inputs = getNodeInputs(node, connections, resultCache);
      
      // For now, we'll generate synthetic previews since we don't have the actual node processing
      // In a real implementation, this would call the node's process function
      
      // For each output port, generate a result
      node.outputs.forEach(output => {
        // For demonstration purposes
        if (output.type === 'image' || output.type === 'mask' || output.type === 'texture') {
          // Generate a fake image or placeholder
          resultCache.set(node.id, output.id, createPlaceholderImage(node.id, output.id));
        } else if (output.type === 'float') {
          resultCache.set(node.id, output.id, Math.random() * 100);
        } else if (output.type === 'color') {
          resultCache.set(node.id, output.id, '#' + Math.floor(Math.random()*16777215).toString(16));
        } else if (output.type === 'boolean') {
          // Ensure we return a boolean and not undefined
          resultCache.set(node.id, output.id, Math.random() > 0.5 ? true : false);
        } else {
          resultCache.set(node.id, output.id, 'Result for ' + output.id);
        }
      });
    } catch (error) {
      console.error(`Error processing node ${node.id}:`, error);
    }
  }
  
  return resultCache;
};

// Get the final output of the node graph
export const getFinalOutput = (
  nodes: NodeStore[],
  connections: NodeConnection[],
  resultCache: NodeResultCache
): string | null => {
  // Find output nodes
  const outputNodes = nodes.filter(node => 
    node.type.startsWith('output') && node.enabled
  );
  
  if (outputNodes.length === 0) {
    // If no output nodes, find leaf nodes (nodes with no outgoing connections)
    const leafNodes = nodes.filter(node => 
      node.enabled && 
      !connections.some(conn => conn.sourceNodeId === node.id)
    );
    
    if (leafNodes.length === 0) {
      return null;
    }
    
    // Use the first leaf node's output
    const leafNode = leafNodes[0];
    if (leafNode.outputs.length > 0) {
      const outputPort = leafNode.outputs[0];
      return resultCache.get(leafNode.id, outputPort.id);
    }
  } else {
    // Use the first output node
    const outputNode = outputNodes[0];
    
    // Find its input
    const inputPort = outputNode.inputs[0];
    if (!inputPort) return null;
    
    // Find connections to this input
    const inputConnection = connections.find(conn => 
      conn.targetNodeId === outputNode.id && conn.targetPortId === inputPort.id
    );
    
    if (inputConnection) {
      return resultCache.get(inputConnection.sourceNodeId, inputConnection.sourcePortId);
    }
  }
  
  return null;
};

// Helper function to create placeholder images for previews
function createPlaceholderImage(nodeId: string, outputId: string): string {
  // Create a canvas element to draw on
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Fill with a gradient based on nodeId hash
  const hash = hashString(nodeId + outputId);
  const hue1 = hash % 360;
  const hue2 = (hash * 1.5) % 360;
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${hue1}, 70%, 60%)`);
  gradient.addColorStop(1, `hsl(${hue2}, 70%, 60%)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw a pattern based on hash
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  const size = 10 + (hash % 20);
  for (let x = 0; x < canvas.width; x += size * 2) {
    for (let y = 0; y < canvas.height; y += size * 2) {
      ctx.fillRect(x, y, size, size);
    }
  }
  
  // Draw node and port IDs for debugging
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Node: ${nodeId.slice(0, 8)}...`, 10, 20);
  ctx.fillText(`Port: ${outputId}`, 10, 40);
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

// Simple hash function for strings
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}