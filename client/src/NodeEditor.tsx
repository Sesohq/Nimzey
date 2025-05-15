import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  NodeStore,
  NodeConnection,
  NodeParameter,
  NodeCategory
} from '@shared/nodeTypes';
import { NodeChange, EdgeChange } from 'reactflow';
import { getNodeDefinition, createNodeInstance } from './lib/nodeDefinitions';
import { 
  processNodeGraph, 
  getFinalOutput,
  NodeResultCache 
} from './lib/nodeEngine';

// Import components
import FilterPanel from './components/FilterPanel';
import NodeCanvas from './components/NodeCanvas';
import PreviewPanel from './components/PreviewPanel';

// Main editor component for the node-based filtering system
export const NodeEditor: React.FC = () => {
  // Application state
  const [nodes, setNodes] = useState<NodeStore[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [nodePreviews, setNodePreviews] = useState<Record<string, string>>({});
  
  // Process the node graph when nodes or connections change
  useEffect(() => {
    if (nodes.length === 0) return;
    
    try {
      const resultCache = processNodeGraph(nodes, connections);
      
      // Get the final output
      const output = getFinalOutput(nodes, connections, resultCache);
      setFinalOutput(output);
      
      // Update previews for all nodes
      const previews: Record<string, string> = {};
      nodes.forEach(node => {
        const def = getNodeDefinition(node.type);
        if (def && def.outputs.length > 0) {
          const outputPort = def.outputs[0].id;
          const preview = resultCache.get(node.id, outputPort);
          if (preview) {
            previews[node.id] = preview;
          }
        }
      });
      
      setNodePreviews(previews);
    } catch (error) {
      console.error('Error processing node graph:', error);
    }
  }, [nodes, connections]);
  
  // Handle node changes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // React Flow changes like position
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        for (const change of changes) {
          if (change.type === 'position' && change.id === node.id && change.position) {
            return {
              ...node,
              position: change.position
            };
          }
        }
        return node;
      });
    });
  }, []);
  
  // Handle adding a new node
  const handleNodeAdd = useCallback((node: NodeStore) => {
    setNodes(prevNodes => [...prevNodes, node]);
  }, []);
  
  // Handle creating a new node from scratch
  const handleCreateNode = useCallback((nodeType: string, position: { x: number, y: number }) => {
    const definition = getNodeDefinition(nodeType);
    if (!definition) {
      console.error(`No node definition found for type: ${nodeType}`);
      return;
    }
    
    const newNode = createNodeInstance(definition, position);
    handleNodeAdd(newNode);
  }, [handleNodeAdd]);
  
  // Handle deleting a node
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    setConnections(prevConnections => 
      prevConnections.filter(conn => 
        conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      )
    );
  }, []);
  
  // Handle toggling a node on/off
  const handleNodeToggle = useCallback((nodeId: string, enabled: boolean) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, enabled } : node
      )
    );
  }, []);
  
  // Handle collapsing a node
  const handleNodeCollapse = useCallback((nodeId: string, collapsed: boolean) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, collapsed } : node
      )
    );
  }, []);
  
  // Handle changing node color tag
  const handleNodeColorTagChange = useCallback((nodeId: string, colorTag: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, colorTag } : node
      )
    );
  }, []);
  
  // Handle changing parameter values
  const handleNodeParameterChange = useCallback((nodeId: string, parameterId: string, value: any) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          const updatedParams = node.parameters.map(param => 
            param.id === parameterId ? { ...param, value } : param
          );
          return { ...node, parameters: updatedParams };
        }
        return node;
      })
    );
  }, []);
  
  // Handle adding a connection
  const handleConnectionAdd = useCallback((connection: NodeConnection) => {
    setConnections(prevConnections => [...prevConnections, connection]);
  }, []);
  
  // Handle deleting a connection
  const handleConnectionDelete = useCallback((connectionId: string) => {
    setConnections(prevConnections => 
      prevConnections.filter(conn => conn.id !== connectionId)
    );
  }, []);
  
  // Handle selection change
  const handleSelectionChange = useCallback((nodeIds: string[]) => {
    setSelectedNodeIds(nodeIds);
  }, []);
  
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <header className="bg-gray-900 text-white p-4">
          <h1 className="text-lg font-bold">FilterKit</h1>
          <p className="text-sm text-gray-300">Node-based image filtering system</p>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/5 min-w-[220px] border-r">
            <FilterPanel 
              onAddNode={(nodeDefinition) => {
                // We receive a NodeDefinition from FilterPanel and use it to create a node
                handleCreateNode(nodeDefinition.id, { x: 100, y: 100 });
              }}
              className="h-full"
            />
          </div>
          
          <div className="flex-1">
            <NodeCanvas 
              nodes={nodes}
              connections={connections}
              onNodesChange={handleNodesChange}
              onNodeDelete={handleNodeDelete}
              onConnectionAdd={handleConnectionAdd}
              onConnectionDelete={handleConnectionDelete}
              onNodeToggle={handleNodeToggle}
              onNodeCollapse={handleNodeCollapse}
              onNodeColorTagChange={handleNodeColorTagChange}
              onNodeParameterChange={handleNodeParameterChange}
              onSelectionChange={handleSelectionChange}
            />
          </div>
          
          <div className="w-1/4 min-w-[250px] border-l">
            <PreviewPanel 
              previewImage={finalOutput || undefined}
              selectedNodeId={selectedNodeIds[0]}
              nodePreviews={nodePreviews}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default NodeEditor;