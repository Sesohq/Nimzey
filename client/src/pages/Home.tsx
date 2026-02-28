/**
 * EditorPage - Main editor with document loading, auto-save, and multi-tab support.
 * Also exported as default "Home" for backwards compatibility.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { useLocation, useParams } from 'wouter';

import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import NodeCanvas from '@/components/NodeCanvas';
import PreviewPanel from '@/components/PreviewPanel';
import DocumentTabs, { DocumentTab } from '@/components/DocumentTabs';
import NewDocumentDialog, { NewDocumentResult } from '@/components/NewDocumentDialog';
import { useNimzeyGraph } from '@/hooks/useNimzeyGraph';
import { loadDocument, saveDocument, NimzeyDocument } from '@/stores/documentStore';
import { serializeGraph } from '@/utils/graphSerializer';
import { NodeRegistry } from '@/registry/nodes';

function EditorContent({ docId }: { docId: string }) {
  const [, setLocation] = useLocation();
  const [doc, setDoc] = useState<NimzeyDocument | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Tab state
  const [openTabs, setOpenTabs] = useState<DocumentTab[]>([]);
  const [activeTabId, setActiveTabId] = useState(docId);

  // Canvas dimensions from document
  const canvasWidth = doc?.width || 512;
  const canvasHeight = doc?.height || 512;

  const graph = useNimzeyGraph({ quality: 'draft', width: canvasWidth, height: canvasHeight });
  const [leftPanelWidth] = useState(260);

  // Auto-save timer ref
  const autoSaveTimer = useRef<number | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;
  const graphRef = useRef(graph);
  graphRef.current = graph;

  // Load document on mount / when docId changes
  useEffect(() => {
    const loadedDoc = loadDocument(docId);
    if (loadedDoc) {
      setDoc(loadedDoc);
      graph.loadFromSerialized(loadedDoc.graphData);
      setLoaded(true);

      // Set up tabs
      setOpenTabs(prev => {
        const exists = prev.some(t => t.id === loadedDoc.id);
        if (exists) return prev;
        return [...prev, {
          id: loadedDoc.id,
          name: loadedDoc.name,
          width: loadedDoc.width,
          height: loadedDoc.height,
        }];
      });
      setActiveTabId(loadedDoc.id);
    } else {
      // Document not found - redirect to home
      setLocation('/');
    }
  }, [docId]);

  // Undo/Redo keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Skip when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        graphRef.current.undo();
      }
      if ((e.key === 'z' && e.shiftKey) || (e.key === 'y' && !e.shiftKey)) {
        e.preventDefault();
        graphRef.current.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-save: debounced save on structural graph changes (node/edge/parameter mutations).
  // Uses structuralVersion instead of graphState to avoid infinite loops from preview thumbnail updates.
  useEffect(() => {
    if (!loaded || !docRef.current) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = window.setTimeout(() => {
      const currentDoc = docRef.current;
      if (!currentDoc) return;

      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;

      saveDocument({
        ...currentDoc,
        graphData,
        thumbnail,
        updatedAt: Date.now(),
      });
    }, 2000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [graph.structuralVersion, loaded]);

  const handleNewProject = useCallback(() => {
    setShowNewDialog(true);
  }, []);

  const handleCreateNew = useCallback((result: NewDocumentResult) => {
    // Save current document before switching
    if (docRef.current) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      saveDocument({ ...docRef.current, graphData, updatedAt: Date.now() });
    }

    // Create new document
    const id = crypto.randomUUID();
    const now = Date.now();
    const resultNode = {
      id: 'result-node',
      definitionId: 'result',
      position: { x: 500, y: 200 },
      parameters: NodeRegistry.get('result')?.parameters.reduce((acc, p) => {
        acc[p.id] = p.defaultValue;
        return acc;
      }, {} as Record<string, any>) || {},
      enabled: true,
      collapsed: false,
      colorTag: 'default',
    };
    const nodes = new Map();
    nodes.set(resultNode.id, resultNode);
    const edges = new Map();

    const newDoc: NimzeyDocument = {
      id,
      name: result.name,
      width: result.width,
      height: result.height,
      createdAt: now,
      updatedAt: now,
      graphData: serializeGraph(nodes as any, edges as any, 'result-node'),
    };
    saveDocument(newDoc);
    setShowNewDialog(false);
    setLocation(`/edit/${id}`);
  }, [setLocation]);

  const handleBack = useCallback(() => {
    // Save before leaving
    if (docRef.current) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;
      saveDocument({ ...docRef.current, graphData, thumbnail, updatedAt: Date.now() });
    }
    setLocation('/');
  }, [setLocation]);

  const handleRename = useCallback((newName: string) => {
    if (!doc) return;
    const updated = { ...doc, name: newName, updatedAt: Date.now() };
    setDoc(updated);
    saveDocument(updated);
    setOpenTabs(prev => prev.map(t => t.id === doc.id ? { ...t, name: newName } : t));
  }, [doc]);

  // Tab handlers
  const handleSelectTab = useCallback((id: string) => {
    if (id === activeTabId) return;
    // Save current doc
    if (docRef.current) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;
      saveDocument({ ...docRef.current, graphData, thumbnail, updatedAt: Date.now() });
    }
    setLocation(`/edit/${id}`);
  }, [activeTabId, setLocation]);

  const handleCloseTab = useCallback((id: string) => {
    // Save the tab being closed
    if (id === docRef.current?.id) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;
      saveDocument({ ...docRef.current, graphData, thumbnail, updatedAt: Date.now() });
    }

    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) {
        // No tabs left, go home
        setLocation('/');
        return next;
      }
      if (id === activeTabId) {
        // Switch to the next available tab
        const idx = prev.findIndex(t => t.id === id);
        const switchTo = next[Math.min(idx, next.length - 1)];
        setLocation(`/edit/${switchTo.id}`);
      }
      return next;
    });
  }, [activeTabId, setLocation]);

  const handleNewTab = useCallback(() => {
    setShowNewDialog(true);
  }, []);

  if (!doc) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-zinc-100">
      <Header
        onNewProject={handleNewProject}
        documentName={doc.name}
        onRename={handleRename}
        onBack={handleBack}
        onUndo={graph.undo}
        onRedo={graph.redo}
        canUndo={graph.canUndo}
        canRedo={graph.canRedo}
      />

      <DocumentTabs
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left - Node palette */}
        <FilterPanel
          width={leftPanelWidth}
          onAddNode={graph.autoConnectNode}
          onUploadImage={graph.uploadSourceImage}
          onApplyPreset={graph.applyPreset}
        />

        {/* Center - Graph editor (full remaining width) */}
        <NodeCanvas
          nodes={graph.nodes}
          edges={graph.edges}
          graphState={graph.graphState}
          onNodesChange={graph.onNodesChange}
          onEdgesChange={graph.onEdgesChange}
          onConnect={graph.onConnect}
          onNodeClick={graph.onNodeClick}
          onParameterChange={graph.onParameterChange}
          onToggleEnabled={graph.onToggleEnabled}
          onToggleCollapsed={graph.onToggleCollapsed}
          onSetColorTag={graph.onSetColorTag}
          onUploadImage={graph.uploadNodeImage}
          onDrop={graph.onDrop}
          onSpliceIntoEdge={graph.spliceIntoEdge}
          onUploadSourceImage={graph.uploadSourceImage}
          onGenerateTexture={graph.generateTexture}
          onApplyTemplate={graph.applyTemplate}
          lastAddedNodeId={graph.lastAddedNodeId}
          lastAddedDefinitionId={graph.lastAddedDefinitionId}
          onClearSuggestion={graph.clearSuggestion}
        />
      </div>

      {/* Floating preview navigator (Photoshop-style) */}
      <PreviewPanel
        processedImage={graph.processedImage}
        isRendering={graph.isRendering}
        quality={graph.quality}
        onQualityChange={graph.setQuality}
        onExportImage={graph.exportImage}
        initCanvas={graph.initCanvas}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />

      <NewDocumentDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreateNew}
      />
    </div>
  );
}

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id || '';

  if (!docId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500">
        No document ID specified.
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <EditorContent docId={docId} />
    </ReactFlowProvider>
  );
}
