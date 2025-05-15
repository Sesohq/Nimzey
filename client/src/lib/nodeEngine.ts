import { 
  NodeStore, 
  NodeConnection,
  NodeParameter,
  NodeDataType
} from '@shared/nodeTypes';

import { getNodeDefinition } from './nodeDefinitions';

// Determine the handle color based on data type
export const getTypeColor = (type: NodeDataType): string => {
  switch (type) {
    case 'image': return '#3B82F6'; // blue
    case 'mask': return '#A3A3A3';  // gray
    case 'float': return '#10B981'; // green
    case 'color': return '#F59E0B'; // yellow
    case 'vector2': return '#8B5CF6'; // purple
    case 'texture': return '#EC4899'; // pink
    case 'boolean': return '#F97316'; // orange
    case 'string': return '#14B8A6'; // teal
    case 'blendSettings': return '#06B6D4'; // cyan
    default: return '#3B82F6'; // blue default
  }
};

// Class to hold temporary processing results
export class NodeResultCache {
  private cache: Map<string, Record<string, any>> = new Map();
  
  clear(): void {
    this.cache.clear();
  }
  
  set(nodeId: string, portId: string, value: any): void {
    if (!this.cache.has(nodeId)) {
      this.cache.set(nodeId, {});
    }
    const nodeResults = this.cache.get(nodeId)!;
    nodeResults[portId] = value;
  }
  
  get(nodeId: string, portId: string): any {
    return this.cache.get(nodeId)?.[portId] || null;
  }
  
  hasNode(nodeId: string): boolean {
    return this.cache.has(nodeId);
  }
  
  hasResult(nodeId: string, portId: string): boolean {
    return !!this.cache.get(nodeId)?.[portId];
  }
  
  getNodeResults(nodeId: string): Record<string, any> {
    return this.cache.get(nodeId) || {};
  }
}

// Find all nodes that connect to a given node
export const getSourceNodesForNode = (
  targetNodeId: string,
  nodes: NodeStore[],
  connections: NodeConnection[]
): Record<string, { nodeId: string, portId: string }> => {
  const result: Record<string, { nodeId: string, portId: string }> = {};
  
  // Find all connections targeting this node
  const incomingConnections = connections.filter(
    conn => conn.targetNodeId === targetNodeId
  );
  
  // Map each target port to its source
  incomingConnections.forEach(conn => {
    result[conn.targetPortId] = {
      nodeId: conn.sourceNodeId,
      portId: conn.sourcePortId
    };
  });
  
  return result;
};

// Find all nodes that a given node connects to
export const getTargetNodesForNode = (
  sourceNodeId: string,
  nodes: NodeStore[],
  connections: NodeConnection[]
): Record<string, { nodeId: string, portId: string }[]> => {
  const result: Record<string, { nodeId: string, portId: string }[]> = {};
  
  // Find all connections sourced from this node
  const outgoingConnections = connections.filter(
    conn => conn.sourceNodeId === sourceNodeId
  );
  
  // Group by source port
  outgoingConnections.forEach(conn => {
    if (!result[conn.sourcePortId]) {
      result[conn.sourcePortId] = [];
    }
    
    result[conn.sourcePortId].push({
      nodeId: conn.targetNodeId,
      portId: conn.targetPortId
    });
  });
  
  return result;
};

// Check if connection would create a cycle
export const wouldCreateCycle = (
  sourceNodeId: string,
  targetNodeId: string,
  nodes: NodeStore[],
  connections: NodeConnection[]
): boolean => {
  // If source and target are the same, that's a cycle
  if (sourceNodeId === targetNodeId) return true;
  
  // Do a depth-first search to see if there's a path from target back to source
  const visited = new Set<string>();
  const toVisit = [targetNodeId];
  
  while (toVisit.length > 0) {
    const currentId = toVisit.pop()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    // Get all nodes this one connects to
    const outConnections = connections.filter(
      conn => conn.sourceNodeId === currentId
    );
    
    for (const conn of outConnections) {
      if (conn.targetNodeId === sourceNodeId) {
        // Found a path back to the source
        return true;
      }
      
      if (!visited.has(conn.targetNodeId)) {
        toVisit.push(conn.targetNodeId);
      }
    }
  }
  
  return false;
};

