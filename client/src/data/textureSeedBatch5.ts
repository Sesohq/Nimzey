/**
 * Texture Seed Batch 5 — 50 Complex Noise Textures
 * Diverse procedural noise patterns for the community library.
 * 45 grayscale + 5 colored (textures #46-50).
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
const graph = (nodes: TemplateNode[], edges: TemplateEdge[]): TemplateBuildResult => ({ nodes, edges });

export const textureSeedBatch5: TextureSeed[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // 1. Shattered Glass
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Shattered Glass',
    description: 'Cells noise with edge detection and sharp contrast for cracked glass effect',
    category: 'Noise',
    tags: ['noise', 'glass', 'shattered', 'cracked', 'procedural', 'sharp'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 8, formula: 1, octaves: 2 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 20, formula: 2, octaves: 1 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 5, opacity: 60 } },
        { definitionId: 'edge-detector', position: pos(3, 0) },
        { definitionId: 'invert', position: pos(2, 0) },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 20, inWhite: 60, gamma: 0.7 } },
        { definitionId: 'sharpen', position: pos(1, 1), parameters: { amount: 50 } },
        { definitionId: 'blend', position: pos(0, 0), parameters: { mode: 10, opacity: 40 } },
        { definitionId: 'brightness-contrast', position: pos(0, 1), parameters: { brightness: 10, contrast: 30 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'), e(3, 'out', 4, 'source'),
        e(4, 'out', 5, 'source'), e(4, 'out', 6, 'source'),
        e(5, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
        e(7, 'out', 8, 'source'), e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Neural Network
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Neural Network',
    description: 'Cells + perlin sine modulation with fract tiling for neural pathway look',
    category: 'Noise',
    tags: ['noise', 'neural', 'network', 'organic', 'procedural', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 6, formula: 3, octaves: 3 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 12, octaves: 5, roughness: 0.7, seed: 101 } },
        { definitionId: 'math-sine', position: pos(4, 1), parameters: { units: 6 } },
        { definitionId: 'math-multiply', position: pos(3, 0) },
        { definitionId: 'math-fract', position: pos(2, 0) },
        { definitionId: 'noise-distortion', position: pos(2, 1), parameters: { distortion: 15, scale: 8, octaves: 2 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 80, gamma: 1.1 } },
        { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 40 } },
        { definitionId: 'brightness-contrast', position: pos(0, 1), parameters: { brightness: -5, contrast: 25 } },
      ];
      const edges = [
        e(1, 'out', 2, 'source'),
        e(0, 'out', 3, 'a'), e(2, 'out', 3, 'b'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'),
        e(7, 'out', 8, 'source'), e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Corroded Signal
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Corroded Signal',
    description: 'Perlin with pixelate and halftone for corrupted digital signal effect',
    category: 'Noise',
    tags: ['noise', 'digital', 'glitch', 'corroded', 'signal', 'halftone'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 6, roughness: 0.65, seed: 200 } },
        { definitionId: 'pixelate', position: pos(4, 0), parameters: { size: 8 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 15, octaves: 2, roughness: 0.3, seed: 201 } },
        { definitionId: 'halftone', position: pos(4, 1), parameters: { dotSize: 4, angle: 45 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 5, opacity: 70 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 20, scale: 10, octaves: 2 } },
        { definitionId: 'threshold', position: pos(2, 1), parameters: { threshold: 50 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 4, opacity: 50 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 90, gamma: 0.9 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(4, 'out', 6, 'source'),
        e(5, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
        e(7, 'out', 8, 'source'), e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Turbulent Flow
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Turbulent Flow',
    description: 'Multi-octave perlin with vortex distortion and wave modulation',
    category: 'Noise',
    tags: ['noise', 'turbulent', 'flow', 'fluid', 'vortex', 'dynamic'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 7, roughness: 0.6, seed: 300 } },
        { definitionId: 'vortex', position: pos(4, 0), parameters: { angle: 180 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 4, roughness: 0.5, seed: 301 } },
        { definitionId: 'wave', position: pos(4, 1), parameters: { ampX: 0.04, ampY: 0.06, freqX: 5, freqY: 3, type: 0 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 9, opacity: 65 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 30, scale: 5, octaves: 3 } },
        { definitionId: 'blur', position: pos(2, 1), parameters: { radius: 2 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 85, gamma: 1.2 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -10, contrast: 20 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', 8, 'source'),
        e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Fractal Dust
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Fractal Dust',
    description: 'Perlin power curves with fract tiling for dusty fractal particles',
    category: 'Noise',
    tags: ['noise', 'fractal', 'dust', 'particles', 'fine', 'procedural'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 20, octaves: 6, roughness: 0.8, seed: 400 } },
        { definitionId: 'math-power', position: pos(4, 0), parameters: { power: 3 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 40, octaves: 3, roughness: 0.5, seed: 401 } },
        { definitionId: 'math-fract', position: pos(4, 1) },
        { definitionId: 'math-multiply', position: pos(3, 0) },
        { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 6, octaves: 5, roughness: 0.6, seed: 402 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 1, opacity: 40 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 30, inWhite: 70, gamma: 0.6 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 15, contrast: 35 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'a'), e(3, 'out', 4, 'b'),
        e(4, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', 8, 'source'),
        e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Woven Static
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Woven Static',
    description: 'Blocks noise with kaleidoscope and wave for woven fabric pattern',
    category: 'Noise',
    tags: ['noise', 'woven', 'static', 'fabric', 'pattern', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'blocks-noise', position: pos(5, 0), parameters: { scale: 10, seed: 500 } },
        { definitionId: 'kaleidoscope', position: pos(4, 0), parameters: { segments: 8, angle: 22 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 30, octaves: 2, roughness: 0.3, seed: 501 } },
        { definitionId: 'wave', position: pos(4, 1), parameters: { ampX: 0.02, ampY: 0.02, freqX: 12, freqY: 12, type: 1 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 55 } },
        { definitionId: 'sharpen', position: pos(2, 0), parameters: { amount: 60 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 90, gamma: 1.0 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 0, contrast: 15 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Digital Erosion
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Digital Erosion',
    description: 'Cells with threshold and blur overlay for eroded terrain look',
    category: 'Noise',
    tags: ['noise', 'erosion', 'terrain', 'digital', 'layered', 'procedural'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 5, octaves: 8, roughness: 0.7, seed: 600, contrast: 15 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 10, formula: 0, octaves: 4 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 6, opacity: 50 } },
        { definitionId: 'threshold', position: pos(3, 0), parameters: { threshold: 45 } },
        { definitionId: 'blur', position: pos(3, 1), parameters: { radius: 5 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 80 } },
        { definitionId: 'noise-distortion', position: pos(1, 0), parameters: { distortion: 12, scale: 7, octaves: 2 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 85, gamma: 0.8 } },
        { definitionId: 'brightness-contrast', position: pos(0, 1), parameters: { brightness: -5, contrast: 20 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'), e(2, 'out', 4, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'),
        e(7, 'out', 8, 'source'), e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 8. Quantum Mesh
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Quantum Mesh',
    description: 'Cells with sine modulation and polar coordinates for mesh-like structure',
    category: 'Noise',
    tags: ['noise', 'quantum', 'mesh', 'grid', 'abstract', 'sci-fi'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 12, formula: 1, octaves: 2 } },
        { definitionId: 'math-sine', position: pos(4, 0), parameters: { units: 10 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 6, octaves: 4, roughness: 0.5, seed: 700 } },
        { definitionId: 'polar-coordinates', position: pos(4, 1), parameters: { direction: 0 } },
        { definitionId: 'math-add', position: pos(3, 0) },
        { definitionId: 'math-fract', position: pos(2, 0) },
        { definitionId: 'edge-detector', position: pos(2, 1) },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 60 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 1.3 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'a'), e(3, 'out', 4, 'b'),
        e(4, 'out', 5, 'source'), e(4, 'out', 6, 'source'),
        e(5, 'out', 7, 'foreground'), e(6, 'out', 7, 'background'),
        e(7, 'out', 8, 'source'), e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 9. Frozen Turbulence
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Frozen Turbulence',
    description: 'High-octave perlin with spherize and high-pass filter for icy turbulence',
    category: 'Noise',
    tags: ['noise', 'frozen', 'ice', 'turbulence', 'cold', 'procedural'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 8, roughness: 0.75, seed: 800, contrast: 20 } },
        { definitionId: 'spherize', position: pos(4, 0), parameters: { amount: 40 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 16, octaves: 3, roughness: 0.4, seed: 801 } },
        { definitionId: 'high-pass', position: pos(4, 1), parameters: { radius: 8 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 45 } },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 3 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 75, gamma: 1.4 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 15, contrast: 10 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 10. Plasma Storm
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Plasma Storm',
    description: 'Perlin + twirl distortion with cosine modulation and overlay blend',
    category: 'Noise',
    tags: ['noise', 'plasma', 'storm', 'energy', 'swirl', 'dynamic'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 6, roughness: 0.55, seed: 900 } },
        { definitionId: 'twirl', position: pos(4, 0), parameters: { angle: 300, radius: 0.8 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 7, octaves: 5, roughness: 0.7, seed: 901 } },
        { definitionId: 'math-cosine', position: pos(4, 1), parameters: { units: 4 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 70 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 35, scale: 4, octaves: 3 } },
        { definitionId: 'math-abs', position: pos(2, 1) },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 5, inWhite: 70, gamma: 0.7 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 30 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', 8, 'source'),
        e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 11. Tectonic Plates
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Tectonic Plates',
    description: 'Cells with edge detection and perlin overlay for geological plate texture',
    category: 'Noise',
    tags: ['noise', 'tectonic', 'geology', 'plates', 'cracked', 'earth'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 4, formula: 0, octaves: 3 } },
        { definitionId: 'edge-detector', position: pos(4, 0) },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 6, roughness: 0.65, seed: 1000 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 50 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 18, scale: 5, octaves: 3 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 80, gamma: 0.9 } },
        { definitionId: 'sharpen', position: pos(1, 1), parameters: { amount: 30 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 15 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'),
        e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 12. Silk Threads
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Silk Threads',
    description: 'Perlin with wave distortion and ripple for flowing silk thread pattern',
    category: 'Noise',
    tags: ['noise', 'silk', 'threads', 'flowing', 'smooth', 'elegant'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 2, octaves: 3, roughness: 0.3, seed: 1100 } },
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.08, ampY: 0.01, freqX: 8, freqY: 2, type: 0 } },
        { definitionId: 'ripple', position: pos(3, 0), parameters: { amplitude: 0.03, frequency: 20 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 25, octaves: 2, roughness: 0.4, seed: 1101 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 9, opacity: 30 } },
        { definitionId: 'blur', position: pos(1, 0), parameters: { radius: 4 } },
        { definitionId: 'levels', position: pos(1, 1), parameters: { inBlack: 20, inWhite: 80, gamma: 1.5 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: 10 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 13. Meteor Impact
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Meteor Impact',
    description: 'Radial perlin with barrel distortion and power curve for crater effect',
    category: 'Noise',
    tags: ['noise', 'meteor', 'impact', 'crater', 'radial', 'explosive'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 5, roughness: 0.6, seed: 1200 } },
        { definitionId: 'barrel-distort', position: pos(4, 0), parameters: { amount: 60 } },
        { definitionId: 'math-power', position: pos(3, 0), parameters: { power: 2.5 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 15, formula: 2, octaves: 2 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 55 } },
        { definitionId: 'noise-distortion', position: pos(1, 0), parameters: { distortion: 20, scale: 6, octaves: 2 } },
        { definitionId: 'invert', position: pos(1, 1) },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 0.8 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 14. Smoke Wisps
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Smoke Wisps',
    description: 'Low-frequency perlin with heavy blur and vortex for wispy smoke effect',
    category: 'Noise',
    tags: ['noise', 'smoke', 'wisps', 'soft', 'atmospheric', 'gentle'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 2, octaves: 4, roughness: 0.4, seed: 1300 } },
        { definitionId: 'vortex', position: pos(4, 0), parameters: { angle: 120 } },
        { definitionId: 'blur', position: pos(3, 0), parameters: { radius: 8 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 5, octaves: 6, roughness: 0.7, seed: 1301 } },
        { definitionId: 'blur', position: pos(4, 1), parameters: { radius: 4 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 50 } },
        { definitionId: 'gamma', position: pos(1, 0), parameters: { gamma: 2.0 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 20, inWhite: 70, gamma: 1.6 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(3, 'out', 4, 'source'),
        e(2, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'),
        e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 15. Razor Wire
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Razor Wire',
    description: 'Cells edge-detected with sine modulation and extreme contrast',
    category: 'Noise',
    tags: ['noise', 'razor', 'wire', 'sharp', 'industrial', 'harsh'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 15, formula: 1, octaves: 1 } },
        { definitionId: 'edge-detector', position: pos(4, 0) },
        { definitionId: 'math-sine', position: pos(3, 0), parameters: { units: 8 } },
        { definitionId: 'math-abs', position: pos(2, 0) },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 30, octaves: 2, roughness: 0.3, seed: 1400 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 2, opacity: 60 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 30, inWhite: 60, gamma: 0.5 } },
        { definitionId: 'sharpen', position: pos(0, 1), parameters: { amount: 70 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'),
        e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 16. Sandstorm
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Sandstorm',
    description: 'Fine perlin with offset tiling and blur for wind-blown sand effect',
    category: 'Noise',
    tags: ['noise', 'sand', 'storm', 'wind', 'desert', 'gritty'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 30, octaves: 4, roughness: 0.5, seed: 1500 } },
        { definitionId: 'offset', position: pos(4, 0), parameters: { offsetX: 0.3, offsetY: 0.1 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 7, roughness: 0.7, seed: 1501 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 45 } },
        { definitionId: 'scale', position: pos(3, 1), parameters: { scaleX: 2.0, scaleY: 0.8 } },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 2 } },
        { definitionId: 'noise-distortion', position: pos(1, 0), parameters: { distortion: 10, scale: 12, octaves: 2 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 1.1 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'),
        e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 17. Ripple Pool
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Ripple Pool',
    description: 'Concentric ripples from perlin with spherize and blur for water pool',
    category: 'Noise',
    tags: ['noise', 'ripple', 'water', 'pool', 'concentric', 'calm'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 4, roughness: 0.4, seed: 1600 } },
        { definitionId: 'ripple', position: pos(4, 0), parameters: { amplitude: 0.05, frequency: 15 } },
        { definitionId: 'spherize', position: pos(3, 0), parameters: { amount: 25 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 10, octaves: 3, roughness: 0.5, seed: 1601 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 9, opacity: 35 } },
        { definitionId: 'blur', position: pos(1, 0), parameters: { radius: 5 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 15, inWhite: 85, gamma: 1.3 } },
        { definitionId: 'brightness-contrast', position: pos(0, 1), parameters: { brightness: 5, contrast: 10 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 18. Volcanic Ash
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Volcanic Ash',
    description: 'Dark perlin with power curves and noise distortion for volcanic debris',
    category: 'Noise',
    tags: ['noise', 'volcanic', 'ash', 'dark', 'debris', 'texture'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 10, octaves: 7, roughness: 0.8, seed: 1700, contrast: 25 } },
        { definitionId: 'math-power', position: pos(4, 0), parameters: { power: 0.4 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 20, formula: 0, octaves: 2 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 2, opacity: 70 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 25, scale: 8, octaves: 3 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 25, inWhite: 65, gamma: 0.6 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -15, contrast: 25 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 19. Circuit Board
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Circuit Board',
    description: 'Blocks with threshold and edge detect for PCB trace pattern',
    category: 'Noise',
    tags: ['noise', 'circuit', 'board', 'digital', 'tech', 'pcb'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'blocks-noise', position: pos(5, 0), parameters: { scale: 6, seed: 1800 } },
        { definitionId: 'threshold', position: pos(4, 0), parameters: { threshold: 55 } },
        { definitionId: 'blocks-noise', position: pos(5, 1), parameters: { scale: 18, seed: 1801 } },
        { definitionId: 'edge-detector', position: pos(4, 1) },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 80 } },
        { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 40, octaves: 2, roughness: 0.3, seed: 1802 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 30 } },
        { definitionId: 'sharpen', position: pos(1, 0), parameters: { amount: 50 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 95, gamma: 1.0 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', 8, 'source'),
        e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 20. Charcoal Sketch
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Charcoal Sketch',
    description: 'Perlin with high-pass and scale stretch for charcoal drawing effect',
    category: 'Noise',
    tags: ['noise', 'charcoal', 'sketch', 'artistic', 'drawing', 'hand-drawn'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 6, roughness: 0.7, seed: 1900 } },
        { definitionId: 'scale', position: pos(4, 0), parameters: { scaleX: 0.5, scaleY: 1.5 } },
        { definitionId: 'high-pass', position: pos(3, 0), parameters: { radius: 10 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 20, octaves: 3, roughness: 0.4, seed: 1901 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 60 } },
        { definitionId: 'math-abs', position: pos(1, 0) },
        { definitionId: 'invert', position: pos(1, 1) },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 50, gamma: 0.5 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 21. Interference Pattern
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Interference Pattern',
    description: 'Two sine-modulated perlins blended with difference for moire-like interference',
    category: 'Noise',
    tags: ['noise', 'interference', 'moire', 'wave', 'pattern', 'optical'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 3, roughness: 0.3, seed: 2000 } },
        { definitionId: 'math-sine', position: pos(4, 0), parameters: { units: 12 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 5, octaves: 3, roughness: 0.3, seed: 2001 } },
        { definitionId: 'math-cosine', position: pos(4, 1), parameters: { units: 10 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 5, opacity: 100 } },
        { definitionId: 'math-abs', position: pos(2, 0) },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 0, inWhite: 60, gamma: 0.8 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 0, contrast: 20 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 22. Crumpled Paper
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Crumpled Paper',
    description: 'Perlin with noise distortion and soft lighting for wrinkled paper surface',
    category: 'Noise',
    tags: ['noise', 'crumpled', 'paper', 'wrinkled', 'soft', 'surface'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 5, roughness: 0.55, seed: 2100 } },
        { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 40, scale: 3, octaves: 4 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 12, octaves: 3, roughness: 0.4, seed: 2101 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 9, opacity: 40 } },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 3 } },
        { definitionId: 'gamma', position: pos(1, 0), parameters: { gamma: 1.8 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 1.4 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 23. Static Burst
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Static Burst',
    description: 'High-frequency perlin with modulo and power for static electricity pattern',
    category: 'Noise',
    tags: ['noise', 'static', 'burst', 'electric', 'high-frequency', 'energy'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 40, octaves: 3, roughness: 0.5, seed: 2200 } },
        { definitionId: 'math-power', position: pos(4, 0), parameters: { power: 4 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 3, octaves: 6, roughness: 0.8, seed: 2201 } },
        { definitionId: 'math-fract', position: pos(4, 1) },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 60 } },
        { definitionId: 'threshold', position: pos(3, 1), parameters: { threshold: 40 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 50 } },
        { definitionId: 'sharpen', position: pos(1, 0), parameters: { amount: 45 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 80, gamma: 0.7 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(4, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', 8, 'source'),
        e(8, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 24. Magma Flow
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Magma Flow',
    description: 'Perlin with vortex and heavy noise distortion for flowing magma',
    category: 'Noise',
    tags: ['noise', 'magma', 'lava', 'flow', 'hot', 'volcanic'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 5, roughness: 0.6, seed: 2300 } },
        { definitionId: 'vortex', position: pos(4, 0), parameters: { angle: 240 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 45, scale: 3, octaves: 4 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 7, octaves: 4, roughness: 0.7, seed: 2301 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 10, opacity: 55 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 20, inWhite: 70, gamma: 0.7 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -10, contrast: 30 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 25. Crystalline
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Crystalline',
    description: 'Cells with kaleidoscope and sharp levels for crystal facet structure',
    category: 'Noise',
    tags: ['noise', 'crystal', 'facet', 'geometric', 'sharp', 'mineral'],
    build: () => {
      const nodes: TemplateNode[] = [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 8, formula: 0, octaves: 2 } },
        { definitionId: 'kaleidoscope', position: pos(4, 0), parameters: { segments: 6, angle: 0 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 14, formula: 1, octaves: 3 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 55 } },
        { definitionId: 'sharpen', position: pos(2, 0), parameters: { amount: 60 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 70, gamma: 0.8 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: 20 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 26-30: More grayscale noise textures
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Fossil Imprint',
    description: 'Cells + perlin multiply with invert and edge detect for fossilized look',
    category: 'Noise',
    tags: ['noise', 'fossil', 'ancient', 'organic', 'imprint', 'stone'],
    build: () => graph(
      [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 5, formula: 2, octaves: 3 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 5, roughness: 0.6, seed: 2600 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 75 } },
        { definitionId: 'invert', position: pos(3, 0) },
        { definitionId: 'edge-detector', position: pos(3, 1) },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 1, opacity: 40 } },
        { definitionId: 'noise-distortion', position: pos(1, 0), parameters: { distortion: 15, scale: 6, octaves: 2 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 80, gamma: 1.0 } },
      ],
      [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'), e(2, 'out', 4, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Topographic Map',
    description: 'Perlin with floor quantization for contour line map effect',
    category: 'Noise',
    tags: ['noise', 'topographic', 'map', 'contour', 'terrain', 'lines'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 4, roughness: 0.5, seed: 2700 } },
        { definitionId: 'math-remap-range', position: pos(4, 0), parameters: { srcMin: 0, srcMax: 1, outMin: 0, outMax: 12 } },
        { definitionId: 'math-floor', position: pos(3, 0) },
        { definitionId: 'math-remap-range', position: pos(2, 0), parameters: { srcMin: 0, srcMax: 12, outMin: 0.1, outMax: 0.9 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 15, octaves: 3, roughness: 0.4, seed: 2701 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 4, opacity: 20 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 95, gamma: 1.0 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Nebula Gas',
    description: 'Multi-layer perlin with screen blend and blur for gaseous nebula',
    category: 'Noise',
    tags: ['noise', 'nebula', 'gas', 'space', 'cosmic', 'soft'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 2, octaves: 6, roughness: 0.65, seed: 2800 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 5, octaves: 4, roughness: 0.5, seed: 2801 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 3, opacity: 60 } },
        { definitionId: 'vortex', position: pos(3, 0), parameters: { angle: 90 } },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 6 } },
        { definitionId: 'perlin-noise', position: pos(3, 1), parameters: { scale: 10, octaves: 3, roughness: 0.4, seed: 2802 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 40 } },
        { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 1.6 } },
      ],
      [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'), e(3, 'out', 4, 'source'),
        e(4, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Iron Filings',
    description: 'Perlin with polar coordinates and sharp contrast for magnetic field pattern',
    category: 'Noise',
    tags: ['noise', 'iron', 'magnetic', 'filings', 'field', 'science'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 5, roughness: 0.7, seed: 2900 } },
        { definitionId: 'polar-coordinates', position: pos(4, 0), parameters: { direction: 0 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 20, octaves: 3, roughness: 0.5, seed: 2901 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 5, opacity: 60 } },
        { definitionId: 'math-abs', position: pos(2, 0) },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 55, gamma: 0.6 } },
        { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 55 } },
      ],
      [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Liquid Mercury',
    description: 'Smooth perlin with spherize and heavy gamma for metallic liquid surface',
    category: 'Noise',
    tags: ['noise', 'mercury', 'liquid', 'metal', 'smooth', 'reflective'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 4, roughness: 0.35, seed: 3000 } },
        { definitionId: 'spherize', position: pos(4, 0), parameters: { amount: 50 } },
        { definitionId: 'blur', position: pos(3, 0), parameters: { radius: 6 } },
        { definitionId: 'gamma', position: pos(2, 0), parameters: { gamma: 0.4 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 15, octaves: 2, roughness: 0.3, seed: 3001 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 30 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 90, gamma: 0.6 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 31-35
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Corrugated Metal',
    description: 'Perlin with wave and high-pass for industrial corrugated surface',
    category: 'Noise',
    tags: ['noise', 'corrugated', 'metal', 'industrial', 'ridged', 'surface'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 2, octaves: 3, roughness: 0.3, seed: 3100 } },
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0, ampY: 0.1, freqX: 1, freqY: 16, type: 0 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 20, octaves: 4, roughness: 0.6, seed: 3101 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 30 } },
        { definitionId: 'high-pass', position: pos(2, 0), parameters: { radius: 6 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 1, opacity: 50 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 1.0 } },
      ],
      [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Mycelium Network',
    description: 'Cells formula 3 with perlin overlay and blur for fungal network',
    category: 'Noise',
    tags: ['noise', 'mycelium', 'fungal', 'network', 'organic', 'branching'],
    build: () => graph(
      [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 6, formula: 3, octaves: 4 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 12, octaves: 6, roughness: 0.75, seed: 3200 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 4, opacity: 55 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 20, scale: 6, octaves: 3 } },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 2 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 75, gamma: 1.1 } },
        { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 35 } },
      ],
      [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'), e(3, 'out', 4, 'source'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Torn Fabric',
    description: 'Perlin with scale stretch, wave, and threshold for torn textile',
    category: 'Noise',
    tags: ['noise', 'torn', 'fabric', 'textile', 'distressed', 'ragged'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 5, octaves: 6, roughness: 0.7, seed: 3300 } },
        { definitionId: 'scale', position: pos(4, 0), parameters: { scaleX: 0.3, scaleY: 2.0 } },
        { definitionId: 'wave', position: pos(3, 0), parameters: { ampX: 0.03, ampY: 0, freqX: 6, freqY: 1, type: 1 } },
        { definitionId: 'threshold', position: pos(2, 0), parameters: { threshold: 48 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 25, octaves: 3, roughness: 0.4, seed: 3301 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 2, opacity: 50 } },
        { definitionId: 'noise-distortion', position: pos(0, 0), parameters: { distortion: 12, scale: 8, octaves: 2 } },
        { definitionId: 'levels', position: pos(0, 1), parameters: { inBlack: 5, inWhite: 90, gamma: 1.0 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Acid Etch',
    description: 'Perlin power with cells difference blend for chemically etched metal',
    category: 'Noise',
    tags: ['noise', 'acid', 'etch', 'chemical', 'metal', 'corroded'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 8, octaves: 5, roughness: 0.6, seed: 3400 } },
        { definitionId: 'math-power', position: pos(4, 0), parameters: { power: 2 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 12, formula: 1, octaves: 3 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 5, opacity: 70 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 15, scale: 10, octaves: 2 } },
        { definitionId: 'invert', position: pos(1, 0) },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 20, inWhite: 75, gamma: 0.8 } },
      ],
      [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Glacier Ice',
    description: 'Perlin with ripple and blur for translucent glacier ice surface',
    category: 'Noise',
    tags: ['noise', 'glacier', 'ice', 'frozen', 'translucent', 'cold'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 5, roughness: 0.45, seed: 3500 } },
        { definitionId: 'ripple', position: pos(4, 0), parameters: { amplitude: 0.02, frequency: 8 } },
        { definitionId: 'blur', position: pos(3, 0), parameters: { radius: 5 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 15, octaves: 3, roughness: 0.3, seed: 3501 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 9, opacity: 35 } },
        { definitionId: 'gamma', position: pos(1, 0), parameters: { gamma: 2.2 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 15, inWhite: 85, gamma: 1.5 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 36-40
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Binary Rain',
    description: 'Blocks with pixelate and threshold for digital binary data stream',
    category: 'Noise',
    tags: ['noise', 'binary', 'digital', 'matrix', 'data', 'code'],
    build: () => graph(
      [
        { definitionId: 'blocks-noise', position: pos(5, 0), parameters: { scale: 30, seed: 3600 } },
        { definitionId: 'pixelate', position: pos(4, 0), parameters: { size: 4 } },
        { definitionId: 'threshold', position: pos(3, 0), parameters: { threshold: 50 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 3, octaves: 4, roughness: 0.5, seed: 3601 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 60 } },
        { definitionId: 'scale', position: pos(1, 0), parameters: { scaleX: 1, scaleY: 3.0 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 0, inWhite: 100, gamma: 0.7 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Thunder Cloud',
    description: 'Multi-octave perlin with twirl and screen blend for storm cloud texture',
    category: 'Noise',
    tags: ['noise', 'thunder', 'cloud', 'storm', 'atmospheric', 'dark'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 2, octaves: 7, roughness: 0.7, seed: 3700, contrast: 15 } },
        { definitionId: 'twirl', position: pos(4, 0), parameters: { angle: 60, radius: 0.6 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 4, octaves: 5, roughness: 0.6, seed: 3701 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 3, opacity: 55 } },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 4 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 25, inWhite: 75, gamma: 0.7 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -20, contrast: 25 } },
      ],
      [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Marble Vein',
    description: 'Perlin with sine modulation and noise distort for marble veining',
    category: 'Noise',
    tags: ['noise', 'marble', 'vein', 'stone', 'natural', 'elegant'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 6, roughness: 0.65, seed: 3800 } },
        { definitionId: 'math-sine', position: pos(4, 0), parameters: { units: 3 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 30, scale: 4, octaves: 4 } },
        { definitionId: 'math-abs', position: pos(2, 0) },
        { definitionId: 'blur', position: pos(2, 1), parameters: { radius: 2 } },
        { definitionId: 'gamma', position: pos(1, 0), parameters: { gamma: 0.5 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 80, gamma: 1.2 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 3, 'source'), e(3, 'out', 4, 'source'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Alien Skin',
    description: 'Cells formula 4 with perlin overlay and spherize for alien organic surface',
    category: 'Noise',
    tags: ['noise', 'alien', 'skin', 'organic', 'sci-fi', 'strange'],
    build: () => graph(
      [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 10, formula: 4, octaves: 3 } },
        { definitionId: 'spherize', position: pos(4, 0), parameters: { amount: 30 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 15, octaves: 4, roughness: 0.6, seed: 3900 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 4, opacity: 50 } },
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 20, scale: 7, octaves: 3 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 0.9 } },
        { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 40 } },
      ],
      [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'), e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Gravity Well',
    description: 'Perlin with barrel distort and power for gravitational distortion field',
    category: 'Noise',
    tags: ['noise', 'gravity', 'distortion', 'space', 'warp', 'physics'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 5, octaves: 5, roughness: 0.6, seed: 4000 } },
        { definitionId: 'barrel-distort', position: pos(4, 0), parameters: { amount: 80 } },
        { definitionId: 'math-power', position: pos(3, 0), parameters: { power: 1.5 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 10, octaves: 3, roughness: 0.4, seed: 4001 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 9, opacity: 45 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 80, gamma: 0.9 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 20 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 41-45: Final grayscale batch
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Weathered Stone',
    description: 'Perlin + cells with heavy noise distortion for ancient weathered rock',
    category: 'Noise',
    tags: ['noise', 'weathered', 'stone', 'rock', 'ancient', 'rough'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 5, octaves: 7, roughness: 0.75, seed: 4100, contrast: 20 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 8, formula: 0, octaves: 3 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 65 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 35, scale: 4, octaves: 4 } },
        { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 25, octaves: 2, roughness: 0.3, seed: 4101 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 4, opacity: 30 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 15, inWhite: 80, gamma: 0.9 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -10, contrast: 15 } },
      ],
      [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Sonar Pulse',
    description: 'Perlin with polar coords and ripple for sonar/radar pulse pattern',
    category: 'Noise',
    tags: ['noise', 'sonar', 'radar', 'pulse', 'radial', 'wave'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 3, roughness: 0.4, seed: 4200 } },
        { definitionId: 'polar-coordinates', position: pos(4, 0), parameters: { direction: 1 } },
        { definitionId: 'ripple', position: pos(3, 0), parameters: { amplitude: 0.04, frequency: 12 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 12, octaves: 4, roughness: 0.5, seed: 4201 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 1, opacity: 40 } },
        { definitionId: 'blur', position: pos(1, 0), parameters: { radius: 3 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 1.2 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Cellular Mitosis',
    description: 'Two cells blended with noise distortion for dividing cell pattern',
    category: 'Noise',
    tags: ['noise', 'cellular', 'biology', 'organic', 'cell', 'microscopic'],
    build: () => graph(
      [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 6, formula: 0, octaves: 2 } },
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 10, formula: 3, octaves: 3 } },
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 9, opacity: 60 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 25, scale: 5, octaves: 3 } },
        { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 20, octaves: 3, roughness: 0.5, seed: 4300 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 4, opacity: 35 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 80, gamma: 1.0 } },
        { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 30 } },
      ],
      [
        e(0, 'out', 2, 'foreground'), e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Fractal Canyon',
    description: 'Perlin with deep power curves and noise distort for canyon walls',
    category: 'Noise',
    tags: ['noise', 'fractal', 'canyon', 'terrain', 'deep', 'geological'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 6, roughness: 0.6, seed: 4400 } },
        { definitionId: 'math-power', position: pos(4, 0), parameters: { power: 0.3 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 40, scale: 3, octaves: 5 } },
        { definitionId: 'perlin-noise', position: pos(4, 1), parameters: { scale: 10, octaves: 4, roughness: 0.7, seed: 4401 } },
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 50 } },
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 20, inWhite: 70, gamma: 0.7 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -10, contrast: 30 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'foreground'), e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Acoustic Wave',
    description: 'Perlin sine + cosine combination with ripple for sound wave visualization',
    category: 'Noise',
    tags: ['noise', 'acoustic', 'wave', 'sound', 'frequency', 'oscillation'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 4, roughness: 0.4, seed: 4500 } },
        { definitionId: 'math-sine', position: pos(4, 0), parameters: { units: 8 } },
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 4, octaves: 4, roughness: 0.4, seed: 4501 } },
        { definitionId: 'math-cosine', position: pos(4, 1), parameters: { units: 6 } },
        { definitionId: 'math-add', position: pos(3, 0) },
        { definitionId: 'ripple', position: pos(2, 0), parameters: { amplitude: 0.03, frequency: 10 } },
        { definitionId: 'math-abs', position: pos(1, 0) },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 70, gamma: 0.8 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'a'), e(3, 'out', 4, 'b'),
        e(4, 'out', 5, 'source'), e(5, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 46-50: COLORED noise textures (5 with color)
  // ═══════════════════════════════════════════════════════════════════════
  {
    name: 'Aurora Borealis',
    description: 'Perlin with vortex and green/cyan/purple gradient for northern lights',
    category: 'Noise',
    tags: ['noise', 'aurora', 'northern-lights', 'colorful', 'atmospheric', 'cosmic'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 2, octaves: 5, roughness: 0.5, seed: 4600 } },
        { definitionId: 'vortex', position: pos(5, 0), parameters: { angle: 100 } },
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.06, ampY: 0.02, freqX: 3, freqY: 1, type: 0 } },
        { definitionId: 'blur', position: pos(3, 0), parameters: { radius: 6 } },
        { definitionId: 'gradient-3-color', position: pos(4, 2), parameters: { color1: '#0a1a0a', color2: '#00cc88', color3: '#6633cc', angle: 90 } },
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 70 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 15 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'elevation'), e(4, 'out', 5, 'gradient'),
        e(3, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Sunset Haze',
    description: 'Perlin with warm orange/pink/purple gradient for sunset atmosphere',
    category: 'Noise',
    tags: ['noise', 'sunset', 'warm', 'colorful', 'atmospheric', 'gradient'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 6, roughness: 0.6, seed: 4700 } },
        { definitionId: 'blur', position: pos(4, 0), parameters: { radius: 4 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 20, scale: 4, octaves: 3 } },
        { definitionId: 'gradient-3-color', position: pos(4, 2), parameters: { color1: '#ff6633', color2: '#cc3366', color3: '#331a4d', angle: 0 } },
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        { definitionId: 'perlin-noise', position: pos(3, 2), parameters: { scale: 8, octaves: 3, roughness: 0.4, seed: 4701 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 4, opacity: 40 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 10 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'elevation'), e(3, 'out', 4, 'gradient'),
        e(4, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Deep Ocean',
    description: 'Perlin with ripple and dark blue/teal gradient for underwater depth',
    category: 'Noise',
    tags: ['noise', 'ocean', 'deep', 'underwater', 'blue', 'colorful'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 5, roughness: 0.55, seed: 4800 } },
        { definitionId: 'ripple', position: pos(4, 0), parameters: { amplitude: 0.04, frequency: 6 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 15, scale: 5, octaves: 3 } },
        { definitionId: 'gradient-3-color', position: pos(4, 2), parameters: { color1: '#000d1a', color2: '#004d66', color3: '#1a8099', angle: 90 } },
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 3 } },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 2, opacity: 80 } },
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 85, gamma: 1.1 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'), e(2, 'out', 5, 'source'),
        e(5, 'out', 4, 'elevation'), e(3, 'out', 4, 'gradient'),
        e(5, 'out', 6, 'foreground'), e(4, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Emerald Vortex',
    description: 'Perlin with twirl and green/gold gradient for jewel-like swirl',
    category: 'Noise',
    tags: ['noise', 'emerald', 'vortex', 'jewel', 'green', 'colorful'],
    build: () => graph(
      [
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 5, roughness: 0.5, seed: 4900 } },
        { definitionId: 'twirl', position: pos(4, 0), parameters: { angle: 400, radius: 0.7 } },
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 25, scale: 4, octaves: 3 } },
        { definitionId: 'gradient-3-color', position: pos(4, 2), parameters: { color1: '#0d1a00', color2: '#1a993d', color3: '#cccc33', angle: 45 } },
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 4, opacity: 60 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 0, contrast: 20 } },
      ],
      [
        e(0, 'out', 1, 'source'), e(1, 'out', 2, 'source'),
        e(2, 'out', 4, 'elevation'), e(3, 'out', 4, 'gradient'),
        e(2, 'out', 5, 'foreground'), e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'), e(6, 'out', -1, 'source'),
      ],
    ),
  },
  {
    name: 'Neon Circuit',
    description: 'Blocks + cells edges with electric blue/magenta gradient for neon glow',
    category: 'Noise',
    tags: ['noise', 'neon', 'circuit', 'glow', 'electric', 'colorful'],
    build: () => graph(
      [
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 8, formula: 1, octaves: 2 } },
        { definitionId: 'edge-detector', position: pos(4, 0) },
        { definitionId: 'blocks-noise', position: pos(5, 1), parameters: { scale: 12, seed: 5000 } },
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 60 } },
        { definitionId: 'gradient-3-color', position: pos(4, 2), parameters: { color1: '#0d001a', color2: '#0066ff', color3: '#ff33cc', angle: 0 } },
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 80 } },
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: 20 } },
      ],
      [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'), e(2, 'out', 3, 'background'),
        e(3, 'out', 5, 'elevation'), e(4, 'out', 5, 'gradient'),
        e(3, 'out', 6, 'foreground'), e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'), e(7, 'out', -1, 'source'),
      ],
    ),
  },
];
