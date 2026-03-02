/**
 * CommunityPage - Public browsing page for shared Nimzey texture chains.
 * No login required to view; clone requires authentication.
 */

import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { Button } from '@/components/ui/button';
import {
  Search,
  Copy,
  Loader2,
  X,
  User,
  ArrowLeft,
  ImageIcon,
  Users,
} from 'lucide-react';
import { useCommunityChains, useCloneChain, CommunityChain } from '@/stores/communityStore';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

// -----------------------------------------------------------------------
// Auth helper hook
// -----------------------------------------------------------------------

function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// -----------------------------------------------------------------------
// Community Page
// -----------------------------------------------------------------------

export default function CommunityPage() {
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<CommunityChain | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { data: user } = useCurrentUser();
  const { clone, isCloning } = useCloneChain();

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCommunityChains(searchQuery);

  const chains = useMemo(() => {
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

  const handleClone = useCallback(
    async (chain: CommunityChain) => {
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

      try {
        const newDoc = await clone({ chainId: chain.id, userId: user.id });
        if (newDoc?.id) {
          setSelectedChain(null);
          setLocation(`/edit/${newDoc.id}`);
        }
      } catch (err) {
        console.error('Clone failed:', err);
      }
    },
    [user, clone, setLocation],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/')}
              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
              title="Back to documents"
            >
              <ArrowLeft size={16} />
            </button>
            <img src={nimzeyLogo} alt="NIMZEY" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-white">NIMZEY</h1>
              <span className="text-xs text-zinc-500">Community</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
              onClick={() => setLocation('/')}
            >
              My Documents
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Community Chains</h2>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search textures..."
                className="w-full sm:w-64 h-9 pl-9 pr-3 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
              />
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={28} className="animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">Loading community chains...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && chains.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <ImageIcon size={28} className="text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300">
              {searchQuery ? 'No results found' : 'No shared textures yet'}
            </h3>
            <p className="text-sm text-zinc-500 text-center max-w-sm">
              {searchQuery
                ? 'Try a different search term.'
                : 'Be the first to share a texture with the community!'}
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && chains.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  onClick={() => setSelectedChain(chain)}
                  className="group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {chain.thumbnail_url ? (
                      <img
                        src={chain.thumbnail_url}
                        alt={chain.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-zinc-700" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-zinc-200 truncate">
                      {chain.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <User size={10} className="text-zinc-500" />
                      <span className="text-xs text-zinc-500 truncate">
                        {chain.profiles?.display_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500"
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
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedChain(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-white truncate pr-4">
                {selectedChain.name}
              </h3>
              <button
                onClick={() => setSelectedChain(null)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Large preview */}
            <div className="aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
              {selectedChain.thumbnail_url ? (
                <img
                  src={selectedChain.thumbnail_url}
                  alt={selectedChain.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={48} className="text-zinc-700" />
              )}
            </div>

            {/* Info + actions */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                  {selectedChain.profiles?.avatar_url ? (
                    <img
                      src={selectedChain.profiles.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={14} className="text-zinc-400" />
                  )}
                </div>
                <div>
                  <span className="text-sm text-zinc-300">
                    {selectedChain.profiles?.display_name || 'Anonymous'}
                  </span>
                  <p className="text-[10px] text-zinc-600">
                    Shared {new Date(selectedChain.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2"
                onClick={() => handleClone(selectedChain)}
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
      )}

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-white mb-2">
              Sign in required
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              You need to sign in to clone textures to your documents.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginPrompt(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => {
                  setShowLoginPrompt(false);
                  // Could navigate to a login page or trigger auth flow
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
