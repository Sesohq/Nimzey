/**
 * TexturesPage - Community texture gallery/marketplace.
 * Public browsing with filtering, sorting, likes, and detail modal.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { Button } from '@/components/ui/button';
import {
  Search,
  Heart,
  Eye,
  Copy,
  Loader2,
  X,
  User,
  ImageIcon,
  Lock,
  ExternalLink,
  ChevronDown,
  Layers,
  LogIn,
  FolderOpen,
  Shield,
  Download,
} from 'lucide-react';
import {
  useCommunityChains,
  useCloneChain,
  useToggleLike,
  useUserLikes,
  useIncrementViews,
  CommunityChain,
  CATEGORIES,
  type Category,
  type SortBy,
} from '@/stores/communityStore';
import { useAuth } from '@/stores/authStore';
import { TextureThumbnail } from '@/components/TextureThumbnail';

// -----------------------------------------------------------------------
// TexturesPage
// -----------------------------------------------------------------------

export default function TexturesPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, profile, loading: authLoading } = useAuth();

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Detail modal
  const [selectedChain, setSelectedChain] = useState<CommunityChain | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Data hooks
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCommunityChains(searchQuery, activeCategory, sortBy);

  const { clone, isCloning } = useCloneChain();
  const toggleLikeMutation = useToggleLike();
  const incrementViewsMutation = useIncrementViews();
  const { data: userLikes } = useUserLikes(user?.id);

  const chains = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSortDropdown]);

  // Handlers
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const handleCategoryChange = useCallback((cat: Category) => {
    setActiveCategory(cat);
  }, []);

  const handleSortChange = useCallback((sort: SortBy) => {
    setSortBy(sort);
    setShowSortDropdown(false);
  }, []);

  const handleOpenDetail = useCallback(
    (chain: CommunityChain) => {
      setSelectedChain(chain);
      // Increment views
      incrementViewsMutation.mutate({ documentId: chain.id });
    },
    [incrementViewsMutation],
  );

  const handleToggleLike = useCallback(
    async (chain: CommunityChain) => {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }
      try {
        await toggleLikeMutation.mutateAsync({
          documentId: chain.id,
          userId: user.id,
        });
      } catch (err) {
        console.error('Like failed:', err);
      }
    },
    [user, toggleLikeMutation],
  );

  const handleClone = useCallback(
    async (chain: CommunityChain) => {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }
      try {
        const newDoc = await clone({ chainId: chain.id, userId: user.id });
        if (newDoc?.id) {
          sessionStorage.setItem('nimzey_autoLayout', newDoc.id);
          setSelectedChain(null);
          setLocation(`/edit/${newDoc.id}`);
        }
      } catch (err) {
        console.error('Clone failed:', err);
      }
    },
    [user, clone, setLocation],
  );

  const handleOpenInEditor = useCallback(
    async (chain: CommunityChain) => {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }
      try {
        const newDoc = await clone({
          chainId: chain.id,
          userId: user.id,
          includeGraph: true,
        });
        if (newDoc?.id) {
          sessionStorage.setItem('nimzey_autoLayout', newDoc.id);
          setSelectedChain(null);
          setLocation(`/edit/${newDoc.id}`);
        }
      } catch (err) {
        console.error('Open in editor failed:', err);
      }
    },
    [user, clone, setLocation],
  );

  const sortLabels: Record<SortBy, string> = {
    newest: 'Newest',
    popular: 'Most Popular',
    most_liked: 'Most Liked',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#DBDBDC]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={nimzeyLogo} alt="NIMZEY" className="h-7 w-7" />
            <span className="text-base font-bold text-white">NIMZEY</span>
          </Link>
          <nav className="flex items-center gap-1">
            {isAuthenticated && (
              <button
                onClick={() => setLocation('/')}
                className="px-3 py-1.5 text-xs text-[#A6A6A6] hover:text-white hover:bg-[#1A1A19] rounded-md transition-colors flex items-center gap-1.5"
              >
                <FolderOpen size={13} />
                My Documents
              </button>
            )}
            <button
              className="px-3 py-1.5 text-xs text-[#E0FF29] bg-[#E0FF29]/10 rounded-md font-medium"
              disabled
            >
              Textures
            </button>
            {isAuthenticated && profile?.is_admin && (
              <button
                onClick={() => setLocation('/admin')}
                className="px-3 py-1.5 text-xs text-[#A6A6A6] hover:text-white hover:bg-[#1A1A19] rounded-md transition-colors flex items-center gap-1.5"
              >
                <Shield size={13} />
                Admin
              </button>
            )}
            {!authLoading && !isAuthenticated && (
              <button
                onClick={() => setLocation('/login')}
                className="px-3 py-1.5 text-xs text-[#D6D1CB] hover:text-white hover:bg-[#1A1A19] rounded-md transition-colors flex items-center gap-1.5 ml-1"
              >
                <LogIn size={13} />
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E0FF29]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            The World's Most Unique
            <br />
            <span className="text-[#E0FF29]">Texture Library</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A6A6A6] max-w-lg mx-auto">
            In an AI era of sameness, stand out with one-of-a-kind procedural textures
            crafted by a community of creators.
          </p>
        </div>
      </section>

      {/* Search + Sort + Category Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search textures..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-[#131312] border border-[#333] rounded-lg text-white placeholder-[#525252] outline-none focus:border-[#E0FF29]/60 transition-colors"
            />
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#525252]"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSortDropdown((p) => !p)}
              className="h-10 px-4 text-sm bg-[#131312] border border-[#333] rounded-lg text-[#A6A6A6] hover:text-white flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {sortLabels[sortBy]}
              <ChevronDown size={14} />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#1A1A19] border border-[#333] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                {(Object.entries(sortLabels) as [SortBy, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleSortChange(key)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      sortBy === key
                        ? 'text-[#E0FF29] bg-[#E0FF29]/5'
                        : 'text-[#D6D1CB] hover:bg-[#252524] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`shrink-0 px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
                activeCategory === cat
                  ? 'bg-[#E0FF29] text-[#131312] border-[#E0FF29]'
                  : 'bg-transparent text-[#A6A6A6] border-[#333] hover:border-[#525252] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={28} className="animate-spin text-[#525252]" />
            <p className="text-sm text-[#525252]">Loading textures...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <X size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-[#D6D1CB]">Failed to load textures</h3>
            <p className="text-sm text-[#525252] text-center max-w-sm">
              {error?.message || 'Could not connect to the server. Please try again.'}
            </p>
            <Button
              variant="ghost"
              onClick={() => refetch()}
              className="text-[#E0FF29] border border-[#E0FF29]/30 hover:bg-[#E0FF29]/10 mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && chains.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1A19] border border-[#333] flex items-center justify-center">
              <ImageIcon size={28} className="text-[#525252]" />
            </div>
            <h3 className="text-lg font-medium text-[#D6D1CB]">
              {searchQuery || activeCategory !== 'All' ? 'No textures found' : 'No textures yet'}
            </h3>
            <p className="text-sm text-[#525252] text-center max-w-sm">
              {searchQuery || activeCategory !== 'All'
                ? 'Try a different search or category.'
                : 'Be the first to share a texture with the community!'}
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && chains.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {chains.map((chain) => (
                <TextureCard
                  key={chain.id}
                  chain={chain}
                  isLiked={userLikes?.has(chain.id) ?? false}
                  onClick={() => handleOpenDetail(chain)}
                  onLike={() => handleToggleLike(chain)}
                  onOpenInEditor={() => handleOpenInEditor(chain)}
                />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="ghost"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-[#A6A6A6] hover:text-white border border-[#333] hover:border-[#525252] px-8 h-10"
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

      {/* Detail Modal */}
      {selectedChain && (
        <DetailModal
          chain={selectedChain}
          isLiked={userLikes?.has(selectedChain.id) ?? false}
          isCloning={isCloning}
          isAuthenticated={isAuthenticated}
          onClose={() => setSelectedChain(null)}
          onLike={() => handleToggleLike(selectedChain)}
          onClone={() => handleClone(selectedChain)}
          onOpenInEditor={() => handleOpenInEditor(selectedChain)}
        />
      )}

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-[#1A1A19] border border-[#333] rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-white mb-2">Sign in required</h3>
            <p className="text-xs text-[#A6A6A6] mb-4">
              You need to sign in to interact with textures.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginPrompt(false)}
                className="text-[#A6A6A6]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312]"
                onClick={() => {
                  setShowLoginPrompt(false);
                  setLocation('/login');
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// TextureCard Component
// -----------------------------------------------------------------------

interface TextureCardProps {
  chain: CommunityChain;
  isLiked: boolean;
  onClick: () => void;
  onLike: () => void;
  onOpenInEditor: () => void;
}

function TextureCard({ chain, isLiked, onClick, onLike, onOpenInEditor }: TextureCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  const downloadUrl = chain.thumbnail_url || renderedUrl;

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (downloading || !downloadUrl) return;
      setDownloading(true);
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chain.name.replace(/[^a-zA-Z0-9-_ ]/g, '')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Download failed:', err);
      } finally {
        setDownloading(false);
      }
    },
    [downloadUrl, chain.name, downloading],
  );

  return (
    <div
      className="group bg-[#131312] border border-[#262626] rounded-xl overflow-hidden hover:border-[#444] transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#0E0E0E] overflow-hidden">
        <TextureThumbnail
          documentId={chain.id}
          userId={chain.user_id}
          thumbnailUrl={chain.thumbnail_url}
          alt={chain.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          iconSize={32}
          onRendered={setRenderedUrl}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-3">
            {/* Likes */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
            >
              <Heart size={12} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              {chain.likes_count || 0}
            </button>

            {/* Node count */}
            {chain.node_count != null && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 text-white text-xs">
                <Layers size={12} />
                {chain.node_count}
              </span>
            )}

            {/* Download */}
            {downloadUrl && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                title="Download texture"
              >
                {downloading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
              </button>
            )}

            {/* Open in editor (only if filter chain is shared) */}
            {chain.show_filter_chain && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInEditor();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#E0FF29] text-[#131312] text-xs font-medium hover:bg-[#f0ff80] transition-colors"
              >
                <ExternalLink size={12} />
                Open
              </button>
            )}
          </div>
        </div>

        {/* Lock icon for private filter chain */}
        {!chain.show_filter_chain && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50">
            <Lock size={11} className="text-[#A6A6A6]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <h3 className="text-sm font-medium text-[#D6D1CB] truncate">{chain.name}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <User size={10} className="text-[#525252] shrink-0" />
            <span className="text-[11px] text-[#525252] truncate">
              {chain.profiles?.display_name || 'Anonymous'}
            </span>
          </div>
          {chain.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E0FF29]/10 text-[#E0FF29] font-medium shrink-0">
              {chain.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// DetailModal Component
// -----------------------------------------------------------------------

interface DetailModalProps {
  chain: CommunityChain;
  isLiked: boolean;
  isCloning: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onLike: () => void;
  onClone: () => void;
  onOpenInEditor: () => void;
}

function DetailModal({
  chain,
  isLiked,
  isCloning,
  isAuthenticated,
  onClose,
  onLike,
  onClone,
  onOpenInEditor,
}: DetailModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  const downloadUrl = chain.thumbnail_url || renderedUrl;

  const handleDownload = useCallback(async () => {
    if (downloading || !downloadUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chain.name.replace(/[^a-zA-Z0-9-_ ]/g, '')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [downloadUrl, chain.name, downloading]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#131312] border border-[#333] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#262626]">
          <h3 className="text-sm font-semibold text-white truncate pr-4">{chain.name}</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#525252] hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Large preview */}
        <div className="aspect-square bg-[#0E0E0E] flex items-center justify-center overflow-hidden">
          <TextureThumbnail
            documentId={chain.id}
            userId={chain.user_id}
            thumbnailUrl={chain.thumbnail_url}
            alt={chain.name}
            className="w-full h-full object-cover"
            iconSize={48}
            onRendered={setRenderedUrl}
          />
        </div>

        {/* Info section */}
        <div className="px-5 py-5">
          {/* Creator row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1A1A19] border border-[#333] flex items-center justify-center shrink-0">
              {chain.profiles?.avatar_url ? (
                <img
                  src={chain.profiles.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={14} className="text-[#525252]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[#D6D1CB] truncate">
                {chain.profiles?.display_name || 'Anonymous'}
              </p>
              <p className="text-[10px] text-[#525252]">
                Shared {new Date(chain.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          {chain.description && (
            <p className="text-xs text-[#A6A6A6] mb-4 leading-relaxed">{chain.description}</p>
          )}

          {/* Category + Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {chain.category && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#E0FF29]/10 text-[#E0FF29] font-medium">
                {chain.category}
              </span>
            )}
            {chain.tags?.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#1A1A19] text-[#A6A6A6] border border-[#333]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#262626]">
            <button
              onClick={onLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                isLiked ? 'text-red-400' : 'text-[#A6A6A6] hover:text-red-400'
              }`}
            >
              <Heart size={14} className={isLiked ? 'fill-red-400' : ''} />
              {chain.likes_count || 0} {chain.likes_count === 1 ? 'like' : 'likes'}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-[#525252]">
              <Eye size={14} />
              {chain.views_count || 0} views
            </span>
            {chain.node_count != null && (
              <span className="flex items-center gap-1.5 text-xs text-[#525252]">
                <Layers size={14} />
                {chain.node_count} nodes
              </span>
            )}
          </div>

          {/* Private chain notice */}
          {!chain.show_filter_chain && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-[#1A1A19] border border-[#262626]">
              <Lock size={14} className="text-[#A6A6A6] shrink-0 mt-0.5" />
              <p className="text-xs text-[#A6A6A6] leading-relaxed">
                The creator chose to keep their filter chain private. You can still save this texture
                to your collection.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {chain.show_filter_chain && (
              <Button
                className="w-full bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] gap-2 h-10 font-medium"
                onClick={onOpenInEditor}
                disabled={isCloning}
              >
                {isCloning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    Open in Editor
                  </>
                )}
              </Button>
            )}
            {downloadUrl && (
              <Button
                variant="ghost"
                className="w-full border border-[#333] text-[#D6D1CB] hover:text-white hover:border-[#525252] gap-2 h-10"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download Texture
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full border border-[#333] text-[#D6D1CB] hover:text-white hover:border-[#525252] gap-2 h-10"
              onClick={onClone}
              disabled={isCloning}
            >
              {isCloning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Clone to My Documents
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
