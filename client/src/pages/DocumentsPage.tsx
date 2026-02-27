/**
 * DocumentsPage - Home page showing all saved documents with create/open/delete.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileImage, Clock } from 'lucide-react';
import { listDocuments, deleteDocument, NimzeyDocument } from '@/stores/documentStore';
import NewDocumentDialog, { NewDocumentResult } from '@/components/NewDocumentDialog';
import { saveDocument } from '@/stores/documentStore';
import { serializeGraph } from '@/utils/graphSerializer';
import { NodeRegistry } from '@/registry/nodes';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

function createBlankDocument(name: string, width: number, height: number): NimzeyDocument {
  const id = crypto.randomUUID();
  const now = Date.now();

  // Create a minimal graph with just a result node
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

  return {
    id,
    name,
    width,
    height,
    createdAt: now,
    updatedAt: now,
    graphData: serializeGraph(nodes as any, edges as any, 'result-node'),
  };
}

export default function DocumentsPage() {
  const [, setLocation] = useLocation();
  const [docs, setDocs] = useState<NimzeyDocument[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setDocs(listDocuments());
  }, []);

  const handleCreate = useCallback((result: NewDocumentResult) => {
    const doc = createBlankDocument(result.name, result.width, result.height);
    saveDocument(doc);
    setShowNewDialog(false);
    setLocation(`/edit/${doc.id}`);
  }, [setLocation]);

  const handleOpen = useCallback((id: string) => {
    setLocation(`/edit/${id}`);
  }, [setLocation]);

  const handleDelete = useCallback((id: string) => {
    deleteDocument(id);
    setDocs(listDocuments());
    setDeleteConfirmId(null);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nimzeyLogo} alt="NIMZEY" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-white">NIMZEY</h1>
              <span className="text-xs text-zinc-500">Texture & Filter Editor</span>
            </div>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
          >
            <Plus size={16} />
            New Document
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {docs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <FileImage size={28} className="text-zinc-500" />
            </div>
            <h2 className="text-lg font-medium text-zinc-300">No documents yet</h2>
            <p className="text-sm text-zinc-500 text-center max-w-sm">
              Create your first texture to get started. Set your canvas size and build filter chains to generate amazing textures.
            </p>
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 mt-2"
            >
              <Plus size={16} />
              Create Your First Texture
            </Button>
          </div>
        ) : (
          /* Document grid */
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-4">
              Your Documents ({docs.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(doc => (
                <div
                  key={doc.id}
                  className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors cursor-pointer"
                  onClick={() => handleOpen(doc.id)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {doc.thumbnail ? (
                      <img
                        src={doc.thumbnail}
                        alt={doc.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage size={32} className="text-zinc-700" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-200 truncate">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500 tabular-nums">
                          {doc.width} x {doc.height}
                        </span>
                        <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                          <Clock size={9} />
                          {formatDate(doc.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(doc.id);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Document Dialog */}
      <NewDocumentDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium text-white mb-2">Delete Document?</h3>
            <p className="text-xs text-zinc-400 mb-4">
              This action cannot be undone. The document and all its data will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
