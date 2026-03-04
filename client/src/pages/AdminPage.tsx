/**
 * AdminPage - Admin panel for managing community textures.
 * Access restricted to users with profile.is_admin === true.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { Button } from '@/components/ui/button';
import {
  Search,
  Trash2,
  Loader2,
  X,
  User,
  ImageIcon,
  Shield,
  BarChart3,
  Users,
  Image,
  Calendar,
  Heart,
  Eye,
  Layers,
  Tag,
  FolderOpen,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useAdminTextures,
  useAdminDeleteTexture,
  useAdminUpdateTexture,
  useAdminStats,
  CommunityChain,
  CATEGORIES,
} from '@/stores/communityStore';
import { useAuth } from '@/stores/authStore';
import { useSeedTextures } from '@/stores/seedStore';
import { useThumbnailGenerator } from '@/hooks/useThumbnailGenerator';

// -----------------------------------------------------------------------
// AdminPage
// -----------------------------------------------------------------------

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, profile, user, loading: authLoading } = useAuth();

  // Redirect non-admins to login (or home if logged in but not admin)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login?redirect=/admin');
    } else if (!authLoading && isAuthenticated && !profile?.is_admin) {
      setLocation('/');
    }
  }, [authLoading, isAuthenticated, profile, setLocation]);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Data hooks
  const { data: statsData } = useAdminStats();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminTextures(searchQuery);

  const deleteMutation = useAdminDeleteTexture();
  const updateMutation = useAdminUpdateTexture();
  const { seed: seedTextures, isSeeding, progress: seedProgress } = useSeedTextures();
  const { generate: generateThumbnails, abort: abortThumbnails, isGenerating, progress: thumbProgress } = useThumbnailGenerator();

  const textures = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync({ documentId: id });
        setDeleteConfirmId(null);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    },
    [deleteMutation],
  );

  const handleTogglePublic = useCallback(
    async (id: string, currentlyPublic: boolean) => {
      try {
        await updateMutation.mutateAsync({
          documentId: id,
          updates: { is_public: !currentlyPublic },
        });
      } catch (err) {
        console.error('Toggle public failed:', err);
      }
    },
    [updateMutation],
  );

  if (authLoading || !profile?.is_admin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0b] text-[#525252]">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#DBDBDC]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src={nimzeyLogo} alt="NIMZEY" className="h-7 w-7" />
              <span className="text-base font-bold text-white">NIMZEY</span>
            </Link>
            <span className="text-[#525252]">/</span>
            <div className="flex items-center gap-1.5 text-[#E0FF29]">
              <Shield size={14} />
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setLocation('/')}
              className="px-3 py-1.5 text-xs text-[#A6A6A6] hover:text-white hover:bg-[#1A1A19] rounded-md transition-colors flex items-center gap-1.5"
            >
              <FolderOpen size={13} />
              My Documents
            </button>
            <button
              onClick={() => setLocation('/textures')}
              className="px-3 py-1.5 text-xs text-[#A6A6A6] hover:text-white hover:bg-[#1A1A19] rounded-md transition-colors flex items-center gap-1.5"
            >
              <Image size={13} />
              Textures
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Image size={20} />}
            label="Total Textures"
            value={statsData?.totalTextures ?? '-'}
          />
          <StatCard
            icon={<Users size={20} />}
            label="Total Users"
            value={statsData?.totalUsers ?? '-'}
          />
          <StatCard
            icon={<Calendar size={20} />}
            label="This Week"
            value={statsData?.texturesThisWeek ?? '-'}
          />
        </div>

        {/* Seed Community Library */}
        {user && (
          <div className="mb-8 bg-[#131312] border border-[#262626] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Seed Community Library</h3>
                <p className="text-xs text-[#525252]">
                  Insert 100 procedural texture presets into the community library. Safe to run
                  multiple times (creates new entries each time).
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isSeeding && (
                  <div className="text-xs text-[#A6A6A6]">
                    {seedProgress.done}/{seedProgress.total}
                    {seedProgress.errors > 0 && (
                      <span className="text-red-400 ml-1">({seedProgress.errors} errors)</span>
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => seedTextures(user.id)}
                  disabled={isSeeding}
                  className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] h-8 text-xs font-medium"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 size={12} className="animate-spin mr-1.5" />
                      Seeding...
                    </>
                  ) : (
                    'Seed 100 Textures'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Thumbnails */}
        <div className="mb-8 bg-[#131312] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Generate Thumbnails</h3>
              <p className="text-xs text-[#525252]">
                Render WebGL previews for all public textures that are missing thumbnails.
                {thumbProgress.current && (
                  <span className="text-[#A6A6A6] ml-1">Processing: {thumbProgress.current}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isGenerating && (
                <div className="flex items-center gap-3">
                  <div className="text-xs text-[#A6A6A6]">
                    {thumbProgress.done}/{thumbProgress.total}
                    {thumbProgress.errors > 0 && (
                      <span className="text-red-400 ml-1">({thumbProgress.errors} errors)</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-32 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E0FF29] rounded-full transition-all duration-300"
                      style={{ width: `${thumbProgress.total > 0 ? (thumbProgress.done / thumbProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
              {isGenerating ? (
                <Button
                  size="sm"
                  onClick={abortThumbnails}
                  className="bg-red-600 hover:bg-red-500 text-white h-8 text-xs font-medium"
                >
                  <X size={12} className="mr-1.5" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={generateThumbnails}
                  className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] h-8 text-xs font-medium"
                >
                  <ImageIcon size={12} className="mr-1.5" />
                  Generate Thumbnails
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search + Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#E0FF29]" />
            <h2 className="text-lg font-semibold text-white">All Public Textures</h2>
            <span className="text-xs text-[#525252]">({textures.length})</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search textures..."
                className="w-full sm:w-64 h-9 pl-9 pr-3 text-sm bg-[#131312] border border-[#333] rounded-lg text-white placeholder-[#525252] outline-none focus:border-[#E0FF29]/60 transition-colors"
              />
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSearch}
              className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] h-9"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={28} className="animate-spin text-[#525252]" />
            <p className="text-sm text-[#525252]">Loading textures...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && textures.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1A19] border border-[#333] flex items-center justify-center">
              <ImageIcon size={28} className="text-[#525252]" />
            </div>
            <h3 className="text-lg font-medium text-[#D6D1CB]">No textures found</h3>
          </div>
        )}

        {/* Table */}
        {!isLoading && textures.length > 0 && (
          <>
            <div className="bg-[#131312] border border-[#262626] rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[80px_1fr_120px_80px_80px_80px_100px_120px] gap-2 px-4 py-2.5 border-b border-[#262626] text-[10px] text-[#525252] uppercase font-medium tracking-wider">
                <span>Preview</span>
                <span>Name / Creator</span>
                <span>Category</span>
                <span className="text-center">Likes</span>
                <span className="text-center">Views</span>
                <span className="text-center">Nodes</span>
                <span>Created</span>
                <span className="text-right">Actions</span>
              </div>

              {/* Table rows */}
              {textures.map((texture) => (
                <AdminTextureRow
                  key={texture.id}
                  texture={texture}
                  isEditing={editingId === texture.id}
                  onEdit={() => setEditingId(texture.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => setDeleteConfirmId(texture.id)}
                  onTogglePublic={() => handleTogglePublic(texture.id, texture.is_public)}
                  onUpdate={async (updates) => {
                    await updateMutation.mutateAsync({
                      documentId: texture.id,
                      updates,
                    });
                    setEditingId(null);
                  }}
                  isUpdating={updateMutation.isPending}
                />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-[#A6A6A6] hover:text-white border border-[#333] hover:border-[#525252]"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-[#1A1A19] border border-[#333] rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-white mb-2">Remove from Community?</h3>
            <p className="text-xs text-[#A6A6A6] mb-4">
              This will unpublish the texture, removing it from the community gallery. The
              original document will not be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-[#A6A6A6]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-500 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1" />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// StatCard
// -----------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-[#131312] border border-[#262626] rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-[#E0FF29]/10 flex items-center justify-center text-[#E0FF29] shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-[#525252]">{label}</p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// AdminTextureRow
// -----------------------------------------------------------------------

interface AdminTextureRowProps {
  texture: CommunityChain;
  isEditing: boolean;
  isUpdating: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
  onUpdate: (updates: { category?: string | null; tags?: string[] | null }) => Promise<void>;
}

function AdminTextureRow({
  texture,
  isEditing,
  isUpdating,
  onEdit,
  onCancelEdit,
  onDelete,
  onTogglePublic,
  onUpdate,
}: AdminTextureRowProps) {
  const [editCategory, setEditCategory] = useState(texture.category || '');
  const [editTags, setEditTags] = useState((texture.tags || []).join(', '));

  const handleSave = useCallback(async () => {
    const tags = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    await onUpdate({
      category: editCategory || null,
      tags: tags.length > 0 ? tags : null,
    });
  }, [editCategory, editTags, onUpdate]);

  return (
    <div className="grid grid-cols-[80px_1fr_120px_80px_80px_80px_100px_120px] gap-2 px-4 py-3 border-b border-[#262626]/50 hover:bg-[#1A1A19]/50 transition-colors items-center">
      {/* Preview */}
      <div className="w-12 h-12 rounded-md bg-[#0E0E0E] overflow-hidden shrink-0">
        {texture.thumbnail_url ? (
          <img
            src={texture.thumbnail_url}
            alt={texture.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={14} className="text-[#333]" />
          </div>
        )}
      </div>

      {/* Name / Creator */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#D6D1CB] truncate">{texture.name}</p>
        <p className="text-[10px] text-[#525252] truncate flex items-center gap-1">
          <User size={9} />
          {texture.profiles?.display_name || 'Anonymous'}
        </p>
      </div>

      {/* Category */}
      <div>
        {isEditing ? (
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="w-full h-7 px-1.5 text-[10px] bg-[#0E0E0E] border border-[#333] rounded text-white outline-none"
          >
            <option value="">None</option>
            {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] text-[#A6A6A6]">{texture.category || '-'}</span>
        )}
      </div>

      {/* Likes */}
      <div className="flex items-center justify-center gap-1 text-[11px] text-[#525252]">
        <Heart size={10} />
        {texture.likes_count || 0}
      </div>

      {/* Views */}
      <div className="flex items-center justify-center gap-1 text-[11px] text-[#525252]">
        <Eye size={10} />
        {texture.views_count || 0}
      </div>

      {/* Nodes */}
      <div className="flex items-center justify-center gap-1 text-[11px] text-[#525252]">
        <Layers size={10} />
        {texture.node_count ?? '-'}
      </div>

      {/* Created */}
      <div className="text-[10px] text-[#525252]">
        {new Date(texture.created_at).toLocaleDateString()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-2 py-1 text-[10px] bg-[#E0FF29] text-[#131312] rounded font-medium hover:bg-[#f0ff80] transition-colors disabled:opacity-50"
            >
              {isUpdating ? '...' : 'Save'}
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-[10px] text-[#A6A6A6] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="p-1.5 text-[#525252] hover:text-[#E0FF29] transition-colors rounded hover:bg-[#1A1A19]"
              title="Edit category & tags"
            >
              <Tag size={12} />
            </button>
            <button
              onClick={onTogglePublic}
              className="p-1.5 text-[#525252] hover:text-yellow-400 transition-colors rounded hover:bg-[#1A1A19]"
              title="Toggle visibility"
            >
              <EyeOff size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-[#525252] hover:text-red-400 transition-colors rounded hover:bg-[#1A1A19]"
              title="Remove from community"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
