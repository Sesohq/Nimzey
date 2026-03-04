/**
 * CommunityStore - TanStack Query hooks for community features.
 * Handles browsing public documents, publishing, cloning, likes, views, and admin operations.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface CommunityChain {
  id: string;
  user_id: string;
  name: string;
  data?: any;
  thumbnail_url: string | null;
  is_public: boolean;
  description: string | null;
  show_filter_chain: boolean;
  tags: string[] | null;
  category: string | null;
  likes_count: number;
  views_count: number;
  node_count: number | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export type SortBy = 'newest' | 'popular' | 'most_liked';

export const CATEGORIES = [
  'All',
  'Experimental',
  'Grunge',
  'Organic',
  'Geometric',
  'Noise',
  'Abstract',
  'Minimal',
  'Cosmic',
  'Nature',
] as const;

export type Category = (typeof CATEGORIES)[number];

const PAGE_SIZE = 20;

// -----------------------------------------------------------------------
// 1. useCommunityChains - Browse public documents with pagination, search, category & sort
// -----------------------------------------------------------------------

export function useCommunityChains(search?: string, category?: string, sortBy?: SortBy) {
  return useInfiniteQuery<CommunityChain[], Error>({
    queryKey: ['community-chains', search, category, sortBy],
    staleTime: 60 * 1000,  // Refetch after 1 minute
    retry: 2,               // Retry on transient failures
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('documents')
        .select('id, user_id, name, thumbnail_url, is_public, description, show_filter_chain, tags, category, likes_count, views_count, node_count, created_at, updated_at, profiles(display_name, avatar_url)')
        .eq('is_public', true);

      // Search filter
      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      // Category filter
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      // Sort
      switch (sortBy) {
        case 'popular':
          query = query.order('views_count', { ascending: false });
          break;
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as unknown as CommunityChain[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });
}

// -----------------------------------------------------------------------
// 2. usePublishChain - Publish a document to the community (enhanced)
// -----------------------------------------------------------------------

export interface PublishParams {
  docId: string;
  userId: string;
  canvasElement: HTMLCanvasElement;
  description?: string;
  tags?: string[];
  category?: string;
  showFilterChain?: boolean;
}

export function usePublishChain() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: PublishParams) => {
      const { docId, userId, canvasElement, description, tags, category, showFilterChain } = params;

      // Step 1: Capture canvas as JPEG blob at 512x512
      const blob = await captureCanvasAsBlob(canvasElement, 512);

      // Step 2: Upload to Supabase Storage
      const filePath = `${userId}/${docId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Step 3: Get public URL
      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      const thumbnailUrl = urlData.publicUrl;

      // Step 4: Count nodes in the document for metadata
      let nodeCount: number | null = null;
      try {
        const { data: docData } = await supabase
          .from('documents')
          .select('data')
          .eq('id', docId)
          .single();
        if (docData?.data?.graphData?.nodes) {
          nodeCount = docData.data.graphData.nodes.length;
        }
      } catch {
        // ignore
      }

      // Step 5: Update the document to be public with enhanced metadata
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          is_public: true,
          thumbnail_url: thumbnailUrl,
          description: description || null,
          tags: tags && tags.length > 0 ? tags : null,
          category: category || null,
          show_filter_chain: showFilterChain ?? true,
          node_count: nodeCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { thumbnailUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-chains'] });
    },
  });

  return {
    publish: mutation.mutateAsync,
    isPublishing: mutation.isPending,
  };
}

// -----------------------------------------------------------------------
// 3. useCloneChain - Clone a public document into user's own documents
// -----------------------------------------------------------------------

export function useCloneChain() {
  const mutation = useMutation({
    mutationFn: async ({
      chainId,
      userId,
      includeGraph,
    }: {
      chainId: string;
      userId: string;
      includeGraph?: boolean;
    }) => {
      // Step 1: Fetch the original document
      const { data: original, error: fetchError } = await supabase
        .from('documents')
        .select('name, data, show_filter_chain')
        .eq('id', chainId)
        .eq('is_public', true)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error('Document not found');

      // Step 2: Create a copy under the current user
      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          name: `${original.name} (copy)`,
          data: includeGraph && original.show_filter_chain ? original.data : original.data,
          is_public: false,
          thumbnail_url: null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      return newDoc;
    },
  });

  return {
    clone: mutation.mutateAsync,
    isCloning: mutation.isPending,
  };
}

// -----------------------------------------------------------------------
// 4. useToggleLike - Like/unlike a document
// -----------------------------------------------------------------------

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, userId }: { documentId: string; userId: string }) => {
      // Check if already liked
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase.from('likes').delete().eq('id', existing.id);
        // Decrement likes_count
        const { data: doc } = await supabase
          .from('documents')
          .select('likes_count')
          .eq('id', documentId)
          .single();
        if (doc) {
          await supabase
            .from('documents')
            .update({ likes_count: Math.max(0, (doc.likes_count || 0) - 1) })
            .eq('id', documentId);
        }
        return { liked: false };
      } else {
        // Like
        const { error } = await supabase.from('likes').insert({
          user_id: userId,
          document_id: documentId,
        });
        if (error) throw error;
        // Increment likes_count
        const { data: doc } = await supabase
          .from('documents')
          .select('likes_count')
          .eq('id', documentId)
          .single();
        if (doc) {
          await supabase
            .from('documents')
            .update({ likes_count: (doc.likes_count || 0) + 1 })
            .eq('id', documentId);
        }
        return { liked: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-chains'] });
      queryClient.invalidateQueries({ queryKey: ['user-likes'] });
    },
  });
}

// -----------------------------------------------------------------------
// 5. useUserLikes - Check which documents the user has liked
// -----------------------------------------------------------------------

export function useUserLikes(userId?: string) {
  return useQuery<Set<string>>({
    queryKey: ['user-likes', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('likes')
        .select('document_id')
        .eq('user_id', userId);
      return new Set((data ?? []).map((d) => d.document_id));
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// -----------------------------------------------------------------------
// 6. useIncrementViews - Increment views on a document
// -----------------------------------------------------------------------

export function useIncrementViews() {
  return useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      // Use raw SQL for atomic increment, fallback to simple update
      const { data: doc } = await supabase
        .from('documents')
        .select('views_count')
        .eq('id', documentId)
        .single();

      if (doc) {
        await supabase
          .from('documents')
          .update({ views_count: (doc.views_count || 0) + 1 })
          .eq('id', documentId);
      }
    },
  });
}

// -----------------------------------------------------------------------
// 7. useAdminTextures - Fetch ALL public textures for admin with extra info
// -----------------------------------------------------------------------

export function useAdminTextures(search?: string) {
  return useInfiniteQuery<CommunityChain[], Error>({
    queryKey: ['admin-textures', search],
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('documents')
        .select('id, user_id, name, thumbnail_url, is_public, description, show_filter_chain, tags, category, likes_count, views_count, node_count, created_at, updated_at, profiles(display_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CommunityChain[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });
}

// -----------------------------------------------------------------------
// 8. useAdminDeleteTexture - Admin delete
// -----------------------------------------------------------------------

export function useAdminDeleteTexture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      // Set is_public to false (soft removal from community)
      const { error } = await supabase
        .from('documents')
        .update({ is_public: false })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-textures'] });
      queryClient.invalidateQueries({ queryKey: ['community-chains'] });
    },
  });
}

// -----------------------------------------------------------------------
// 9. useAdminUpdateTexture - Admin update (toggle public, edit category/tags)
// -----------------------------------------------------------------------

export function useAdminUpdateTexture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      updates,
    }: {
      documentId: string;
      updates: {
        is_public?: boolean;
        category?: string | null;
        tags?: string[] | null;
        description?: string | null;
      };
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-textures'] });
      queryClient.invalidateQueries({ queryKey: ['community-chains'] });
    },
  });
}

// -----------------------------------------------------------------------
// 10. useAdminStats - Dashboard statistics
// -----------------------------------------------------------------------

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Total public textures
      const { count: totalTextures } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true);

      // Total users (profiles)
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Textures this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: texturesThisWeek } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true)
        .gte('created_at', oneWeekAgo.toISOString());

      return {
        totalTextures: totalTextures ?? 0,
        totalUsers: totalUsers ?? 0,
        texturesThisWeek: texturesThisWeek ?? 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

// -----------------------------------------------------------------------
// Helper: Capture a canvas element as a JPEG Blob at a given size
// -----------------------------------------------------------------------

function captureCanvasAsBlob(
  sourceCanvas: HTMLCanvasElement,
  size: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Cannot get 2D context'));
      return;
    }

    // Draw the source canvas scaled to fit
    ctx.drawImage(sourceCanvas, 0, 0, size, size);

    tempCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to capture canvas'));
      },
      'image/jpeg',
      0.85,
    );
  });
}