// Check if a connection is valid based on data types
export const isConnectionValid = (
  sourceNode: NodeStore,
  sourcePortId: string,
  targetNode: NodeStore,
  targetPortId: string
): boolean => {
  // Find the source output port
  const sourcePort = sourceNode.outputs.find(port => port.id === sourcePortId);
  
  // Find the target input port or parameter
  const targetInputPort = targetNode.inputs.find(port => port.id === targetPortId);
  const targetParam = targetNode.parameters.find(param => param.id === targetPortId);
  
  // We need at least a source and one of the target options
  if (!sourcePort) return false;
  if (!targetInputPort && !targetParam) return false;
  
  // Check if data types are compatible
  if (targetInputPort) {
    return sourcePort.type === targetInputPort.type;
  }
  
  if (targetParam) {
    return sourcePort.type === targetParam.type;
  }
  
  return false;
};

// Check if a parameter can receive connections
export const canParameterReceiveConnections = (
  parameter: NodeParameter
): boolean => {
  // Check for parameters that can't be connected to
  return true; // For now all parameters can be connected
};

// Find source nodes for the graph (nodes without inputs or only unconnected inputs)
export const findSourceNodes = (
  nodes: NodeStore[],
  connections: NodeConnection[]
): NodeStore[] => {
  return nodes.filter(node => {
    if (node.inputs.length === 0) {
      // This is a generator node (no inputs)
      return true;
    }
    
    // Check if any of the inputs are connected
    const incomingConnections = connections.filter(
      conn => conn.targetNodeId === node.id
    );
    
    return incomingConnections.length === 0;
  });
};

// Find all nodes that need to be processed in order
export const buildProcessingOrder = (
  nodes: NodeStore[],
  connections: NodeConnection[]
): NodeStore[] => {
  const result: NodeStore[] = [];
  const visited = new Set<string>();
  
  // Get all source nodes
  const sourceNodes = findSourceNodes(nodes, connections);
  
  // Function to traverse the graph
  const visit = (node: NodeStore) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    
    // Add this node to the result
    result.push(node);
    
    // Find all target nodes and visit them
    const targetNodes = getTargetNodesForNode(node.id, nodes, connections);
    
    Object.values(targetNodes).forEach(targets => {
      targets.forEach(target => {
        const targetNode = nodes.find(n => n.id === target.nodeId);
        if (targetNode) {
          visit(targetNode);
        }
      });
    });
  };
  
  // Visit all source nodes
  sourceNodes.forEach(visit);
  
  return result;
};

// Process a single node
export const processNode = (
  node: NodeStore,
  nodes: NodeStore[],
  connections: NodeConnection[],
  resultCache: NodeResultCache
): void => {
  // Skip disabled nodes
  if (!node.enabled) return;
  
  // Get the node definition
  const definition = getNodeDefinition(node.type);
  if (!definition || !definition.process) return;
  
  // Get all input values
  const inputData: Record<string, any> = {};
  const sourceNodes = getSourceNodesForNode(node.id, nodes, connections);
  
  // Process regular inputs (ports)
  node.inputs.forEach(input => {
    const source = sourceNodes[input.id];
    if (source) {
      inputData[input.id] = resultCache.get(source.nodeId, source.portId);
    }
  });
  
  // Process parameter inputs (connected parameters)
  node.parameters.forEach(param => {
    const source = sourceNodes[param.id];
    
    if (source) {
      // If parameter is connected, get value from the source
      inputData[param.id] = resultCache.get(source.nodeId, source.portId);
    } else {
      // Otherwise use the parameter's own value
      inputData[param.id] = param.value;
    }
  });
  
  // Process the node
  const results = definition.process(node, inputData);
  
  // Store the results in the cache
  if (results) {
    Object.entries(results).forEach(([portId, value]) => {
      resultCache.set(node.id, portId, value);
    });
  }
};

// Process the entire node graph
export const processNodeGraph = (
  nodes: NodeStore[],
  connections: NodeConnection[]
): NodeResultCache => {
  const resultCache = new NodeResultCache();
  resultCache.clear();
  
  // Build the processing order
  const processingOrder = buildProcessingOrder(nodes, connections);
  
  // Process each node in order
  processingOrder.forEach(node => {
    processNode(node, nodes, connections, resultCache);
  });
  
  return resultCache;
};

// Get the final output from the graph
export const getFinalOutput = (
  nodes: NodeStore[],
  connections: NodeConnection[],
  resultCache: NodeResultCache
): any => {
  // Find the output node(s)
  const outputNodes = nodes.filter(node => {
    const definition = getNodeDefinition(node.type);
    return definition?.category === 'output';
  });
  
  if (outputNodes.length === 0) {
    return null;
  }
  
  // Get the output from the first output node
  const outputNode = outputNodes[0];
  const sourceNodes = getSourceNodesForNode(outputNode.id, nodes, connections);
  
  if (!sourceNodes['input']) {
    return null;
  }
  
  const source = sourceNodes['input'];
  return resultCache.get(source.nodeId, source.portId);
};