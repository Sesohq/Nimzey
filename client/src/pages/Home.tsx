/**
 * EditorPage - Main editor with document loading, auto-save, and multi-tab support.
 * Supports both localStorage and cloud (Supabase) persistence based on auth state.
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
import { loadCloudDocument, saveCloudDocument } from '@/stores/cloudDocumentStore';
import { serializeGraph } from '@/utils/graphSerializer';
import { NodeRegistry } from '@/registry/nodes';
import { useAuth } from '@/stores/authStore';
import { usePublishChain } from '@/stores/communityStore';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, X } from 'lucide-react';

function EditorContent({ docId }: { docId: string }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [doc, setDoc] = useState<NimzeyDocument | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isCloudDoc, setIsCloudDoc] = useState(false);

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
  const isCloudDocRef = useRef(isCloudDoc);
  isCloudDocRef.current = isCloudDoc;
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  // Helper to save document (local + cloud)
  const persistDocument = useCallback((docToSave: NimzeyDocument) => {
    // Always save to localStorage as a cache
    saveDocument(docToSave);

    // Also save to cloud if authenticated
    if (isAuthenticatedRef.current) {
      saveCloudDocument({
        id: docToSave.id,
        name: docToSave.name,
        graphData: docToSave.graphData,
        width: docToSave.width,
        height: docToSave.height,
        thumbnail: docToSave.thumbnail,
      }).catch(err => console.warn('Cloud save failed:', err));
    }
  }, []);

  // Load document on mount / when docId changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Try cloud first if authenticated
      if (isAuthenticated) {
        const cloudDoc = await loadCloudDocument(docId);
        if (cloudDoc && !cancelled) {
          const nimzeyDoc: NimzeyDocument = {
            id: cloudDoc.id,
            name: cloudDoc.name,
            width: cloudDoc.data.width || 512,
            height: cloudDoc.data.height || 512,
            createdAt: new Date(cloudDoc.created_at).getTime(),
            updatedAt: new Date(cloudDoc.updated_at).getTime(),
            graphData: cloudDoc.data.graphData,
            thumbnail: cloudDoc.thumbnail_url || undefined,
          };
          setDoc(nimzeyDoc);
          setIsCloudDoc(true);
          graph.loadFromSerialized(nimzeyDoc.graphData);
          setLoaded(true);

          // Also cache locally
          saveDocument(nimzeyDoc);

          // Set up tabs
          setOpenTabs(prev => {
            const exists = prev.some(t => t.id === nimzeyDoc.id);
            if (exists) return prev;
            return [...prev, {
              id: nimzeyDoc.id,
              name: nimzeyDoc.name,
              width: nimzeyDoc.width,
              height: nimzeyDoc.height,
            }];
          });
          setActiveTabId(nimzeyDoc.id);
          return;
        }
      }

      // Fall back to localStorage
      const loadedDoc = loadDocument(docId);
      if (loadedDoc && !cancelled) {
        setDoc(loadedDoc);
        setIsCloudDoc(false);
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
      } else if (!cancelled) {
        // Document not found - redirect to home
        setLocation('/');
      }
    };

    load();
    return () => { cancelled = true; };
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

      persistDocument({
        ...currentDoc,
        graphData,
        thumbnail,
        updatedAt: Date.now(),
      });
    }, 2000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [graph.structuralVersion, loaded, persistDocument]);

  const handleNewProject = useCallback(() => {
    setShowNewDialog(true);
  }, []);

  const handleCreateNew = useCallback((result: NewDocumentResult) => {
    // Save current document before switching
    if (docRef.current) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      persistDocument({ ...docRef.current, graphData, updatedAt: Date.now() });
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
    persistDocument(newDoc);
    setShowNewDialog(false);
    setLocation(`/edit/${id}`);
  }, [setLocation, persistDocument]);

  const handleBack = useCallback(() => {
    // Save before leaving
    if (docRef.current) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;
      persistDocument({ ...docRef.current, graphData, thumbnail, updatedAt: Date.now() });
    }
    setLocation('/');
  }, [setLocation, persistDocument]);

  const handleResolutionChange = useCallback((width: number, height: number) => {
    if (!doc) return;
    const updated = { ...doc, width, height, updatedAt: Date.now() };
    setDoc(updated);
    persistDocument(updated);
    setOpenTabs(prev => prev.map(t => t.id === doc.id ? { ...t, width, height } : t));
  }, [doc, persistDocument]);

  const handleRename = useCallback((newName: string) => {
    if (!doc) return;
    const updated = { ...doc, name: newName, updatedAt: Date.now() };
    setDoc(updated);
    persistDocument(updated);
    setOpenTabs(prev => prev.map(t => t.id === doc.id ? { ...t, name: newName } : t));
  }, [doc, persistDocument]);

  // Tab handlers
  const handleSelectTab = useCallback((id: string) => {
    if (id === activeTabId) return;
    // Save current doc
    if (docRef.current) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;
      persistDocument({ ...docRef.current, graphData, thumbnail, updatedAt: Date.now() });
    }
    setLocation(`/edit/${id}`);
  }, [activeTabId, setLocation, persistDocument]);

  const handleCloseTab = useCallback((id: string) => {
    // Save the tab being closed
    if (id === docRef.current?.id) {
      const g = graphRef.current;
      const graphData = g.getSerializedState();
      const thumbnail = g.processedImage || undefined;
      persistDocument({ ...docRef.current, graphData, thumbnail, updatedAt: Date.now() });
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
  }, [activeTabId, setLocation, persistDocument]);

  const handleNewTab = useCallback(() => {
    setShowNewDialog(true);
  }, []);

  // Publish flow
  const { publish, isPublishing } = usePublishChain();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublishClick = useCallback(() => {
    setPublishError(null);
    setShowPublishDialog(true);
  }, []);

  const handlePublishConfirm = useCallback(async () => {
    if (!user || !doc) return;

    // Find the result canvas in the DOM
    const canvasEl = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvasEl) {
      setPublishError('No canvas found. Make sure the preview is rendering.');
      return;
    }

    try {
      await publish({
        docId: doc.id,
        userId: user.id,
        canvasElement: canvasEl,
      });
      setShowPublishDialog(false);
      setPublishSuccess(true);
      // Reset success state after 3 seconds
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err: any) {
      setPublishError(err?.message || 'Failed to publish. Please try again.');
    }
  }, [user, doc, publish]);

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
        onPublish={handlePublishClick}
        isPublishing={isPublishing}
        isPublished={publishSuccess}
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
          onSpliceExistingIntoEdge={graph.spliceExistingIntoEdge}
          onAddAndConnect={graph.addAndConnect}
          onUploadSourceImage={graph.uploadSourceImage}
          onGenerateTexture={graph.generateTexture}
          onApplyTemplate={graph.applyTemplate}
          onCommitPositionChange={graph.commitPositionChange}
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
        onResolutionChange={handleResolutionChange}
      />

      <NewDocumentDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreateNew}
      />

      {/* Publish confirmation dialog */}
      {showPublishDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={() => !isPublishing && setShowPublishDialog(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-blue-400" />
                <h3 className="text-sm font-medium text-white">Share to Community</h3>
              </div>
              <button
                onClick={() => !isPublishing && setShowPublishDialog(false)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              This will make <strong className="text-zinc-300">"{doc.name}"</strong> publicly visible in the community gallery.
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              A thumbnail of your current output will be captured and displayed.
            </p>

            {publishError && (
              <p className="text-xs text-red-400 mb-3 p-2 bg-red-400/10 rounded">
                {publishError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPublishDialog(false)}
                className="text-zinc-400"
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePublishConfirm}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 size={12} />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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
