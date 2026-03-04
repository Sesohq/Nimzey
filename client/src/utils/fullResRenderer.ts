/**
 * fullResRenderer - On-demand full-resolution texture rendering.
 * Creates an offscreen WebGL context, renders the graph at 3840x2160,
 * and returns a PNG Blob for download.
 */

import { supabase } from '@/lib/supabase';
import { GLContext } from '@/gl/core/GLContext';
import { RenderPipeline } from '@/gl/pipeline/RenderPipeline';
import { deserializeGraph, SerializedGraph } from '@/utils/graphSerializer';

const FULL_RES_WIDTH = 3840;
const FULL_RES_HEIGHT = 2160;

/**
 * Render a document's graph at full resolution (3840x2160) and return as PNG Blob.
 * Fetches graph data from Supabase, renders offscreen, cleans up GL resources.
 */
export async function renderFullRes(documentId: string): Promise<Blob | null> {
  // Fetch graph data
  const { data: doc, error } = await supabase
    .from('documents')
    .select('data')
    .eq('id', documentId)
    .single();

  if (error || !doc?.data?.graphData) {
    console.error('[fullResRenderer] Failed to fetch graph data:', error?.message);
    return null;
  }

  const graphData = doc.data.graphData as SerializedGraph;

  try {
    // Create offscreen canvas at full resolution
    const canvas = document.createElement('canvas');
    canvas.width = FULL_RES_WIDTH;
    canvas.height = FULL_RES_HEIGHT;

    console.log(`[fullResRenderer] Canvas created: ${canvas.width}x${canvas.height}`);

    const glCtx = new GLContext(canvas);
    const pipeline = new RenderPipeline(glCtx);

    // Deserialize and render
    const { nodes, edges } = deserializeGraph(graphData);
    console.log(`[fullResRenderer] Graph: ${nodes.size} nodes, ${edges.size} edges`);

    // Verify result node exists
    let hasResultNode = false;
    for (const node of nodes.values()) {
      if (node.definitionId === 'result' || node.definitionId === 'result-pbr') {
        hasResultNode = true;
        break;
      }
    }
    console.log(`[fullResRenderer] Has result node: ${hasResultNode}`);

    pipeline.render({ nodes, edges }, FULL_RES_WIDTH, FULL_RES_HEIGHT);

    // Verify canvas dimensions after render
    console.log(`[fullResRenderer] Post-render canvas: ${canvas.width}x${canvas.height}`);

    // Convert to PNG blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => {
          console.log(`[fullResRenderer] Blob created: ${b ? `${b.size} bytes, ${b.type}` : 'null'}`);
          resolve(b);
        },
        'image/png',
        1.0,
      );
    });

    // Clean up GL resources
    pipeline.dispose();

    return blob;
  } catch (err) {
    console.error('[fullResRenderer] Render failed:', err);
    return null;
  }
}
