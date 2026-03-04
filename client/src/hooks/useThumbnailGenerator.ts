/**
 * useThumbnailGenerator - Batch renders thumbnails for public documents that lack them.
 * Creates a temporary offscreen WebGL context per document, renders its graph,
 * captures the result as JPEG, uploads to Supabase Storage, and updates the
 * document's thumbnail_url.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GLContext } from '@/gl/core/GLContext';
import { RenderPipeline } from '@/gl/pipeline/RenderPipeline';
import { deserializeGraph, SerializedGraph } from '@/utils/graphSerializer';

const THUMB_SIZE = 256;
const FETCH_BATCH = 20;

export interface ThumbnailProgress {
  done: number;
  total: number;
  errors: number;
  current: string | null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to capture canvas'));
      },
      'image/jpeg',
      0.85,
    );
  });
}

/** Small delay to let the browser GC reclaim WebGL contexts between renders. */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useThumbnailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ThumbnailProgress>({
    done: 0,
    total: 0,
    errors: 0,
    current: null,
  });
  const abortRef = useRef(false);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    abortRef.current = false;

    // Count documents needing thumbnails
    const { count } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true)
      .is('thumbnail_url', null);

    const total = count ?? 0;
    if (total === 0) {
      setIsGenerating(false);
      setProgress({ done: 0, total: 0, errors: 0, current: 'All thumbnails up to date!' });
      return { done: 0, errors: 0, total: 0 };
    }

    let done = 0;
    let errors = 0;
    setProgress({ done: 0, total, errors: 0, current: null });

    // Process in batches
    let offset = 0;
    while (offset < total && !abortRef.current) {
      const { data: docs, error: fetchError } = await supabase
        .from('documents')
        .select('id, user_id, name, data')
        .eq('is_public', true)
        .is('thumbnail_url', null)
        .order('created_at', { ascending: true })
        .range(offset, offset + FETCH_BATCH - 1);

      if (fetchError || !docs || docs.length === 0) break;

      for (const doc of docs) {
        if (abortRef.current) break;

        setProgress({ done, total, errors, current: doc.name });

        try {
          const graphData = (doc as any).data?.graphData as SerializedGraph | undefined;
          if (!graphData?.nodes || !graphData?.edges) {
            console.warn(`Skipping "${doc.name}": no graph data`);
            errors++;
            done++;
            continue;
          }

          // Create temporary offscreen canvas + WebGL pipeline
          const canvas = document.createElement('canvas');
          canvas.width = THUMB_SIZE;
          canvas.height = THUMB_SIZE;

          const glCtx = new GLContext(canvas);
          const pipeline = new RenderPipeline(glCtx);

          // Deserialize graph and render
          const { nodes, edges } = deserializeGraph(graphData);
          pipeline.render({ nodes, edges }, THUMB_SIZE, THUMB_SIZE);

          // Capture as JPEG blob
          const blob = await canvasToBlob(canvas);

          // Upload to Supabase Storage
          const filePath = `${doc.user_id}/${doc.id}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('thumbnails')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(filePath);

          // Update the document record
          const { error: updateError } = await supabase
            .from('documents')
            .update({ thumbnail_url: urlData.publicUrl })
            .eq('id', doc.id);

          if (updateError) throw updateError;

          // Cleanup GPU resources
          pipeline.dispose();

          done++;
        } catch (err) {
          console.error(`Thumbnail generation failed for "${doc.name}":`, err);
          errors++;
          done++;
        }

        setProgress({ done, total, errors, current: null });

        // Brief pause to let the browser reclaim GPU resources
        await sleep(50);
      }

      offset += FETCH_BATCH;
    }

    setIsGenerating(false);
    setProgress({ done, total, errors, current: null });
    return { done, errors, total };
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { generate, abort, isGenerating, progress };
}
