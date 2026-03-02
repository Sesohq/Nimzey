/**
 * CommunityStore - TanStack Query hooks for community features.
 * Handles browsing public documents, publishing, and cloning.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface CommunityChain {
  id: string;
  user_id: string;
  name: string;
  data: any;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

const PAGE_SIZE = 20;

// -----------------------------------------------------------------------
// 1. useCommunityChains - Browse public documents with pagination & search
// -----------------------------------------------------------------------

export function useCommunityChains(search?: string) {
  return useInfiniteQuery<CommunityChain[], Error>({
    queryKey: ['community-chains', search],
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('documents')
        .select('*, profiles(display_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as CommunityChain[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });
}

// -----------------------------------------------------------------------
// 2. usePublishChain - Publish a document to the community
// -----------------------------------------------------------------------

export function usePublishChain() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      docId,
      userId,
      canvasElement,
    }: {
      docId: string;
      userId: string;
      canvasElement: HTMLCanvasElement;
    }) => {
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

      // Step 4: Update the document to be public
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          is_public: true,
          thumbnail_url: thumbnailUrl,
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
    }: {
      chainId: string;
      userId: string;
    }) => {
      // Step 1: Fetch the original document
      const { data: original, error: fetchError } = await supabase
        .from('documents')
        .select('name, data')
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
          data: original.data,
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
