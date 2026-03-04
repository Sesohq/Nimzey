/**
 * Complex texture presets — 30-40 node procedural graphs that generate
 * impressive textures from scratch. Each defines a full graph topology
 * with branching connections, multiple generators, and layered processing.
 */

import { Bug, Orbit, Cpu, Flame, Diamond } from 'lucide-react';
import type { TemplateBuildResult, TemplateNode, TemplateEdge } from '@/templates/graphTemplates';
import type { EffectPreset } from './effectPresets';

// Layout helper: col=0 is near result (x=500), col increases leftward
// row=0 is center (y=200), positive = down
const COL = 280;
const ROW = 160;
const pos = (col: number, row: number) => ({
  x: 500 - col * COL,
  y: 200 + row * ROW,
});

// Edge helper for readability
const e = (sourceIdx: number, sourcePort: string, targetIdx: number, targetPort: string) => ({
  sourceIdx, sourcePort, targetIdx, targetPort,
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. ALIEN ORGANIC
// Three noise branches distorted differently → R/G/B channels → overlay blends
// ─────────────────────────────────────────────────────────────────────────────
function buildAlienOrganic(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    // === RED BRANCH (row -2) ===
    /*  0 */ { definitionId: 'perlin-noise', position: pos(9, -2), parameters: { scale: 6, octaves: 6, roughness: 0.6, seed: 0, contrast: 15 } },
    /*  1 */ { definitionId: 'noise-distortion', position: pos(8, -2), parameters: { distortion: 40, scale: 5, octaves: 3 } },
    /*  2 */ { definitionId: 'spherize', position: pos(7, -2), parameters: { strength: 60 } },
    /*  3 */ { definitionId: 'levels', position: pos(6, -2), parameters: { inBlack: 10, inWhite: 85 } },

    // === GREEN BRANCH (row 0) ===
    /*  4 */ { definitionId: 'cells-noise', position: pos(9, 0), parameters: { scale: 8, formula: 2, octaves: 4, roughness: 0.5 } },
    /*  5 */ { definitionId: 'wave', position: pos(8, 0), parameters: { ampX: 0.04, ampY: 0.02, freqX: 6, freqY: 3, type: 0 } },
    /*  6 */ { definitionId: 'vortex', position: pos(7, 0), parameters: { strength: 1.2 } },
    /*  7 */ { definitionId: 'levels', position: pos(6, 0), parameters: { inBlack: 5, inWhite: 90, gamma: 1.5 } },

    // === BLUE BRANCH (row 2) ===
    /*  8 */ { definitionId: 'perlin-noise', position: pos(9, 2), parameters: { scale: 3, octaves: 8, roughness: 0.45, seed: 100, contrast: 10 } },
    /*  9 */ { definitionId: 'twirl', position: pos(8, 2), parameters: { strength: 2.0, radius: 0.8 } },
    /* 10 */ { definitionId: 'ripple', position: pos(7, 2), parameters: { amplitude: 0.04, frequency: 12, decay: 3 } },
    /* 11 */ { definitionId: 'invert', position: pos(6, 2), parameters: {} },

    // === ASSEMBLE RGB ===
    /* 12 */ { definitionId: 'assemble-rgb', position: pos(5, 0) },

    // === OVERLAY BRANCH (row 4) — polar-warped noise ===
    /* 13 */ { definitionId: 'perlin-noise', position: pos(8, 4), parameters: { scale: 12, octaves: 3, roughness: 0.5, seed: 200 } },
    /* 14 */ { definitionId: 'polar-coordinates', position: pos(7, 4), parameters: { mode: 0 } },
    /* 15 */ { definitionId: 'hue-saturation', position: pos(6, 4), parameters: { hue: 120, saturation: 80 } },

    // === FIRST BLEND: RGB + overlay ===
    /* 16 */ { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 9, opacity: 60 } },

    // === GLOW BRANCH (row -3) — blurred noise ===
    /* 17 */ { definitionId: 'perlin-noise', position: pos(6, -3), parameters: { scale: 20, octaves: 2, seed: 500 } },
    /* 18 */ { definitionId: 'blur', position: pos(5, -3), parameters: { radius: 8 } },

    // === SECOND BLEND: + glow ===
    /* 19 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 10, opacity: 40 } },

    // === DETAIL BRANCH (row 5) — cells detail ===
    /* 20 */ { definitionId: 'cells-noise', position: pos(6, 5), parameters: { scale: 15, formula: 0, octaves: 2 } },
    /* 21 */ { definitionId: 'desaturate', position: pos(5, 5), parameters: {} },
    /* 22 */ { definitionId: 'levels', position: pos(4, 5), parameters: { inBlack: 30, inWhite: 70 } },

    // === THIRD BLEND: + detail ===
    /* 23 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 25 } },

    // === WARP ACCENT (row -4) — warped noise ===
    /* 24 */ { definitionId: 'perlin-noise', position: pos(6, -4), parameters: { scale: 2, octaves: 10, roughness: 0.7, seed: 300 } },
    /* 25 */ { definitionId: 'noise-distortion', position: pos(5, -4), parameters: { distortion: 20, scale: 8 } },
    /* 26 */ { definitionId: 'gamma', position: pos(4, -4), parameters: { gamma: 2.0 } },
    /* 27 */ { definitionId: 'wave', position: pos(3, -4), parameters: { ampX: 0.015, ampY: 0.01, freqX: 8, freqY: 12, type: 0 } },

    // === FOURTH BLEND: + warp accent ===
    /* 28 */ { definitionId: 'blend', position: pos(1, -1), parameters: { mode: 8, opacity: 30 } },

    // === FINAL ADJUSTMENTS ===
    /* 29 */ { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: -30, saturation: 40, lightness: 5 } },
    /* 30 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 30 } },
    /* 31 */ { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 40 } },
  ];

  const edges: TemplateEdge[] = [
    // Red branch → assemble red
    e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'), e(3, 'out', 12, 'red'),
    // Green branch → assemble green
    e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'), e(7, 'out', 12, 'green'),
    // Blue branch → assemble blue
    e(8, 'out', 9, 'source'), e(9, 'out', 10, 'source'), e(10, 'out', 11, 'source'), e(11, 'out', 12, 'blue'),
    // First blend: assembled RGB + polar overlay
    e(12, 'out', 16, 'foreground'),
    e(13, 'out', 14, 'source'), e(14, 'out', 15, 'source'), e(15, 'out', 16, 'background'),
    // Second blend: + glow
    e(16, 'out', 19, 'foreground'),
    e(17, 'out', 18, 'source'), e(18, 'out', 19, 'background'),
    // Third blend: + detail
    e(19, 'out', 23, 'foreground'),
    e(20, 'out', 21, 'source'), e(21, 'out', 22, 'source'), e(22, 'out', 23, 'background'),
    // Fourth blend: + warp accent
    e(23, 'out', 28, 'foreground'),
    e(24, 'out', 25, 'source'), e(25, 'out', 26, 'source'), e(26, 'out', 27, 'source'), e(27, 'out', 28, 'background'),
    // Final adjustments
    e(28, 'out', 29, 'source'), e(29, 'out', 30, 'source'), e(30, 'out', 31, 'source'),
    e(31, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COSMIC MARBLE
// UV math → noise modulation → polar warp → kaleidoscope → spectrum color
// ─────────────────────────────────────────────────────────────────────────────
function buildCosmicMarble(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    // === UV + TRIG MATH BRANCH (row -1) ===
    /*  0 */ { definitionId: 'uv-coordinates', position: pos(10, -1), parameters: { tilingX: 2, tilingY: 2 } },
    /*  1 */ { definitionId: 'math-split-vec2', position: pos(9, -2), parameters: { channel: 0 } },  // X
    /*  2 */ { definitionId: 'math-split-vec2', position: pos(9, 0), parameters: { channel: 1 } },   // Y
    /*  3 */ { definitionId: 'math-sine', position: pos(8, -2), parameters: { units: 2 } },
    /*  4 */ { definitionId: 'math-cosine', position: pos(8, 0), parameters: { units: 2 } },

    // === NOISE MODULATORS ===
    /*  5 */ { definitionId: 'perlin-noise', position: pos(9, -3), parameters: { scale: 4, octaves: 5, roughness: 0.55, seed: 0 } },
    /*  6 */ { definitionId: 'perlin-noise', position: pos(9, 1), parameters: { scale: 6, octaves: 4, roughness: 0.5, seed: 50 } },

    // === MULTIPLY trig × noise ===
    /*  7 */ { definitionId: 'math-multiply', position: pos(7, -2) },  // sine * perlin
    /*  8 */ { definitionId: 'math-multiply', position: pos(7, 0) },   // cosine * perlin

    // === COMBINE + FRACT ===
    /*  9 */ { definitionId: 'math-add', position: pos(6, -1) },
    /* 10 */ { definitionId: 'math-fract', position: pos(5, -1) },

    // === BASE TEXTURE BRANCH (row 2) ===
    /* 11 */ { definitionId: 'cells-noise', position: pos(9, 3), parameters: { scale: 6, formula: 2, octaves: 5 } },
    /* 12 */ { definitionId: 'perlin-noise', position: pos(9, 4), parameters: { scale: 3, octaves: 6, roughness: 0.6, seed: 150 } },
    /* 13 */ { definitionId: 'math-add', position: pos(8, 3) },
    /* 14 */ { definitionId: 'levels', position: pos(7, 3), parameters: { inBlack: 10, inWhite: 90 } },

    // === DISTORT BASE WITH UV MATH ===
    /* 15 */ { definitionId: 'noise-distortion', position: pos(6, 3), parameters: { distortion: 30, scale: 4, seed: 200 } },

    // === POLAR + KALEIDOSCOPE ===
    /* 16 */ { definitionId: 'polar-coordinates', position: pos(5, 2), parameters: { mode: 0 } },
    /* 17 */ { definitionId: 'kaleidoscope', position: pos(4, 2), parameters: { segments: 8, rotation: 15 } },
    /* 18 */ { definitionId: 'vortex', position: pos(3, 2), parameters: { strength: 0.8 } },

    // === COLOR: spectrum blend ===
    /* 19 */ { definitionId: 'spectrum', position: pos(5, 5), parameters: { angle: 45, repeat: 2 } },
    /* 20 */ { definitionId: 'gradient-5-color', position: pos(5, 6), parameters: { color1: '#0a0020', color2: '#1a0060', color3: '#4020a0', color4: '#8040ff', color5: '#ff80ff', angle: 90 } },
    /* 21 */ { definitionId: 'blend', position: pos(4, 5), parameters: { mode: 9, opacity: 60 } },  // Overlay spectrum+gradient

    // === MAIN BLEND: texture + color ===
    /* 22 */ { definitionId: 'blend', position: pos(2, 2), parameters: { mode: 6, opacity: 70 } },  // Screen

    // === GLOW LAYER (row -2) ===
    /* 23 */ { definitionId: 'perlin-noise', position: pos(4, -2), parameters: { scale: 15, octaves: 2, seed: 300 } },
    /* 24 */ { definitionId: 'blur', position: pos(3, -2), parameters: { radius: 6 } },
    /* 25 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 35 } },  // Soft Light

    // === WAVE + SPHERIZE ===
    /* 26 */ { definitionId: 'spherize', position: pos(1, 1), parameters: { strength: 30 } },
    /* 27 */ { definitionId: 'wave', position: pos(1, 0), parameters: { ampX: 0.02, ampY: 0.015, freqX: 3, freqY: 5, type: 0 } },

    // === FINAL ADJUSTMENTS ===
    /* 28 */ { definitionId: 'levels', position: pos(0, 1), parameters: { inBlack: 5, inWhite: 95, gamma: 1.1 } },
    /* 29 */ { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 0, saturation: 60, lightness: 5 } },
    /* 30 */ { definitionId: 'brightness-contrast', position: pos(0, -1), parameters: { contrast: 25 } },
    /* 31 */ { definitionId: 'sharpen', position: pos(0, 2), parameters: { amount: 35 } },
  ];

  const edges: TemplateEdge[] = [
    // UV → split → trig
    e(0, 'out', 1, 'source'), e(0, 'out', 2, 'source'),
    e(1, 'out', 3, 'source'), e(2, 'out', 4, 'source'),
    // Trig × noise
    e(3, 'out', 7, 'a'), e(5, 'out', 7, 'b'),
    e(4, 'out', 8, 'a'), e(6, 'out', 8, 'b'),
    // Combine
    e(7, 'out', 9, 'a'), e(8, 'out', 9, 'b'),
    e(9, 'out', 10, 'source'),
    // Base texture
    e(11, 'out', 13, 'a'), e(12, 'out', 13, 'b'),
    e(13, 'out', 14, 'source'), e(14, 'out', 15, 'source'),
    // Polar → kaleidoscope → vortex
    e(15, 'out', 16, 'source'), e(16, 'out', 17, 'source'), e(17, 'out', 18, 'source'),
    // Spectrum + gradient overlay
    e(19, 'out', 21, 'foreground'), e(20, 'out', 21, 'background'),
    // Main blend: distorted texture + color
    e(18, 'out', 22, 'foreground'), e(21, 'out', 22, 'background'),
    // Glow
    e(22, 'out', 25, 'foreground'),
    e(23, 'out', 24, 'source'), e(24, 'out', 25, 'background'),
    // Final chain
    e(25, 'out', 26, 'source'), e(26, 'out', 27, 'source'),
    e(27, 'out', 28, 'source'), e(28, 'out', 29, 'source'), e(29, 'out', 30, 'source'), e(30, 'out', 31, 'source'),
    e(31, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DIGITAL CIRCUIT
// Block/grid patterns → edge detection → glow → green channel assembly
// ─────────────────────────────────────────────────────────────────────────────
function buildDigitalCircuit(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    // === TRACE PATTERN (row -2) — blocks → distort → edge detect ===
    /*  0 */ { definitionId: 'blocks-noise', position: pos(10, -2), parameters: { scale: 8, octaves: 4, roughness: 0.4, seed: 42 } },
    /*  1 */ { definitionId: 'noise-distortion', position: pos(9, -2), parameters: { distortion: 8, scale: 6 } },
    /*  2 */ { definitionId: 'edge-detector', position: pos(8, -2), parameters: { formula: 0, amplitude: 2.0, radius: 1 } },
    /*  3 */ { definitionId: 'levels', position: pos(7, -2), parameters: { inBlack: 20, inWhite: 60 } },

    // === GRID LINES (row 0) — tiles → edge detect ===
    /*  4 */ { definitionId: 'tiles', position: pos(10, 0), parameters: { repeatH: 16, repeatV: 16, mortarWidth: 2, bevelWidth: 0, tileColor: '#000000', mortarColor: '#ffffff' } },
    /*  5 */ { definitionId: 'edge-detector', position: pos(9, 0), parameters: { formula: 2, amplitude: 1.5, radius: 0.5 } },
    /*  6 */ { definitionId: 'levels', position: pos(8, 0), parameters: { inBlack: 40, inWhite: 80 } },

    // === PADS (row 2) — checker → threshold → pinch ===
    /*  7 */ { definitionId: 'checker', position: pos(10, 2), parameters: { repeatH: 16, repeatV: 16, color1: '#000000', color2: '#ffffff' } },
    /*  8 */ { definitionId: 'threshold', position: pos(9, 2), parameters: { threshold: 50, smooth: 5 } },
    /*  9 */ { definitionId: 'spherize', position: pos(8, 2), parameters: { strength: -20, mode: 1 } },

    // === COMBINE: traces + grid + pads ===
    /* 10 */ { definitionId: 'blend', position: pos(6, -1), parameters: { mode: 6, opacity: 80 } },  // Screen: traces+grid
    /* 11 */ { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 8, opacity: 50 } },   // Linear Dodge: +pads

    // === GLOW: blur → screen ===
    /* 12 */ { definitionId: 'blur', position: pos(4, -2), parameters: { radius: 4 } },
    /* 13 */ { definitionId: 'levels', position: pos(3, -2), parameters: { inBlack: 0, inWhite: 50, gamma: 3.0 } },
    /* 14 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 6, opacity: 70 } },   // Screen: inner glow

    // === WIDE GLOW ===
    /* 15 */ { definitionId: 'blur', position: pos(3, -3), parameters: { radius: 8 } },
    /* 16 */ { definitionId: 'levels', position: pos(2, -3), parameters: { inBlack: 0, inWhite: 30 } },
    /* 17 */ { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 6, opacity: 40 } },   // Screen: wide glow

    // === GREEN CIRCUIT COLOR via channel assembly ===
    /* 18 */ { definitionId: 'desaturate', position: pos(1, 0) },
    /* 19 */ { definitionId: 'levels', position: pos(1, -2), parameters: { inBlack: 0, inWhite: 100, gamma: 0.5 } },  // dim for red
    /* 20 */ { definitionId: 'levels', position: pos(1, -1), parameters: { inBlack: 0, inWhite: 100, gamma: 2.5 } },  // bright for green
    /* 21 */ { definitionId: 'perlin-noise', position: pos(2, 3), parameters: { scale: 30, octaves: 1, roughness: 0, contrast: -80, seed: 0 } },
    /* 22 */ { definitionId: 'levels', position: pos(1, 3), parameters: { inBlack: 0, inWhite: 20 } },  // very dark blue
    /* 23 */ { definitionId: 'assemble-rgb', position: pos(0, 0) },

    // === TEXTURE OVERLAY (row 4) ===
    /* 24 */ { definitionId: 'perlin-noise', position: pos(4, 4), parameters: { scale: 4, octaves: 4, seed: 100 } },
    /* 25 */ { definitionId: 'blend', position: pos(3, 3), parameters: { mode: 2, opacity: 15 } },  // Multiply: texture

    // === MICRO TEXTURE (row 5) ===
    /* 26 */ { definitionId: 'cells-noise', position: pos(4, 5), parameters: { scale: 20, formula: 0, octaves: 1 } },
    /* 27 */ { definitionId: 'blend', position: pos(2, 4), parameters: { mode: 2, opacity: 10 } },  // Multiply: micro

    // === SUBTLE VARIATION ===
    /* 28 */ { definitionId: 'perlin-noise', position: pos(3, 5), parameters: { scale: 6, octaves: 3, seed: 200 } },
    /* 29 */ { definitionId: 'blur', position: pos(2, 5), parameters: { radius: 2 } },

    // === FINAL ADJUSTMENTS ===
    /* 30 */ { definitionId: 'hue-saturation', position: pos(0, 2), parameters: { hue: 60, saturation: 40 } },
    /* 31 */ { definitionId: 'brightness-contrast', position: pos(0, 3), parameters: { brightness: -10, contrast: 20 } },
    /* 32 */ { definitionId: 'sharpen', position: pos(0, 4), parameters: { amount: 50 } },
  ];

  const edges: TemplateEdge[] = [
    // Trace pattern
    e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'),
    // Grid lines
    e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
    // Pads
    e(7, 'out', 8, 'source'), e(8, 'out', 9, 'source'),
    // Combine traces+grid+pads
    e(3, 'out', 10, 'foreground'), e(6, 'out', 10, 'background'),
    e(10, 'out', 11, 'foreground'), e(9, 'out', 11, 'background'),
    // Inner glow
    e(11, 'out', 12, 'source'), e(12, 'out', 13, 'source'),
    e(11, 'out', 14, 'foreground'), e(13, 'out', 14, 'background'),
    // Wide glow
    e(14, 'out', 15, 'source'), e(15, 'out', 16, 'source'),
    e(14, 'out', 17, 'foreground'), e(16, 'out', 17, 'background'),
    // Channel assembly (green circuit look)
    e(17, 'out', 18, 'source'),
    e(18, 'out', 19, 'source'),  // dimmed → red
    e(18, 'out', 20, 'source'),  // boosted → green
    e(21, 'out', 22, 'source'),  // dark noise → blue
    e(19, 'out', 23, 'red'), e(20, 'out', 23, 'green'), e(22, 'out', 23, 'blue'),
    // Texture overlays (applied to the combined circuit before channel split)
    e(11, 'out', 25, 'foreground'), e(24, 'out', 25, 'background'),
    e(25, 'out', 27, 'foreground'), e(26, 'out', 27, 'background'),
    // Final: assemble → adjustments → result
    e(23, 'out', 30, 'source'), e(30, 'out', 31, 'source'), e(31, 'out', 32, 'source'),
    e(32, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LAVA FLOW
// Multi-scale noise → self-distortion → gradient color mapping → crust masking
// ─────────────────────────────────────────────────────────────────────────────
function buildLavaFlow(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    // === BASE TURBULENCE (row -1) — large scale perlin → warp → wave ===
    /*  0 */ { definitionId: 'perlin-noise', position: pos(10, -1), parameters: { scale: 3, octaves: 8, roughness: 0.65, contrast: 20, seed: 0 } },
    /*  1 */ { definitionId: 'noise-distortion', position: pos(9, -1), parameters: { distortion: 60, scale: 3, octaves: 4, seed: 100 } },
    /*  2 */ { definitionId: 'wave', position: pos(8, -1), parameters: { ampX: 0.05, ampY: 0.03, freqX: 2, freqY: 3, type: 0 } },

    // === DETAIL TURBULENCE (row 1) ===
    /*  3 */ { definitionId: 'perlin-noise', position: pos(10, 1), parameters: { scale: 8, octaves: 4, roughness: 0.5, seed: 200 } },
    /*  4 */ { definitionId: 'noise-distortion', position: pos(9, 1), parameters: { distortion: 30, scale: 5, seed: 300 } },

    // === COMBINE base + detail ===
    /*  5 */ { definitionId: 'blend', position: pos(7, 0), parameters: { mode: 9, opacity: 70 } },  // Overlay
    /*  6 */ { definitionId: 'levels', position: pos(6, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 1.1 } },

    // === LAVA COLOR GRADIENT (row 3) ===
    /*  7 */ { definitionId: 'gradient-5-color', position: pos(7, 3), parameters: { color1: '#0a0000', color2: '#8b1a00', color3: '#d44800', color4: '#ff8c00', color5: '#ffee88', angle: 0 } },

    // === ELEVATION GRADIENT: maps grayscale → lava colors ===
    /*  8 */ { definitionId: 'gradient-elevation', position: pos(5, 0), parameters: { flip: false, repeat: 1 } },

    // === CRUST BRANCH (row 4) — cells → threshold → blur → mask ===
    /*  9 */ { definitionId: 'cells-noise', position: pos(8, 4), parameters: { scale: 5, formula: 0, octaves: 3, seed: 400 } },
    /* 10 */ { definitionId: 'threshold', position: pos(7, 4), parameters: { threshold: 65, smooth: 15 } },
    /* 11 */ { definitionId: 'blur', position: pos(6, 4), parameters: { radius: 3 } },
    /* 12 */ { definitionId: 'invert', position: pos(5, 4) },

    // === DARK CRUST COLOR ===
    /* 13 */ { definitionId: 'gradient-3-color', position: pos(6, 5), parameters: { color1: '#000000', color2: '#1a0500', color3: '#2a0a00', angle: 90 } },

    // === MASK: lava under crust ===
    /* 14 */ { definitionId: 'mask', position: pos(4, 1), parameters: { channel: 0, invert: false } },

    // === DETAIL OVERLAY (row -2) — noise texture ===
    /* 15 */ { definitionId: 'perlin-noise', position: pos(6, -2), parameters: { scale: 6, octaves: 5, roughness: 0.55, seed: 500 } },
    /* 16 */ { definitionId: 'noise-distortion', position: pos(5, -2), parameters: { distortion: 25, scale: 4 } },
    /* 17 */ { definitionId: 'desaturate', position: pos(4, -2) },
    /* 18 */ { definitionId: 'levels', position: pos(3, -2), parameters: { inBlack: 30, inWhite: 70 } },

    // === BLEND: + detail ===
    /* 19 */ { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 10, opacity: 30 } },  // Soft Light

    // === HOT GLOW (row -3) — blurred noise → dodge ===
    /* 20 */ { definitionId: 'perlin-noise', position: pos(4, -3), parameters: { scale: 15, octaves: 2, seed: 600 } },
    /* 21 */ { definitionId: 'blur', position: pos(3, -3), parameters: { radius: 6 } },
    /* 22 */ { definitionId: 'blend', position: pos(2, -1), parameters: { mode: 7, opacity: 20 } },  // Color Dodge

    // === DEEP FLOW (row 5) — slow warped perlin ===
    /* 23 */ { definitionId: 'perlin-noise', position: pos(4, 5), parameters: { scale: 1.5, octaves: 10, roughness: 0.7, seed: 700 } },
    /* 24 */ { definitionId: 'wave', position: pos(3, 5), parameters: { ampX: 0.03, ampY: 0.02, freqX: 4, freqY: 6, type: 0 } },
    /* 25 */ { definitionId: 'blend', position: pos(2, 2), parameters: { mode: 9, opacity: 20 } },  // Overlay

    // === MICRO CRUST (row 6) ===
    /* 26 */ { definitionId: 'cells-noise', position: pos(3, 6), parameters: { scale: 12, formula: 5, octaves: 2, seed: 800 } },
    /* 27 */ { definitionId: 'levels', position: pos(2, 6), parameters: { inBlack: 20, inWhite: 60 } },
    /* 28 */ { definitionId: 'blend', position: pos(1, 2), parameters: { mode: 2, opacity: 15 } },  // Multiply

    // === FINAL ADJUSTMENTS ===
    /* 29 */ { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -10, saturation: 30 } },
    /* 30 */ { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { contrast: 15, brightness: 5 } },
    /* 31 */ { definitionId: 'gamma', position: pos(0, 1), parameters: { gamma: 1.5 } },
    /* 32 */ { definitionId: 'sharpen', position: pos(0, 2), parameters: { amount: 40 } },
  ];

  const edges: TemplateEdge[] = [
    // Base turbulence
    e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
    // Detail turbulence
    e(3, 'out', 4, 'source'),
    // Combine
    e(2, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
    e(5, 'out', 6, 'source'),
    // Elevation gradient coloring
    e(6, 'out', 8, 'elevation'), e(7, 'out', 8, 'gradient'),
    // Crust mask
    e(9, 'out', 10, 'source'), e(10, 'out', 11, 'source'), e(11, 'out', 12, 'source'),
    e(8, 'out', 14, 'source'), e(12, 'out', 14, 'mask'), e(13, 'out', 14, 'background'),
    // Detail overlay
    e(15, 'out', 16, 'source'), e(16, 'out', 17, 'source'), e(17, 'out', 18, 'source'),
    e(14, 'out', 19, 'foreground'), e(18, 'out', 19, 'background'),
    // Hot glow
    e(19, 'out', 22, 'foreground'),
    e(20, 'out', 21, 'source'), e(21, 'out', 22, 'background'),
    // Deep flow
    e(22, 'out', 25, 'foreground'),
    e(23, 'out', 24, 'source'), e(24, 'out', 25, 'background'),
    // Micro crust
    e(25, 'out', 28, 'foreground'),
    e(26, 'out', 27, 'source'), e(27, 'out', 28, 'background'),
    // Final adjustments
    e(28, 'out', 29, 'source'), e(29, 'out', 30, 'source'), e(30, 'out', 31, 'source'), e(31, 'out', 32, 'source'),
    e(32, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CRYSTAL MATRIX
// Cells → kaleidoscope → offset copies for RGB iridescence → refraction → glow
// ─────────────────────────────────────────────────────────────────────────────
function buildCrystalMatrix(): TemplateBuildResult {
  const nodes: TemplateNode[] = [
    // === BASE CRYSTAL (row 0) — cells → kaleidoscope → spherize → warp ===
    /*  0 */ { definitionId: 'cells-noise', position: pos(10, 0), parameters: { scale: 5, formula: 2, octaves: 5, roughness: 0.4, seed: 0 } },
    /*  1 */ { definitionId: 'kaleidoscope', position: pos(9, 0), parameters: { segments: 12, rotation: 15 } },
    /*  2 */ { definitionId: 'spherize', position: pos(8, 0), parameters: { strength: 40 } },
    /*  3 */ { definitionId: 'noise-distortion', position: pos(7, 0), parameters: { distortion: 15, scale: 6, seed: 50 } },

    // === RED CHANNEL (row -2) — levels (high contrast) ===
    /*  4 */ { definitionId: 'levels', position: pos(6, -2), parameters: { inBlack: 10, inWhite: 70, gamma: 1.5 } },

    // === GREEN CHANNEL (row 0) — offset + different levels ===
    /*  5 */ { definitionId: 'offset', position: pos(6, 0), parameters: { offsetX: 0.15, offsetY: 0.1 } },
    /*  6 */ { definitionId: 'levels', position: pos(5, 0), parameters: { inBlack: 5, inWhite: 75, gamma: 0.7 } },

    // === BLUE CHANNEL (row 2) — offset + invert + levels ===
    /*  7 */ { definitionId: 'offset', position: pos(6, 2), parameters: { offsetX: 0.3, offsetY: 0.2 } },
    /*  8 */ { definitionId: 'invert', position: pos(5, 2) },
    /*  9 */ { definitionId: 'levels', position: pos(4, 2), parameters: { inBlack: 15, inWhite: 80 } },

    // === ASSEMBLE RGB ===
    /* 10 */ { definitionId: 'assemble-rgb', position: pos(4, 0) },

    // === REFRACTION with noise height (row -3) ===
    /* 11 */ { definitionId: 'perlin-noise', position: pos(5, -3), parameters: { scale: 2, octaves: 10, roughness: 0.7, seed: 100 } },
    /* 12 */ { definitionId: 'refraction', position: pos(3, -1), parameters: { refraction: 40 } },

    // === VORTEX + RIPPLE ===
    /* 13 */ { definitionId: 'vortex', position: pos(2, -1), parameters: { strength: 0.3 } },
    /* 14 */ { definitionId: 'ripple', position: pos(2, 0), parameters: { amplitude: 0.015, frequency: 15, decay: 5 } },

    // === SPECTRUM COLOR BLEND (row 4) ===
    /* 15 */ { definitionId: 'spectrum', position: pos(3, 4), parameters: { angle: 30, repeat: 1 } },
    /* 16 */ { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 18, opacity: 40 } },  // Color blend

    // === EDGE GLOW ===
    /* 17 */ { definitionId: 'edge-detector', position: pos(2, 3), parameters: { formula: 0, amplitude: 1.5, radius: 1 } },
    /* 18 */ { definitionId: 'blur', position: pos(1, 3), parameters: { radius: 3 } },
    /* 19 */ { definitionId: 'levels', position: pos(1, 4), parameters: { inBlack: 0, inWhite: 40 } },
    /* 20 */ { definitionId: 'blend', position: pos(0, 1), parameters: { mode: 6, opacity: 60 } },   // Screen: edge glow

    // === SOFT GLOW (row -3) ===
    /* 21 */ { definitionId: 'perlin-noise', position: pos(2, -3), parameters: { scale: 20, octaves: 2, seed: 200 } },
    /* 22 */ { definitionId: 'blur', position: pos(1, -3), parameters: { radius: 5 } },
    /* 23 */ { definitionId: 'blend', position: pos(0, -1), parameters: { mode: 10, opacity: 25 } },  // Soft Light

    // === SPARKLE LAYER (row 5) ===
    /* 24 */ { definitionId: 'cells-noise', position: pos(2, 5), parameters: { scale: 15, formula: 6, octaves: 1, seed: 300 } },
    /* 25 */ { definitionId: 'levels', position: pos(1, 5), parameters: { inBlack: 30, inWhite: 50 } },
    /* 26 */ { definitionId: 'blend', position: pos(0, 2), parameters: { mode: 8, opacity: 30 } },   // Linear Dodge: sparkle

    // === WAVE TEXTURE (row -4) ===
    /* 27 */ { definitionId: 'perlin-noise', position: pos(2, -4), parameters: { scale: 4, octaves: 5, seed: 400 } },
    /* 28 */ { definitionId: 'wave', position: pos(1, -4), parameters: { ampX: 0.01, ampY: 0.015, freqX: 6, freqY: 4, type: 0 } },
    /* 29 */ { definitionId: 'blend', position: pos(0, -2), parameters: { mode: 9, opacity: 15 } },   // Overlay: subtle wave

    // === SECONDARY KALEIDOSCOPE ===
    /* 30 */ { definitionId: 'kaleidoscope', position: pos(0, 3), parameters: { segments: 6, rotation: 30 } },

    // === FINAL ADJUSTMENTS ===
    /* 31 */ { definitionId: 'levels', position: pos(-1, 0), parameters: { inBlack: 5, inWhite: 95 } },
    /* 32 */ { definitionId: 'hue-saturation', position: pos(-1, 1), parameters: { hue: 0, saturation: 70, lightness: 5 } },
    /* 33 */ { definitionId: 'brightness-contrast', position: pos(-1, 2), parameters: { contrast: 25 } },
    /* 34 */ { definitionId: 'sharpen', position: pos(-1, 3), parameters: { amount: 45 } },
  ];

  const edges: TemplateEdge[] = [
    // Base crystal
    e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'),
    // Channel splits
    e(3, 'out', 4, 'source'),                                     // red
    e(3, 'out', 5, 'source'), e(5, 'out', 6, 'source'),           // green
    e(3, 'out', 7, 'source'), e(7, 'out', 8, 'source'), e(8, 'out', 9, 'source'),  // blue
    // Assemble
    e(4, 'out', 10, 'red'), e(6, 'out', 10, 'green'), e(9, 'out', 10, 'blue'),
    // Refraction
    e(10, 'out', 12, 'source'), e(11, 'out', 12, 'height'),
    // Vortex + ripple
    e(12, 'out', 13, 'source'), e(13, 'out', 14, 'source'),
    // Spectrum color blend
    e(14, 'out', 16, 'foreground'), e(15, 'out', 16, 'background'),
    // Edge glow
    e(14, 'out', 17, 'source'), e(17, 'out', 18, 'source'), e(18, 'out', 19, 'source'),
    e(16, 'out', 20, 'foreground'), e(19, 'out', 20, 'background'),
    // Soft glow
    e(20, 'out', 23, 'foreground'),
    e(21, 'out', 22, 'source'), e(22, 'out', 23, 'background'),
    // Sparkle
    e(23, 'out', 26, 'foreground'),
    e(24, 'out', 25, 'source'), e(25, 'out', 26, 'background'),
    // Wave texture
    e(26, 'out', 29, 'foreground'),
    e(27, 'out', 28, 'source'), e(28, 'out', 29, 'background'),
    // Secondary kaleidoscope + final adjustments
    e(29, 'out', 30, 'source'), e(30, 'out', 31, 'source'),
    e(31, 'out', 32, 'source'), e(32, 'out', 33, 'source'), e(33, 'out', 34, 'source'),
    e(34, 'out', -1, 'source'),
  ];

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export const complexPresets: EffectPreset[] = [
  {
    id: 'alien-organic',
    name: 'Alien Organic',
    description: 'Otherworldly pulsating surface with iridescent channels',
    icon: Bug,
    build: buildAlienOrganic,
  },
  {
    id: 'cosmic-marble',
    name: 'Cosmic Marble',
    description: 'Swirling cosmic marble with trig math and kaleidoscope',
    icon: Orbit,
    build: buildCosmicMarble,
  },
  {
    id: 'digital-circuit',
    name: 'Digital Circuit',
    description: 'Glowing circuit board traces with green channel assembly',
    icon: Cpu,
    build: buildDigitalCircuit,
  },
  {
    id: 'lava-flow',
    name: 'Lava Flow',
    description: 'Turbulent lava with cooling crust and hot gradient',
    icon: Flame,
    build: buildLavaFlow,
  },
  {
    id: 'crystal-matrix',
    name: 'Crystal Matrix',
    description: 'Faceted crystal gem with iridescent refractions',
    icon: Diamond,
    build: buildCrystalMatrix,
  },
];
