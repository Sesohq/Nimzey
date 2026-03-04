/**
 * Texture Seed Batch 4 — Nature + Minimal + Creative Mix
 * 25 procedural texture definitions for the node-based texture editor.
 */

import type { TemplateBuildResult, TemplateNode, TemplateEdge } from '@/templates/graphTemplates';

export interface TextureSeed {
  name: string;
  description: string;
  category: string;
  tags: string[];
  build: () => TemplateBuildResult;
}

const COL = 280;
const ROW = 160;
const pos = (col: number, row: number) => ({ x: 500 - col * COL, y: 200 + row * ROW });
const e = (sourceIdx: number, sourcePort: string, targetIdx: number, targetPort: string): TemplateEdge => ({ sourceIdx, sourcePort, targetIdx, targetPort });

// =============================================================================
// NATURE (1-10)
// =============================================================================

// 1. Forest Floor
// Perlin + cells -> overlay -> green/brown hue -> noise distort
function buildForestFloor(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(6, -1), parameters: { scale: 5, octaves: 6, roughness: 0.6, seed: 10, contrast: 12 } },
    /*  1 */ { definitionId: 'cells-noise', position: pos(6, 1), parameters: { scale: 8, formula: 0, octaves: 4 } },
    /*  2 */ { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 9, opacity: 70 } },
    /*  3 */ { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 25, scale: 4, octaves: 3 } },
    /*  4 */ { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 12, octaves: 3, roughness: 0.4, seed: 50 } },
    /*  5 */ { definitionId: 'blur', position: pos(4, 2), parameters: { radius: 3 } },
    /*  6 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 2, opacity: 40 } },
    /*  7 */ { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 1.2 } },
    /*  8 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 80, saturation: 45, lightness: -15 } },
    /*  9 */ { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { brightness: -10, contrast: 20 } },
    /* 10 */ { definitionId: 'noise-distortion', position: pos(0, 0), parameters: { distortion: 10, scale: 6 } },
    /* 11 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 35 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(4, 'out', 5, 'source'),
    e(3, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
    e(6, 'out', 7, 'source'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', 10, 'source'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 2. Ocean Waves
// Perlin + wave multiple -> blur -> blue/teal hue -> levels
function buildOceanWaves(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 5, roughness: 0.55, seed: 20 } },
    /*  1 */ { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.06, ampY: 0.03, freqX: 4, freqY: 8, type: 0 } },
    /*  2 */ { definitionId: 'wave', position: pos(3, 0), parameters: { ampX: 0.02, ampY: 0.05, freqX: 7, freqY: 3, type: 0 } },
    /*  3 */ { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 4 } },
    /*  4 */ { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 10, octaves: 3, roughness: 0.4, seed: 80 } },
    /*  5 */ { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 10, opacity: 30 } },
    /*  6 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 90, gamma: 1.3 } },
    /*  7 */ { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: -110, saturation: 60, lightness: -10 } },
    /*  8 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 15 } },
    /*  9 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 25 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 7, 'source'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 3. Tree Bark
// Perlin stretched vertical + cells -> multiply -> dark brown tones
function buildTreeBark(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(5, -1), parameters: { scale: 4, octaves: 7, roughness: 0.65, seed: 30, contrast: 18 } },
    /*  1 */ { definitionId: 'scale', position: pos(4, -1), parameters: { scaleX: 0.3, scaleY: 1.8 } },
    /*  2 */ { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 6, formula: 1, octaves: 3 } },
    /*  3 */ { definitionId: 'scale', position: pos(4, 1), parameters: { scaleX: 0.4, scaleY: 1.5 } },
    /*  4 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 2, opacity: 80 } },
    /*  5 */ { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 15, scale: 5 } },
    /*  6 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 75, gamma: 0.8 } },
    /*  7 */ { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: 30, saturation: 35, lightness: -25 } },
    /*  8 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -15, contrast: 30 } },
    /*  9 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 50 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(2, 'out', 3, 'source'),
    e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 7, 'source'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 4. River Stones
// Cells large + perlin fine -> noise distort -> spherize -> warm grey
function buildRiverStones(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(6, -1), parameters: { scale: 4, formula: 0, octaves: 3 } },
    /*  1 */ { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 15, octaves: 4, roughness: 0.5, seed: 40 } },
    /*  2 */ { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 9, opacity: 50 } },
    /*  3 */ { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 20, scale: 3, octaves: 3 } },
    /*  4 */ { definitionId: 'spherize', position: pos(3, 0), parameters: { strength: 45 } },
    /*  5 */ { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 2 } },
    /*  6 */ { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 25, octaves: 2, roughness: 0.3, seed: 90 } },
    /*  7 */ { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 10, opacity: 20 } },
    /*  8 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 88, gamma: 1.1 } },
    /*  9 */ { definitionId: 'desaturate', position: pos(1, 1) },
    /* 10 */ { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 25, saturation: 20, lightness: -5 } },
    /* 11 */ { definitionId: 'brightness-contrast', position: pos(0, 1), parameters: { contrast: 15 } },
    /* 12 */ { definitionId: 'sharpen', position: pos(0, 2), parameters: { amount: 30 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', 10, 'source'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 12, 'source'),
    e(12, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 5. Desert Sand
// Perlin low freq + perlin high freq -> screen -> warm golden tones
function buildDesertSand(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(4, -1), parameters: { scale: 2, octaves: 4, roughness: 0.5, seed: 50, contrast: 8 } },
    /*  1 */ { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 18, octaves: 3, roughness: 0.35, seed: 150 } },
    /*  2 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 6, opacity: 60 } },
    /*  3 */ { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 8, scale: 6 } },
    /*  4 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 1.3 } },
    /*  5 */ { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: 35, saturation: 40, lightness: 10 } },
    /*  6 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: 10 } },
    /*  7 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.2 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 7, 'source'),
    e(7, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 6. Ice Crystals
// Cells + kaleidoscope 6 -> edge detect -> blur -> cold blue glow
function buildIceCrystals(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(6, 0), parameters: { scale: 6, formula: 2, octaves: 4 } },
    /*  1 */ { definitionId: 'kaleidoscope', position: pos(5, 0), parameters: { segments: 6 } },
    /*  2 */ { definitionId: 'edge-detector', position: pos(4, 0) },
    /*  3 */ { definitionId: 'invert', position: pos(3, 0) },
    /*  4 */ { definitionId: 'blur', position: pos(3, 1), parameters: { radius: 3 } },
    /*  5 */ { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 5, inWhite: 60, gamma: 2.0 } },
    /*  6 */ { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 10, octaves: 3, roughness: 0.4, seed: 60 } },
    /*  7 */ { definitionId: 'blur', position: pos(3, 2), parameters: { radius: 5 } },
    /*  8 */ { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 6, opacity: 40 } },
    /*  9 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -130, saturation: 55, lightness: 10 } },
    /* 10 */ { definitionId: 'levels', position: pos(1, 1), parameters: { inBlack: 0, inWhite: 95, gamma: 1.5 } },
    /* 11 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 15, contrast: 20 } },
    /* 12 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 25 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 8, 'foreground'),
    e(6, 'out', 7, 'source'), e(7, 'out', 8, 'background'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', 10, 'source'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 12, 'source'),
    e(12, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 7. Moss Garden
// Perlin + cells fine -> multiply -> strong green hue shift
function buildMossGarden(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(5, -1), parameters: { scale: 6, octaves: 5, roughness: 0.55, seed: 70, contrast: 10 } },
    /*  1 */ { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 14, formula: 0, octaves: 3 } },
    /*  2 */ { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 65 } },
    /*  3 */ { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 12, scale: 5 } },
    /*  4 */ { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 20, octaves: 2, seed: 120 } },
    /*  5 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 25 } },
    /*  6 */ { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 12, inWhite: 82 } },
    /*  7 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 100, saturation: 65, lightness: -15 } },
    /*  8 */ { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { brightness: -8, contrast: 25 } },
    /*  9 */ { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 40 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 7, 'source'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 8. Thunderstorm
// Perlin -> cells -> edge detect -> invert -> dark blue overlay -> glow
function buildThunderstorm(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(7, -1), parameters: { scale: 3, octaves: 7, roughness: 0.6, seed: 80, contrast: 20 } },
    /*  1 */ { definitionId: 'cells-noise', position: pos(7, 1), parameters: { scale: 5, formula: 2, octaves: 4 } },
    /*  2 */ { definitionId: 'blend', position: pos(6, 0), parameters: { mode: 9, opacity: 60 } },
    /*  3 */ { definitionId: 'edge-detector', position: pos(5, 0) },
    /*  4 */ { definitionId: 'invert', position: pos(4, 0) },
    /*  5 */ { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 30, inWhite: 70, gamma: 0.6 } },
    /*  6 */ { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 8, octaves: 3, roughness: 0.4, seed: 200 } },
    /*  7 */ { definitionId: 'blur', position: pos(4, 2), parameters: { radius: 6 } },
    /*  8 */ { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 6, opacity: 50 } },
    /*  9 */ { definitionId: 'blur', position: pos(4, -1), parameters: { radius: 8 } },
    /* 10 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 6, opacity: 35 } },
    /* 11 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -140, saturation: 50, lightness: -20 } },
    /* 12 */ { definitionId: 'levels', position: pos(1, 1), parameters: { inBlack: 5, inWhite: 80 } },
    /* 13 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -15, contrast: 35 } },
    /* 14 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 0.7 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 8, 'foreground'),
    e(6, 'out', 7, 'source'), e(7, 'out', 8, 'background'),
    e(4, 'out', 9, 'source'),
    e(8, 'out', 10, 'foreground'), e(9, 'out', 10, 'background'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 12, 'source'),
    e(12, 'out', 13, 'source'),
    e(13, 'out', 14, 'source'),
    e(14, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 9. Autumn Leaves
// Cells + perlin -> spectrum -> warm hue -> noise distort -> blend
function buildAutumnLeaves(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(6, -1), parameters: { scale: 5, formula: 0, octaves: 4 } },
    /*  1 */ { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 7, octaves: 5, roughness: 0.55, seed: 90 } },
    /*  2 */ { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 9, opacity: 65 } },
    /*  3 */ { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 18, scale: 4 } },
    /*  4 */ { definitionId: 'spectrum', position: pos(5, 2) },
    /*  5 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 9, opacity: 55 } },
    /*  6 */ { definitionId: 'hue-saturation', position: pos(2, 0), parameters: { hue: 15, saturation: 50, lightness: -5 } },
    /*  7 */ { definitionId: 'perlin-noise', position: pos(4, -2), parameters: { scale: 12, octaves: 3, seed: 160 } },
    /*  8 */ { definitionId: 'blur', position: pos(3, -2), parameters: { radius: 4 } },
    /*  9 */ { definitionId: 'blend', position: pos(2, -1), parameters: { mode: 10, opacity: 30 } },
    /* 10 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 8, inWhite: 90, gamma: 1.1 } },
    /* 11 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 20 } },
    /* 12 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 30 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 9, 'foreground'),
    e(7, 'out', 8, 'source'), e(8, 'out', 9, 'background'),
    e(9, 'out', 10, 'source'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 12, 'source'),
    e(12, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 10. Snowdrift
// Perlin + blur heavy -> levels bright -> cold tint -> subtle cells
function buildSnowdrift(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 6, roughness: 0.5, seed: 100, contrast: 6 } },
    /*  1 */ { definitionId: 'blur', position: pos(4, 0), parameters: { radius: 6 } },
    /*  2 */ { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 30, inWhite: 70, gamma: 2.5 } },
    /*  3 */ { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 12, formula: 0, octaves: 2 } },
    /*  4 */ { definitionId: 'blur', position: pos(4, 1), parameters: { radius: 3 } },
    /*  5 */ { definitionId: 'levels', position: pos(3, 1), parameters: { inBlack: 40, inWhite: 80 } },
    /*  6 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 20 } },
    /*  7 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -150, saturation: 15, lightness: 20 } },
    /*  8 */ { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { brightness: 25, contrast: 5 } },
    /*  9 */ { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 1.6 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(2, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
    e(6, 'out', 7, 'source'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// =============================================================================
// MINIMAL (11-18)
// =============================================================================

// 11. Zen Lines
// Wave single direction -> levels extreme -> desaturate -> clean
function buildZenLines(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(3, 0), parameters: { scale: 2, octaves: 3, roughness: 0.4, seed: 110 } },
    /*  1 */ { definitionId: 'wave', position: pos(2, 0), parameters: { ampX: 0.0, ampY: 0.1, freqX: 1, freqY: 12, type: 0 } },
    /*  2 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 35, inWhite: 65, gamma: 1.0 } },
    /*  3 */ { definitionId: 'desaturate', position: pos(1, 1) },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 30 } },
    /*  5 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 20 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 12. Dot Matrix
// Cells fine -> threshold -> blur 1px -> levels -> desaturate
function buildDotMatrix(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(3, 0), parameters: { scale: 18, formula: 0, octaves: 1 } },
    /*  1 */ { definitionId: 'threshold', position: pos(2, 0), parameters: { threshold: 45 } },
    /*  2 */ { definitionId: 'blur', position: pos(2, 1), parameters: { radius: 1 } },
    /*  3 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 90 } },
    /*  4 */ { definitionId: 'desaturate', position: pos(1, 1) },
    /*  5 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { contrast: 15 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 13. Gradient Wash
// Perlin large scale + blur heavy -> levels soft -> subtle color
function buildGradientWash(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(3, 0), parameters: { scale: 1, octaves: 3, roughness: 0.4, seed: 130, contrast: 5 } },
    /*  1 */ { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 12 } },
    /*  2 */ { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 1.4 } },
    /*  3 */ { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: 40, saturation: 25, lightness: 10 } },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: -5 } },
    /*  5 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.3 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 14. Whisper
// Perlin very subtle + blur -> levels soft contrast -> warm slight
function buildWhisper(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(3, 0), parameters: { scale: 4, octaves: 4, roughness: 0.35, seed: 140, contrast: 3 } },
    /*  1 */ { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 5 } },
    /*  2 */ { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 30, inWhite: 70, gamma: 1.5 } },
    /*  3 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 20, saturation: 10, lightness: 15 } },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 15, contrast: -10 } },
    /*  5 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.4 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 15. Monochrome Grid
// Checker + blur slight -> levels -> desaturate -> contrast
function buildMonochromeGrid(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'checker', position: pos(3, 0), parameters: { scale: 12 } },
    /*  1 */ { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 2 } },
    /*  2 */ { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 15, inWhite: 85 } },
    /*  3 */ { definitionId: 'desaturate', position: pos(1, 0) },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { contrast: 35 } },
    /*  5 */ { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 15 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 16. Soft Focus
// Perlin + blur heavy + levels gentle -> warm tint
function buildSoftFocus(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(3, 0), parameters: { scale: 5, octaves: 5, roughness: 0.5, seed: 160, contrast: 8 } },
    /*  1 */ { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 8 } },
    /*  2 */ { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 20, inWhite: 75, gamma: 1.6 } },
    /*  3 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 25, saturation: 15, lightness: 8 } },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: -8 } },
    /*  5 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.3 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 17. Clean Noise
// Perlin medium -> levels balanced -> desaturate -> sharpen slight
function buildCleanNoise(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(3, 0), parameters: { scale: 8, octaves: 4, roughness: 0.5, seed: 170 } },
    /*  1 */ { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 15, inWhite: 85, gamma: 1.0 } },
    /*  2 */ { definitionId: 'desaturate', position: pos(2, 1) },
    /*  3 */ { definitionId: 'sharpen', position: pos(1, 0), parameters: { amount: 20 } },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { contrast: 10 } },
    /*  5 */ { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 1.1 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 18. Paper White
// Perlin fine subtle + levels bright -> very slight warm tint
function buildPaperWhite(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(3, 0), parameters: { scale: 15, octaves: 3, roughness: 0.3, seed: 180, contrast: 2 } },
    /*  1 */ { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 40, inWhite: 60, gamma: 3.0 } },
    /*  2 */ { definitionId: 'blur', position: pos(2, 1), parameters: { radius: 1 } },
    /*  3 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 15, saturation: 8, lightness: 25 } },
    /*  4 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 30, contrast: -15 } },
    /*  5 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.8 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// =============================================================================
// CREATIVE MIX (19-25)
// =============================================================================

// 19. Retro Sunset
// Gradient warm + perlin -> wave -> polar coords -> levels -> spectrum
function buildRetroSunset(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(7, -1), parameters: { scale: 3, octaves: 5, roughness: 0.5, seed: 190 } },
    /*  1 */ { definitionId: 'gradient-3-color', position: pos(7, 1), parameters: { color1: '#ff4400', color2: '#ff8800', color3: '#ffdd00', angle: 90 } },
    /*  2 */ { definitionId: 'blend', position: pos(6, 0), parameters: { mode: 9, opacity: 60 } },
    /*  3 */ { definitionId: 'wave', position: pos(5, 0), parameters: { ampX: 0.04, ampY: 0.06, freqX: 3, freqY: 5, type: 0 } },
    /*  4 */ { definitionId: 'polar-coordinates', position: pos(4, 0), parameters: { mode: 0 } },
    /*  5 */ { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 10, inWhite: 90, gamma: 1.2 } },
    /*  6 */ { definitionId: 'spectrum', position: pos(4, 2) },
    /*  7 */ { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 9, opacity: 45 } },
    /*  8 */ { definitionId: 'perlin-noise', position: pos(5, -2), parameters: { scale: 10, octaves: 3, seed: 250 } },
    /*  9 */ { definitionId: 'blur', position: pos(4, -2), parameters: { radius: 4 } },
    /* 10 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 30 } },
    /* 11 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -10, saturation: 55, lightness: 5 } },
    /* 12 */ { definitionId: 'halftone', position: pos(2, 2), parameters: { scale: 4, angle: 45 } },
    /* 13 */ { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 10, opacity: 15 } },
    /* 14 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 20 } },
    /* 15 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.1 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
    e(7, 'out', 10, 'foreground'),
    e(8, 'out', 9, 'source'), e(9, 'out', 10, 'background'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 13, 'foreground'), e(12, 'out', 13, 'background'),
    e(13, 'out', 14, 'source'),
    e(14, 'out', 15, 'source'),
    e(15, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 20. Cyberpunk Neon
// Cells -> edge detect -> spectrum -> blur glow -> screen blend on dark
function buildCyberpunkNeon(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(7, 0), parameters: { scale: 6, formula: 2, octaves: 3 } },
    /*  1 */ { definitionId: 'edge-detector', position: pos(6, 0) },
    /*  2 */ { definitionId: 'levels', position: pos(5, 0), parameters: { inBlack: 20, inWhite: 55, gamma: 0.5 } },
    /*  3 */ { definitionId: 'spectrum', position: pos(6, 2) },
    /*  4 */ { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 90 } },
    /*  5 */ { definitionId: 'blur', position: pos(4, 1), parameters: { radius: 4 } },
    /*  6 */ { definitionId: 'levels', position: pos(3, 1), parameters: { inBlack: 0, inWhite: 50, gamma: 2.0 } },
    /*  7 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 6, opacity: 80 } },
    /*  8 */ { definitionId: 'perlin-noise', position: pos(5, -2), parameters: { scale: 4, octaves: 4, seed: 300, contrast: 15 } },
    /*  9 */ { definitionId: 'noise-distortion', position: pos(4, -2), parameters: { distortion: 10, scale: 5 } },
    /* 10 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 25 } },
    /* 11 */ { definitionId: 'perlin-noise', position: pos(3, -2), parameters: { scale: 15, octaves: 2, seed: 350 } },
    /* 12 */ { definitionId: 'blur', position: pos(2, -2), parameters: { radius: 6 } },
    /* 13 */ { definitionId: 'blend', position: pos(1, -1), parameters: { mode: 6, opacity: 35 } },
    /* 14 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -30, saturation: 70, lightness: -5 } },
    /* 15 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -20, contrast: 40 } },
    /* 16 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 35 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
    e(4, 'out', 5, 'source'),
    e(5, 'out', 6, 'source'),
    e(4, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
    e(8, 'out', 9, 'source'),
    e(7, 'out', 10, 'foreground'), e(9, 'out', 10, 'background'),
    e(11, 'out', 12, 'source'),
    e(10, 'out', 13, 'foreground'), e(12, 'out', 13, 'background'),
    e(13, 'out', 14, 'source'),
    e(14, 'out', 15, 'source'),
    e(15, 'out', 16, 'source'),
    e(16, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 21. Watercolor Bloom
// Perlin + blur + noise distort -> levels -> warm pastel hue shift
function buildWatercolorBloom(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 4, octaves: 6, roughness: 0.55, seed: 210, contrast: 10 } },
    /*  1 */ { definitionId: 'blur', position: pos(5, 0), parameters: { radius: 6 } },
    /*  2 */ { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 35, scale: 3, octaves: 3 } },
    /*  3 */ { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 8, octaves: 4, roughness: 0.4, seed: 260 } },
    /*  4 */ { definitionId: 'blur', position: pos(5, 2), parameters: { radius: 8 } },
    /*  5 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 9, opacity: 50 } },
    /*  6 */ { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 15, inWhite: 85, gamma: 1.4 } },
    /*  7 */ { definitionId: 'spectrum', position: pos(3, 2) },
    /*  8 */ { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 10, opacity: 40 } },
    /*  9 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 30, saturation: 35, lightness: 15 } },
    /* 10 */ { definitionId: 'blur', position: pos(1, 1), parameters: { radius: 2 } },
    /* 11 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: -5 } },
    /* 12 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.3 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(3, 'out', 4, 'source'),
    e(2, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 8, 'foreground'), e(7, 'out', 8, 'background'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', 10, 'source'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 12, 'source'),
    e(12, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 22. Stained Glass
// Cells -> edge detect -> invert -> blur -> cells color -> mask
function buildStainedGlass(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(7, 0), parameters: { scale: 5, formula: 0, octaves: 2 } },
    /*  1 */ { definitionId: 'edge-detector', position: pos(6, 0) },
    /*  2 */ { definitionId: 'invert', position: pos(5, 0) },
    /*  3 */ { definitionId: 'blur', position: pos(4, 0), parameters: { radius: 2 } },
    /*  4 */ { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 0, inWhite: 50, gamma: 0.5 } },
    /*  5 */ { definitionId: 'cells-noise', position: pos(7, 2), parameters: { scale: 5, formula: 0, octaves: 2 } },
    /*  6 */ { definitionId: 'spectrum', position: pos(6, 2) },
    /*  7 */ { definitionId: 'blend', position: pos(5, 2), parameters: { mode: 9, opacity: 70 } },
    /*  8 */ { definitionId: 'hue-saturation', position: pos(4, 2), parameters: { hue: 0, saturation: 60 } },
    /*  9 */ { definitionId: 'gradient-3-color', position: pos(5, 3), parameters: { color1: '#1a1a1a', color2: '#2a2a2a', color3: '#1a1a1a', angle: 0 } },
    /* 10 */ { definitionId: 'mask', position: pos(2, 0) },
    /* 11 */ { definitionId: 'blur', position: pos(1, 0), parameters: { radius: 1 } },
    /* 12 */ { definitionId: 'perlin-noise', position: pos(3, -2), parameters: { scale: 10, octaves: 3, seed: 400 } },
    /* 13 */ { definitionId: 'blur', position: pos(2, -2), parameters: { radius: 5 } },
    /* 14 */ { definitionId: 'blend', position: pos(1, -1), parameters: { mode: 10, opacity: 20 } },
    /* 15 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 25 } },
    /* 16 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 30 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 4, 'source'),
    e(5, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 10, 'source'), e(4, 'out', 10, 'mask'), e(9, 'out', 10, 'background'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 14, 'foreground'),
    e(12, 'out', 13, 'source'), e(13, 'out', 14, 'background'),
    e(14, 'out', 15, 'source'),
    e(15, 'out', 16, 'source'),
    e(16, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 23. Vapor Wave
// Perlin + polar -> spectrum -> wave -> halftone overlay -> pink/purple
function buildVaporWave(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'perlin-noise', position: pos(7, 0), parameters: { scale: 3, octaves: 5, roughness: 0.5, seed: 230, contrast: 12 } },
    /*  1 */ { definitionId: 'polar-coordinates', position: pos(6, 0), parameters: { mode: 0 } },
    /*  2 */ { definitionId: 'spectrum', position: pos(6, 2) },
    /*  3 */ { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 9, opacity: 65 } },
    /*  4 */ { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.05, ampY: 0.03, freqX: 5, freqY: 8, type: 0 } },
    /*  5 */ { definitionId: 'perlin-noise', position: pos(6, -2), parameters: { scale: 6, octaves: 3, seed: 280 } },
    /*  6 */ { definitionId: 'halftone', position: pos(5, -2), parameters: { scale: 5, angle: 30 } },
    /*  7 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 9, opacity: 30 } },
    /*  8 */ { definitionId: 'gradient-3-color', position: pos(5, 3), parameters: { color1: '#ff00aa', color2: '#8800ff', color3: '#00ccff', angle: 135 } },
    /*  9 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 50 } },
    /* 10 */ { definitionId: 'blur', position: pos(3, 2), parameters: { radius: 3 } },
    /* 11 */ { definitionId: 'perlin-noise', position: pos(4, -1), parameters: { scale: 12, octaves: 2, seed: 320 } },
    /* 12 */ { definitionId: 'blur', position: pos(3, -1), parameters: { radius: 6 } },
    /* 13 */ { definitionId: 'blend', position: pos(1, -1), parameters: { mode: 6, opacity: 30 } },
    /* 14 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -20, saturation: 60, lightness: 5 } },
    /* 15 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 15 } },
    /* 16 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 20 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
    e(3, 'out', 4, 'source'),
    e(5, 'out', 6, 'source'),
    e(4, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
    e(8, 'out', 10, 'source'),
    e(7, 'out', 9, 'foreground'), e(10, 'out', 9, 'background'),
    e(11, 'out', 12, 'source'),
    e(9, 'out', 13, 'foreground'), e(12, 'out', 13, 'background'),
    e(13, 'out', 14, 'source'),
    e(14, 'out', 15, 'source'),
    e(15, 'out', 16, 'source'),
    e(16, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 24. Batik Fabric
// Cells -> noise distort -> wave -> kaleidoscope -> warm earthy tones
function buildBatikFabric(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'cells-noise', position: pos(6, 0), parameters: { scale: 6, formula: 0, octaves: 4 } },
    /*  1 */ { definitionId: 'noise-distortion', position: pos(5, 0), parameters: { distortion: 30, scale: 4, octaves: 3 } },
    /*  2 */ { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.03, ampY: 0.04, freqX: 5, freqY: 4, type: 0 } },
    /*  3 */ { definitionId: 'kaleidoscope', position: pos(3, 0), parameters: { segments: 8 } },
    /*  4 */ { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 8, octaves: 3, roughness: 0.4, seed: 240 } },
    /*  5 */ { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 9, opacity: 40 } },
    /*  6 */ { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 10, inWhite: 88, gamma: 1.1 } },
    /*  7 */ { definitionId: 'gradient-3-color', position: pos(3, 2), parameters: { color1: '#2a1500', color2: '#8b4513', color3: '#d2691e', angle: 45 } },
    /*  8 */ { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 10, opacity: 55 } },
    /*  9 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 10, saturation: 45, lightness: -5 } },
    /* 10 */ { definitionId: 'noise-distortion', position: pos(1, 1), parameters: { distortion: 5, scale: 8 } },
    /* 11 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 20 } },
    /* 12 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 35 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'),
    e(1, 'out', 2, 'source'),
    e(2, 'out', 3, 'source'),
    e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
    e(5, 'out', 6, 'source'),
    e(6, 'out', 8, 'foreground'), e(7, 'out', 8, 'background'),
    e(8, 'out', 9, 'source'),
    e(9, 'out', 10, 'source'),
    e(10, 'out', 11, 'source'),
    e(11, 'out', 12, 'source'),
    e(12, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// 25. Holographic
// UV -> math ops -> fract -> spectrum -> noise distort -> refraction
function buildHolographic(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    /*  0 */ { definitionId: 'uv-coordinates', position: pos(9, 0) },
    /*  1 */ { definitionId: 'math-split-vec2', position: pos(8, -1) },
    /*  2 */ { definitionId: 'math-split-vec2', position: pos(8, 1) },
    /*  3 */ { definitionId: 'math-sine', position: pos(7, -1) },
    /*  4 */ { definitionId: 'math-cosine', position: pos(7, 1) },
    /*  5 */ { definitionId: 'math-multiply', position: pos(6, 0) },
    /*  6 */ { definitionId: 'perlin-noise', position: pos(8, -2), parameters: { scale: 5, octaves: 4, roughness: 0.5, seed: 250 } },
    /*  7 */ { definitionId: 'math-add', position: pos(5, -1) },
    /*  8 */ { definitionId: 'math-fract', position: pos(4, -1) },
    /*  9 */ { definitionId: 'spectrum', position: pos(5, 2) },
    /* 10 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 9, opacity: 70 } },
    /* 11 */ { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 20, scale: 4, octaves: 3 } },
    /* 12 */ { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 3, octaves: 6, roughness: 0.55, seed: 290 } },
    /* 13 */ { definitionId: 'refraction', position: pos(1, 0), parameters: { scale: 0.5, strength: 0.3 } },
    /* 14 */ { definitionId: 'wave', position: pos(2, -2), parameters: { ampX: 0.02, ampY: 0.015, freqX: 6, freqY: 8, type: 0 } },
    /* 15 */ { definitionId: 'perlin-noise', position: pos(3, 3), parameters: { scale: 10, octaves: 2, seed: 330 } },
    /* 16 */ { definitionId: 'blur', position: pos(2, 3), parameters: { radius: 4 } },
    /* 17 */ { definitionId: 'blend', position: pos(1, 2), parameters: { mode: 6, opacity: 35 } },
    /* 18 */ { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 0, saturation: 80, lightness: 5 } },
    /* 19 */ { definitionId: 'levels', position: pos(0, 1), parameters: { inBlack: 5, inWhite: 95, gamma: 1.2 } },
    /* 20 */ { definitionId: 'brightness-contrast', position: pos(0, 2), parameters: { contrast: 25 } },
    /* 21 */ { definitionId: 'sharpen', position: pos(0, 3), parameters: { amount: 30 } },
  ];

  const edges: TemplateEdge[] = [
    e(0, 'out', 1, 'source'), e(0, 'out', 2, 'source'),
    e(1, 'out', 3, 'source'), e(2, 'out', 4, 'source'),
    e(3, 'out', 5, 'a'), e(4, 'out', 5, 'b'),
    e(5, 'out', 7, 'a'), e(6, 'out', 7, 'b'),
    e(7, 'out', 8, 'source'),
    e(8, 'out', 10, 'foreground'), e(9, 'out', 10, 'background'),
    e(10, 'out', 14, 'source'),
    e(14, 'out', 11, 'source'),
    e(11, 'out', 13, 'source'), e(12, 'out', 13, 'height'),
    e(13, 'out', 17, 'foreground'),
    e(15, 'out', 16, 'source'), e(16, 'out', 17, 'background'),
    e(17, 'out', 18, 'source'),
    e(18, 'out', 19, 'source'),
    e(19, 'out', 20, 'source'),
    e(20, 'out', 21, 'source'),
    e(21, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// =============================================================================
// EXPORT
// =============================================================================

export const textureSeedBatch4: TextureSeed[] = [
  // Nature (1-10)
  {
    name: 'Forest Floor',
    description: 'Rich woodland ground with layered organic detail and green-brown tones',
    category: 'Nature',
    tags: ['nature', 'forest', 'organic', 'ground', 'green', 'brown'],
    build: buildForestFloor,
  },
  {
    name: 'Ocean Waves',
    description: 'Rolling ocean surface with layered wave distortion and deep blue hues',
    category: 'Nature',
    tags: ['nature', 'ocean', 'water', 'waves', 'blue', 'teal'],
    build: buildOceanWaves,
  },
  {
    name: 'Tree Bark',
    description: 'Vertically stretched fibrous bark texture with dark brown tones',
    category: 'Nature',
    tags: ['nature', 'tree', 'bark', 'wood', 'brown', 'organic'],
    build: buildTreeBark,
  },
  {
    name: 'River Stones',
    description: 'Smooth rounded pebbles with subtle surface detail and warm grey tones',
    category: 'Nature',
    tags: ['nature', 'stones', 'river', 'pebbles', 'grey', 'smooth'],
    build: buildRiverStones,
  },
  {
    name: 'Desert Sand',
    description: 'Wind-swept sand dunes with fine grain detail and warm golden color',
    category: 'Nature',
    tags: ['nature', 'desert', 'sand', 'dunes', 'golden', 'warm'],
    build: buildDesertSand,
  },
  {
    name: 'Ice Crystals',
    description: 'Geometric frost patterns with kaleidoscopic symmetry and cold blue glow',
    category: 'Nature',
    tags: ['nature', 'ice', 'crystal', 'frost', 'blue', 'cold'],
    build: buildIceCrystals,
  },
  {
    name: 'Moss Garden',
    description: 'Dense mossy surface with fine cellular detail and vivid green tones',
    category: 'Nature',
    tags: ['nature', 'moss', 'garden', 'green', 'organic', 'lush'],
    build: buildMossGarden,
  },
  {
    name: 'Thunderstorm',
    description: 'Turbulent storm clouds with lightning-edge glow and deep dark blue',
    category: 'Nature',
    tags: ['nature', 'storm', 'thunder', 'lightning', 'dark', 'blue'],
    build: buildThunderstorm,
  },
  {
    name: 'Autumn Leaves',
    description: 'Warm fall foliage with spectrum coloring and organic noise distortion',
    category: 'Nature',
    tags: ['nature', 'autumn', 'leaves', 'fall', 'warm', 'colorful'],
    build: buildAutumnLeaves,
  },
  {
    name: 'Snowdrift',
    description: 'Soft pristine snow surface with gentle undulation and cold white tint',
    category: 'Nature',
    tags: ['nature', 'snow', 'winter', 'white', 'cold', 'soft'],
    build: buildSnowdrift,
  },

  // Minimal (11-18)
  {
    name: 'Zen Lines',
    description: 'Clean horizontal wave lines with high contrast monochrome finish',
    category: 'Minimal',
    tags: ['minimal', 'lines', 'zen', 'monochrome', 'clean', 'simple'],
    build: buildZenLines,
  },
  {
    name: 'Dot Matrix',
    description: 'Fine cellular dots thresholded into a clean monochrome pattern',
    category: 'Minimal',
    tags: ['minimal', 'dots', 'matrix', 'monochrome', 'pattern', 'grid'],
    build: buildDotMatrix,
  },
  {
    name: 'Gradient Wash',
    description: 'Ultra-smooth blurred noise gradient with subtle warm color wash',
    category: 'Minimal',
    tags: ['minimal', 'gradient', 'smooth', 'wash', 'soft', 'subtle'],
    build: buildGradientWash,
  },
  {
    name: 'Whisper',
    description: 'Nearly imperceptible noise texture with extremely soft warm tones',
    category: 'Minimal',
    tags: ['minimal', 'subtle', 'whisper', 'soft', 'quiet', 'gentle'],
    build: buildWhisper,
  },
  {
    name: 'Monochrome Grid',
    description: 'Checker pattern softened and desaturated into a clean grid texture',
    category: 'Minimal',
    tags: ['minimal', 'grid', 'checker', 'monochrome', 'clean', 'geometric'],
    build: buildMonochromeGrid,
  },
  {
    name: 'Soft Focus',
    description: 'Heavily blurred noise with gentle levels and warm pastel tint',
    category: 'Minimal',
    tags: ['minimal', 'soft', 'blur', 'warm', 'dreamy', 'gentle'],
    build: buildSoftFocus,
  },
  {
    name: 'Clean Noise',
    description: 'Balanced Perlin noise desaturated and sharpened for a neutral texture',
    category: 'Minimal',
    tags: ['minimal', 'noise', 'clean', 'neutral', 'monochrome', 'texture'],
    build: buildCleanNoise,
  },
  {
    name: 'Paper White',
    description: 'Fine grain paper texture with bright levels and faint warm tint',
    category: 'Minimal',
    tags: ['minimal', 'paper', 'white', 'grain', 'subtle', 'bright'],
    build: buildPaperWhite,
  },

  // Creative Mix (19-25)
  {
    name: 'Retro Sunset',
    description: 'Warm gradient with polar warp, spectrum coloring, and halftone overlay',
    category: 'Cosmic',
    tags: ['retro', 'sunset', 'warm', 'gradient', 'vintage', 'colorful'],
    build: buildRetroSunset,
  },
  {
    name: 'Cyberpunk Neon',
    description: 'Glowing cell edges with spectrum color on dark background and bloom',
    category: 'Abstract',
    tags: ['cyberpunk', 'neon', 'glow', 'dark', 'edges', 'futuristic'],
    build: buildCyberpunkNeon,
  },
  {
    name: 'Watercolor Bloom',
    description: 'Soft blooming watercolor wash with warm pastels and noise distortion',
    category: 'Organic',
    tags: ['watercolor', 'bloom', 'pastel', 'soft', 'artistic', 'paint'],
    build: buildWatercolorBloom,
  },
  {
    name: 'Stained Glass',
    description: 'Cell-based panels with spectrum coloring masked by dark lead lines',
    category: 'Organic',
    tags: ['stained-glass', 'mosaic', 'colorful', 'panels', 'artistic', 'church'],
    build: buildStainedGlass,
  },
  {
    name: 'Vapor Wave',
    description: 'Polar-warped noise with pink-purple gradient, halftone, and retro vibe',
    category: 'Cosmic',
    tags: ['vaporwave', 'retro', 'pink', 'purple', 'aesthetic', 'synthwave'],
    build: buildVaporWave,
  },
  {
    name: 'Batik Fabric',
    description: 'Kaleidoscopic cells with warm earthy tones and organic wax-resist look',
    category: 'Organic',
    tags: ['batik', 'fabric', 'textile', 'earthy', 'warm', 'pattern'],
    build: buildBatikFabric,
  },
  {
    name: 'Holographic',
    description: 'UV math with trigonometric fract, spectrum refraction, and prismatic color',
    category: 'Abstract',
    tags: ['holographic', 'prismatic', 'rainbow', 'iridescent', 'futuristic', 'math'],
    build: buildHolographic,
  },
];
