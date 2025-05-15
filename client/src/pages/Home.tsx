import React, { useState, useCallback, useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { 
  NodeStore,
  NodeConnection,
  NodeParameter,
  NodeCategory
} from '@shared/nodeTypes';
import { NodeChange, EdgeChange } from 'reactflow';
import { getNodeDefinition } from '@/lib/nodeDefinitions';
import { 
  processNodeGraph, 
  getFinalOutput,
  NodeResultCache 
} from '@/lib/nodeEngine';

import FilterPanel from '@/components/FilterPanel';
import NodeCanvas from '@/components/NodeCanvas';
import PreviewPanel from '@/components/PreviewPanel';

const Home = () => {
  // Application state
  const [nodes, setNodes] = useState<NodeStore[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [nodePreviews, setNodePreviews] = useState<Record<string, string>>({});
  
  // Process the node graph when nodes or connections change
  useEffect(() => {
    if (nodes.length === 0) return;
    
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
  }, [nodes, connections]);
  
  // Handle node changes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // React Flow changes like position
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        const change = changes.find(c => c.id === node.id);
        if (change && change.type === 'position' && change.position) {
          return {
            ...node,
            position: change.position
          };
        }
        return node;
      });
    });
  }, []);
  
  // Handle adding a new node
  const handleNodeAdd = useCallback((node: NodeStore) => {
    setNodes(prevNodes => [...prevNodes, node]);
  }, []);
  
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
    <div className="h-screen w-screen flex flex-col">
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">FilterKit</h1>
        
        <div className="flex items-center space-x-4">
          <button className="px-3 py-1 hover:bg-gray-800 rounded">File</button>
          <button className="px-3 py-1 hover:bg-gray-800 rounded">Edit</button>
          <button className="px-3 py-1 hover:bg-gray-800 rounded">View</button>
          <button className="px-3 py-1 hover:bg-gray-800 rounded">Help</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15}>
            <FilterPanel 
              onAddNode={handleNodeAdd}
              className="h-full"
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={55}>
            <NodeCanvas 
              nodes={nodes}
              connections={connections}
              onNodesChange={handleNodesChange}
              onNodeAdd={handleNodeAdd}
              onNodeDelete={handleNodeDelete}
              onConnectionAdd={handleConnectionAdd}
              onConnectionDelete={handleConnectionDelete}
              onNodeToggle={handleNodeToggle}
              onNodeCollapse={handleNodeCollapse}
              onNodeColorTagChange={handleNodeColorTagChange}
              onNodeParameterChange={handleNodeParameterChange}
              onSelectionChange={handleSelectionChange}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={25} minSize={20}>
            <PreviewPanel 
              previewImage={finalOutput || undefined}
              selectedNodeId={selectedNodeIds[0]}
              nodePreviews={nodePreviews}
              className="h-full"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedNodeIds.length > 0 
            ? `Selected: ${selectedNodeIds.join(', ')}` 
            : 'No nodes selected'}
        </div>
        
        <div className="text-sm text-gray-600">
          {nodes.length} nodes | {connections.length} connections
        </div>
      </div>
    </div>
  );
};

export default Home;