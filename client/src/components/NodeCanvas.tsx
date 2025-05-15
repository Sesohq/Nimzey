import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  OnNodesChange,
  NodeChange,
  EdgeChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  NodeStore, 
  NodeConnection,
  NodeDataType
} from '@shared/nodeTypes';
import { 
  isConnectionValid, 
  wouldCreateCycle, 
  getTypeColor 
} from '@/lib/nodeEngine';
import BaseNode from './BaseNode';

// Define custom node types
const nodeTypes: NodeTypes = {
  baseNode: BaseNode,
};

// Define custom edge types
const EdgeWithType: React.FC<any> = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  data
}) => {
  const edgeType = data?.type || 'default';
  const color = data?.type ? getTypeColor(data.type as NodeDataType) : '#888';
  
  return (
    <g className="react-flow__edge">
      <path
        id={id}
        className="react-flow__edge-path"
        d={`M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </g>
  );
};

const edgeTypes: EdgeTypes = {
  typed: EdgeWithType,
};

// Convert internal node model to ReactFlow node
const convertToReactFlowNode = (
  node: NodeStore,
  inputConnections: Record<string, Record<string, boolean>>,
  outputConnections: Record<string, Record<string, boolean>>
): Node => {
  return {
    id: node.id,
    type: 'baseNode',
    position: node.position,
    data: {
      ...node,
      inputConnections: inputConnections[node.id] || {},
      outputConnections: outputConnections[node.id] || {},
    },
  };
};

// Convert internal connection model to ReactFlow edge
const convertToReactFlowEdge = (connection: NodeConnection): Edge => {
  return {
    id: connection.id,
    source: connection.sourceNodeId,
    sourceHandle: connection.sourcePortId,
    target: connection.targetNodeId,
    targetHandle: connection.targetPortId,
    type: 'typed',
    data: {
      type: connection.type
    },
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: getTypeColor(connection.type),
    },
  };
};

// Props for the NodeCanvas component
interface NodeCanvasProps {
  nodes: NodeStore[];
  connections: NodeConnection[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onConnectionsChange?: (connections: EdgeChange[]) => void;
  onNodeAdd?: (node: NodeStore) => void;
  onNodeDelete?: (nodeId: string) => void;
  onConnectionAdd?: (connection: NodeConnection) => void;
  onConnectionDelete?: (connectionId: string) => void;
  onNodeToggle?: (nodeId: string, enabled: boolean) => void;
  onNodeCollapse?: (nodeId: string, collapsed: boolean) => void;
  onNodeColorTagChange?: (nodeId: string, color: string) => void;
  onNodeParameterChange?: (nodeId: string, parameterId: string, value: any) => void;
  onSelectionChange?: (nodeIds: string[]) => void;
}

// Connection state tracking helper
const getConnectionStates = (connections: NodeConnection[]) => {
  const inputConnections: Record<string, Record<string, boolean>> = {};
  const outputConnections: Record<string, Record<string, boolean>> = {};
  
  connections.forEach(conn => {
    // Track target connections
    if (!inputConnections[conn.targetNodeId]) {
      inputConnections[conn.targetNodeId] = {};
    }
    
    inputConnections[conn.targetNodeId][conn.targetPortId] = true;
    
    // Track source connections
    if (!outputConnections[conn.sourceNodeId]) {
      outputConnections[conn.sourceNodeId] = {};
    }
    
    outputConnections[conn.sourceNodeId][conn.sourcePortId] = true;
  });
  
  return { inputConnections, outputConnections };
};

// Main NodeCanvas component
const NodeCanvas: React.FC<NodeCanvasProps> = ({
  nodes,
  connections,
  onNodesChange: propOnNodesChange,
  onConnectionsChange,
  onNodeAdd,
  onNodeDelete,
  onConnectionAdd,
  onConnectionDelete,
  onNodeToggle,
  onNodeCollapse,
  onNodeColorTagChange,
  onNodeParameterChange,
  onSelectionChange,
}) => {
  // Convert nodes and connections to ReactFlow format
  const { inputConnections, outputConnections } = useMemo(
    () => getConnectionStates(connections),
    [connections]
  );
  
  const initialNodes = useMemo(
    () => nodes.map(node => convertToReactFlowNode(node, inputConnections, outputConnections)),
    [nodes, inputConnections, outputConnections]
  );
  
  const initialEdges = useMemo(
    () => connections.map(convertToReactFlowEdge),
    [connections]
  );
  
  // State for ReactFlow
  const [reactflowNodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [reactflowEdges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  
  // Update nodes when the props change
  React.useEffect(() => {
    setNodes(
      nodes.map(node => convertToReactFlowNode(node, inputConnections, outputConnections))
    );
  }, [nodes, inputConnections, outputConnections, setNodes]);
  
  // Update edges when the props change
  React.useEffect(() => {
    setEdges(connections.map(convertToReactFlowEdge));
  }, [connections, setEdges]);
  
  // Handle node selection
  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    const selectedIds = selectedNodes.map((node: Node) => node.id);
    setSelectedNodeIds(selectedIds);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [onSelectionChange]);
  
  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (onNodeDelete) {
      onNodeDelete(nodeId);
    }
  }, [onNodeDelete]);
  
  // Handle node toggling
  const handleNodeToggle = useCallback((nodeId: string, enabled: boolean) => {
    if (onNodeToggle) {
      onNodeToggle(nodeId, enabled);
    }
  }, [onNodeToggle]);
  
  // Handle node collapsing
  const handleNodeCollapse = useCallback((nodeId: string, collapsed: boolean) => {
    if (onNodeCollapse) {
      onNodeCollapse(nodeId, collapsed);
    }
  }, [onNodeCollapse]);
  
  // Handle color tag changes
  const handleColorTagChange = useCallback((nodeId: string, color: string) => {
    if (onNodeColorTagChange) {
      onNodeColorTagChange(nodeId, color);
    }
  }, [onNodeColorTagChange]);
  
  // Handle parameter changes
  const handleParameterChange = useCallback((nodeId: string, parameterId: string, value: any) => {
    if (onNodeParameterChange) {
      onNodeParameterChange(nodeId, parameterId, value);
    }
  }, [onNodeParameterChange]);
  
  // Handle connection changes
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    // Check if the connection is valid
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) return;
    
    // Check if the connection would create a cycle
    if (wouldCreateCycle(connection.source, connection.target, nodes, connections)) {
      console.warn('Connection would create a cycle, ignoring');
      return;
    }
    
    // Check if the connection is valid based on types
    if (!connection.sourceHandle || !connection.targetHandle) return;
    
    const isValid = isConnectionValid(
      sourceNode,
      connection.sourceHandle,
      targetNode,
      connection.targetHandle
    );
    
    if (!isValid) {
      console.warn('Connection types are incompatible, ignoring');
      return;
    }
    
    // Find the type of the connection
    const sourcePort = sourceNode.outputs.find(port => port.id === connection.sourceHandle);
    if (!sourcePort) return;
    
    // Create the new connection
    const newConnection: NodeConnection = {
      id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
      sourceNodeId: connection.source,
      sourcePortId: connection.sourceHandle,
      targetNodeId: connection.target,
      targetPortId: connection.targetHandle,
      type: sourcePort.type
    };
    
    if (onConnectionAdd) {
      onConnectionAdd(newConnection);
    }
  }, [nodes, connections, onConnectionAdd]);
  
  // Handle ReactFlow node changes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (propOnNodesChange) {
      propOnNodesChange(changes);
    }
  }, [propOnNodesChange]);
  
  // Handle ReactFlow edge changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (onConnectionsChange) {
      onConnectionsChange(changes);
    }
  }, [onConnectionsChange]);
  
  return (
    <div className="w-full h-full flex">
      <ReactFlow
        nodes={reactflowNodes}
        edges={reactflowEdges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={4}
        nodesDraggable
        elementsSelectable
        selectNodesOnDrag={false}
        snapToGrid
        snapGrid={[10, 10]}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default NodeCanvas;