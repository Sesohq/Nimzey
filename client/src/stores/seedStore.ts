/**
 * seedStore - Hook for seeding the community library with texture presets.
 * Converts TemplateBuildResult → SerializedGraph and inserts as public documents.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { textureSeedData } from '@/data/textureSeedData';
import { v4 as uuidv4 } from 'uuid';

interface SerializedNode {
  id: string;
  definitionId: string;
  position: { x: number; y: number };
  parameters: Record<string, number | string | boolean | number[]>;
  enabled: boolean;
  collapsed: boolean;
  colorTag: string;
}

interface SerializedEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  dataType: string;
}

interface SerializedGraph {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  resultNodeId: string;
}

function convertToSerializedGraph(build: () => { nodes: any[]; edges: any[] }): SerializedGraph {
  const { nodes: templateNodes, edges: templateEdges } = build();
  const resultNodeId = uuidv4();
  const nodeIds = templateNodes.map(() => uuidv4());

  const nodes: SerializedNode[] = templateNodes.map((tn: any, i: number) => ({
    id: nodeIds[i],
    definitionId: tn.definitionId,
    position: tn.position,
    parameters: tn.parameters || {},
    enabled: true,
    collapsed: false,
    colorTag: 'none',
  }));

  // Add result node
  nodes.push({
    id: resultNodeId,
    definitionId: 'result',
    position: { x: 500, y: 200 },
    parameters: {},
    enabled: true,
    collapsed: false,
    colorTag: 'none',
  });

  const edges: SerializedEdge[] = templateEdges.map((te: any) => {
    const sourceId = te.sourceIdx >= 0 ? nodeIds[te.sourceIdx] : resultNodeId;
    const targetId = te.targetIdx >= 0 ? nodeIds[te.targetIdx] : resultNodeId;
    return {
      id: uuidv4(),
      sourceNodeId: sourceId,
      sourcePortId: te.sourcePort,
      targetNodeId: targetId,
      targetPortId: te.targetPort,
      dataType: 'color',
    };
  });

  return { nodes, edges, resultNodeId };
}

export function useSeedTextures() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

  const seed = useCallback(async (userId: string) => {
    setIsSeeding(true);
    const total = textureSeedData.length;
    setProgress({ done: 0, total, errors: 0 });

    let done = 0;
    let errors = 0;

    // Process in batches of 10
    const BATCH_SIZE = 10;
    for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
      const batch = textureSeedData.slice(batchStart, batchStart + BATCH_SIZE);

      const rows = batch.map((seed) => {
        try {
          const graphData = convertToSerializedGraph(seed.build);
          return {
            id: uuidv4(),
            user_id: userId,
            name: seed.name,
            data: { graphData, width: 512, height: 512 },
            is_public: true,
            show_filter_chain: true,
            description: seed.description,
            category: seed.category,
            tags: seed.tags,
            node_count: graphData.nodes.length,
            likes_count: 0,
            views_count: 0,
            thumbnail_url: null,
          };
        } catch (err) {
          console.error(`Build failed for "${seed.name}":`, err);
          errors++;
          return null;
        }
      }).filter(Boolean);

      if (rows.length > 0) {
        const { error } = await supabase.from('documents').insert(rows);
        if (error) {
          console.error(`Batch insert failed:`, error.message);
          errors += rows.length;
        } else {
          done += rows.length;
        }
      }

      setProgress({ done, total, errors });
    }

    setIsSeeding(false);
    return { done, errors };
  }, []);

  return { seed, isSeeding, progress };
}
