/**
 * TextureThumbnail - Lazy WebGL renderer for texture previews.
 * If a thumbnail_url exists, renders a plain <img>.
 * Otherwise, fetches the document's graph data, renders it via an offscreen
 * WebGL pipeline, and displays the result.  Rendered thumbnails are also
 * uploaded to Supabase Storage so future visits use the cached image.
 *
 * Uses IntersectionObserver so textures are only rendered when scrolled
 * into view, and a sequential queue so we don't overwhelm Supabase
 * connections or exhaust GPU contexts.
 */

import { useState, useEffect, useRef, memo } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GLContext } from '@/gl/core/GLContext';
import { RenderPipeline } from '@/gl/pipeline/RenderPipeline';
import { deserializeGraph, SerializedGraph } from '@/utils/graphSerializer';

const RENDER_SIZE = 256;
/** Wait this long after page load before any thumbnail rendering begins. */
const STARTUP_DELAY_MS = 2000;
/** Pause between each render to let the browser breathe. */
const INTER_RENDER_DELAY_MS = 100;

// ---------------------------------------------------------------------------
// Sequential render queue — processes ONE texture at a time after startup
// ---------------------------------------------------------------------------
type QueueEntry = {
  documentId: string;
  userId: string;
  onResult: (dataUrl: string) => void;
};

const renderQueue: QueueEntry[] = [];
let queueRunning = false;
let startupReady = false;

// After STARTUP_DELAY_MS, mark ready and kick off queue
if (typeof window !== 'undefined') {
  setTimeout(() => {
    startupReady = true;
    processQueue();
  }, STARTUP_DELAY_MS);
}

function enqueue(entry: QueueEntry) {
  // Don't enqueue duplicates
  if (renderQueue.some((e) => e.documentId === entry.documentId)) return;
  renderQueue.push(entry);
  if (startupReady) processQueue();
}

async function processQueue() {
  if (queueRunning || renderQueue.length === 0) return;
  queueRunning = true;

  while (renderQueue.length > 0) {
    const entry = renderQueue.shift()!;

    try {
      // Fetch graph data
      const { data: doc, error } = await supabase
        .from('documents')
        .select('data')
        .eq('id', entry.documentId)
        .single();

      if (error || !doc?.data?.graphData) continue;

      const graphData = doc.data.graphData as SerializedGraph;
      const dataUrl = renderGraphToDataURL(graphData);

      if (dataUrl) {
        renderedCache.set(entry.documentId, dataUrl);
        entry.onResult(dataUrl);
        // Upload in background (non-blocking)
        uploadThumbnail(entry.documentId, entry.userId, dataUrl);
      }
    } catch (err) {
      console.warn(`Thumbnail failed for ${entry.documentId}:`, err);
    }

    // Brief pause between renders so main-thread work isn't starved
    await sleep(INTER_RENDER_DELAY_MS);
  }

  queueRunning = false;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// In-memory cache so we never re-render the same texture in a session
// ---------------------------------------------------------------------------
const renderedCache = new Map<string, string>(); // docId -> dataURL

// ---------------------------------------------------------------------------
// Core: render a SerializedGraph to a JPEG data URL
// ---------------------------------------------------------------------------
function renderGraphToDataURL(graphData: SerializedGraph): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = RENDER_SIZE;
    canvas.height = RENDER_SIZE;
    const glCtx = new GLContext(canvas);
    const pipeline = new RenderPipeline(glCtx);
    const { nodes, edges } = deserializeGraph(graphData);
    pipeline.render({ nodes, edges }, RENDER_SIZE, RENDER_SIZE);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    pipeline.dispose();
    return dataUrl;
  } catch (err) {
    console.warn('TextureThumbnail render failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: upload rendered thumbnail in the background
// ---------------------------------------------------------------------------
async function uploadThumbnail(docId: string, userId: string, dataUrl: string) {
  try {
    // Only attempt upload if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const filePath = `${userId}/${docId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) return; // Silent

    const { data: urlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    await supabase
      .from('documents')
      .update({ thumbnail_url: urlData.publicUrl })
      .eq('id', docId);
  } catch {
    // Silent — the cached data URL still works for this session
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TextureThumbnailProps {
  documentId: string;
  userId: string;
  thumbnailUrl: string | null;
  className?: string;
  /** Image alt text */
  alt?: string;
  /** Placeholder icon size */
  iconSize?: number;
  /** Called when a renderable image URL becomes available (either thumbnail or lazy-rendered). */
  onRendered?: (imageUrl: string) => void;
}

export const TextureThumbnail = memo(function TextureThumbnail({
  documentId,
  userId,
  thumbnailUrl,
  className = '',
  alt = 'Texture preview',
  iconSize = 32,
  onRendered,
}: TextureThumbnailProps) {
  const initialSrc = thumbnailUrl || renderedCache.get(documentId) || null;
  const [src, setSrc] = useState<string | null>(initialSrc);
  const containerRef = useRef<HTMLDivElement>(null);
  const enqueuedRef = useRef(false);
  const onRenderedRef = useRef(onRendered);
  onRenderedRef.current = onRendered;

  // Notify parent of initial src if available on mount
  useEffect(() => {
    if (initialSrc && onRenderedRef.current) {
      onRenderedRef.current(initialSrc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Observe visibility and enqueue rendering when in view
  useEffect(() => {
    if (src || enqueuedRef.current) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !enqueuedRef.current) {
          enqueuedRef.current = true;
          observer.disconnect();
          enqueue({
            documentId,
            userId,
            onResult: (dataUrl) => {
              setSrc(dataUrl);
              onRenderedRef.current?.(dataUrl);
            },
          });
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, documentId, userId]);

  // If we have an image, just render it
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
      />
    );
  }

  // Placeholder — shows icon while waiting in queue / rendering
  return (
    <div ref={containerRef} className={`flex items-center justify-center ${className}`}>
      {enqueuedRef.current ? (
        <Loader2 size={iconSize * 0.6} className="animate-spin text-[#525252]" />
      ) : (
        <ImageIcon size={iconSize} className="text-[#333]" />
      )}
    </div>
  );
});

export default TextureThumbnail;
