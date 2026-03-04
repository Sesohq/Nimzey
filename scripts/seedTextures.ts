/**
 * Seed script - Converts texture presets to Supabase documents.
 *
 * Run with:
 *   ADMIN_PASSWORD=yourpassword npx vite-node scripts/seedTextures.ts
 *
 * This script:
 * 1. Signs in as the admin user (sesohq@nimzey.app)
 * 2. Imports all 100 texture seed definitions
 * 3. Converts each TemplateBuildResult → SerializedGraph format
 * 4. Inserts them as public documents with show_filter_chain=true
 */

import { createClient } from '@supabase/supabase-js';
import { textureSeedData } from '@/data/textureSeedData';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = 'https://hrzycikekymemyjmeeuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyenljaWtla3ltZW15am1lZXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDk5MDcsImV4cCI6MjA4NzgyNTkwN30.GJ3xd6iZvxuWhaIzR-mAKU2GvIHyX0kOVW7Xzg7cWF0';

const ADMIN_EMAIL = 'sesohq@nimzey.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_PASSWORD) {
  console.error('❌ Set ADMIN_PASSWORD environment variable');
  console.error('   Usage: ADMIN_PASSWORD=yourpassword npx vite-node scripts/seedTextures.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const nodes: SerializedNode[] = templateNodes.map((tn, i) => ({
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

async function main() {
  // Sign in as admin
  console.log(`🔐 Signing in as ${ADMIN_EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error('❌ Auth failed:', authError?.message || 'No user returned');
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Signed in as ${userId}\n`);

  console.log(`🌱 Seeding ${textureSeedData.length} textures into community library...`);

  let success = 0;
  let failed = 0;
  const BATCH_SIZE = 10;

  for (let batchStart = 0; batchStart < textureSeedData.length; batchStart += BATCH_SIZE) {
    const batch = textureSeedData.slice(batchStart, batchStart + BATCH_SIZE);
    const rows: any[] = [];

    for (const seed of batch) {
      try {
        const graphData = convertToSerializedGraph(seed.build);
        rows.push({
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
        });
      } catch (err: any) {
        console.error(`   ❌ Build failed: ${seed.name} — ${err.message}`);
        failed++;
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('documents').insert(rows);
      if (error) {
        console.error(`   ❌ Batch insert failed (${batchStart + 1}-${batchStart + rows.length}): ${error.message}`);
        failed += rows.length;
      } else {
        success += rows.length;
        console.log(`   ✅ Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: ${rows.map(r => r.name).join(', ')}`);
      }
    }
  }

  console.log(`\n🏁 Done! ${success} seeded, ${failed} failed out of ${textureSeedData.length} total.`);
  await supabase.auth.signOut();
}

main();
