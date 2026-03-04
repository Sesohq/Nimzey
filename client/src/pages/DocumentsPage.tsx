/**
 * DocumentsPage - Home page showing all saved documents with create/open/delete.
 * Shows cloud documents when authenticated, localStorage documents when not.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileImage, Clock, Cloud, HardDrive, LogIn, Image, Sparkles } from 'lucide-react';
import { listDocuments, deleteDocument, NimzeyDocument } from '@/stores/documentStore';
import { listCloudDocuments, deleteCloudDocument, saveCloudDocument, CloudDocumentListItem } from '@/stores/cloudDocumentStore';
import NewDocumentDialog, { NewDocumentResult } from '@/components/NewDocumentDialog';
import { saveDocument } from '@/stores/documentStore';
import { serializeGraph } from '@/utils/graphSerializer';
import { NodeRegistry } from '@/registry/nodes';
import { useAuth } from '@/stores/authStore';

function formatDate(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
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

interface UnifiedDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string | null;
  updatedAt: number | string;
  source: 'cloud' | 'local';
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
  const { isAuthenticated, loading: authLoading, profile, user } = useAuth();
  const [docs, setDocs] = useState<UnifiedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load documents based on auth state
  useEffect(() => {
    if (authLoading) return;

    const loadDocs = async () => {
      setLoadingDocs(true);

      try {
        if (isAuthenticated) {
          // Load cloud documents
          const cloudDocs = await listCloudDocuments();
          const unified: UnifiedDocument[] = cloudDocs.map(d => ({
            id: d.id,
            name: d.name,
            width: d.width,
            height: d.height,
            thumbnail: d.thumbnail_url,
            updatedAt: d.updated_at,
            source: 'cloud' as const,
          }));

          // Also check for local-only documents that aren't in the cloud
          const localDocs = listDocuments();
          const cloudIds = new Set(cloudDocs.map(d => d.id));
          const localOnly = localDocs.filter(d => !cloudIds.has(d.id));
          for (const ld of localOnly) {
            unified.push({
              id: ld.id,
              name: ld.name,
              width: ld.width,
              height: ld.height,
              thumbnail: ld.thumbnail,
              updatedAt: ld.updatedAt,
              source: 'local' as const,
            });
          }

          // Sort by updated descending
          unified.sort((a, b) => {
            const ta = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : a.updatedAt;
            const tb = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : b.updatedAt;
            return tb - ta;
          });

          setDocs(unified);
        } else {
          // Load local documents only
          const localDocs = listDocuments();
          setDocs(localDocs.map(d => ({
            id: d.id,
            name: d.name,
            width: d.width,
            height: d.height,
            thumbnail: d.thumbnail,
            updatedAt: d.updatedAt,
            source: 'local' as const,
          })));
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
        // Fall back to local documents
        const localDocs = listDocuments();
        setDocs(localDocs.map(d => ({
          id: d.id,
          name: d.name,
          width: d.width,
          height: d.height,
          thumbnail: d.thumbnail,
          updatedAt: d.updatedAt,
          source: 'local' as const,
        })));
      } finally {
        setLoadingDocs(false);
      }
    };

    loadDocs();
  }, [isAuthenticated, authLoading]);

  const handleCreate = useCallback((result: NewDocumentResult) => {
    const doc = createBlankDocument(result.name, result.width, result.height);
    saveDocument(doc);

    // Also save to cloud if authenticated
    if (isAuthenticated) {
      saveCloudDocument({
        id: doc.id,
        name: doc.name,
        graphData: doc.graphData,
        width: doc.width,
        height: doc.height,
      }).catch(err => console.warn('Cloud save failed:', err));
    }

    setShowNewDialog(false);
    setLocation(`/edit/${doc.id}`);
  }, [setLocation, isAuthenticated]);

  const handleOpen = useCallback((id: string) => {
    setLocation(`/edit/${id}`);
  }, [setLocation]);

  const handleDelete = useCallback(async (id: string) => {
    const docToDelete = docs.find(d => d.id === id);

    // Delete from localStorage
    deleteDocument(id);

    // Delete from cloud if it's a cloud doc
    if (docToDelete?.source === 'cloud') {
      await deleteCloudDocument(id);
    }

    setDocs(prev => prev.filter(d => d.id !== id));
    setDeleteConfirmId(null);
  }, [docs]);

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
          <div className="flex items-center gap-2">
            {!authLoading && !isAuthenticated && (
              <button
                onClick={() => setLocation('/login')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md border border-zinc-700 transition-colors"
              >
                <LogIn size={13} />
                Sign In
              </button>
            )}
            {!authLoading && isAuthenticated && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Cloud size={12} />
                Synced
              </span>
            )}
            <Button
              variant="ghost"
              onClick={() => setLocation('/textures')}
              className="text-zinc-400 hover:text-white gap-1.5"
            >
              <Image size={16} />
              Textures
            </Button>
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] gap-1.5"
            >
              <Plus size={16} />
              New Document
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loadingDocs || authLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin h-6 w-6 text-zinc-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-zinc-500">Loading documents...</p>
          </div>
        ) : docs.length === 0 ? (
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
              className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] gap-1.5 mt-2"
            >
              <Plus size={16} />
              Create Your First Texture
            </Button>
          </div>
        ) : (
          /* Document grid */
          <div>
            {/* Browse Textures CTA */}
            <div
              onClick={() => setLocation('/textures')}
              className="mb-6 bg-gradient-to-r from-[#E0FF29]/5 via-[#1A1A19] to-[#1A1A19] border border-[#333] hover:border-[#E0FF29]/30 rounded-xl p-5 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#E0FF29]/10 flex items-center justify-center shrink-0 group-hover:bg-[#E0FF29]/20 transition-colors">
                  <Sparkles size={20} className="text-[#E0FF29]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white mb-0.5">Browse Community Textures</h3>
                  <p className="text-xs text-zinc-500">Discover unique procedural textures crafted by the community</p>
                </div>
                <span className="text-xs text-[#E0FF29] font-medium hidden sm:block">Explore &rarr;</span>
              </div>
            </div>

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
                        {/* Cloud/Local indicator */}
                        <span className="text-[10px] text-zinc-600 flex items-center gap-0.5" title={doc.source === 'cloud' ? 'Stored in cloud' : 'Stored locally'}>
                          {doc.source === 'cloud' ? <Cloud size={9} /> : <HardDrive size={9} />}
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
