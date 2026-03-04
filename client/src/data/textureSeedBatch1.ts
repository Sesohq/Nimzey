/**
 * textureSeedBatch1 - 25 procedural texture definitions (Experimental + Grunge).
 * Each seed builds a complete, renderable node graph via TemplateBuildResult.
 */

import type { TemplateBuildResult, TemplateNode, TemplateEdge } from '@/templates/graphTemplates';

export interface TextureSeed {
  name: string;
  description: string;
  category: string;
  tags: string[];
  build: () => TemplateBuildResult;
}

// Layout helpers
const COL = 280;
const ROW = 160;
const pos = (col: number, row: number) => ({ x: 500 - col * COL, y: 200 + row * ROW });
const e = (sourceIdx: number, sourcePort: string, targetIdx: number, targetPort: string): TemplateEdge => ({ sourceIdx, sourcePort, targetIdx, targetPort });
const graph = (nodes: TemplateNode[], edges: TemplateEdge[]): TemplateBuildResult => ({ nodes, edges });

export const textureSeedBatch1: TextureSeed[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Quantum Flux
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Quantum Flux',
    description: 'UV math + trig oscillations + fract tiling + spectrum overlay',
    category: 'Experimental',
    tags: ['uv', 'trig', 'fract', 'spectrum', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: UV coordinates
        { definitionId: 'uv-coordinates', position: pos(6, 0) },
        // 1: Split X
        { definitionId: 'math-split-vec2', position: pos(5, 0), parameters: { channel: 0 } },
        // 2: Split Y
        { definitionId: 'math-split-vec2', position: pos(5, 1), parameters: { channel: 1 } },
        // 3: Sine of X
        { definitionId: 'math-sine', position: pos(4, 0), parameters: { units: 2 } },
        // 4: Cosine of Y
        { definitionId: 'math-cosine', position: pos(4, 1), parameters: { units: 2 } },
        // 5: Multiply sine * cosine
        { definitionId: 'math-multiply', position: pos(3, 0) },
        // 6: Perlin noise for modulation
        { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 8, octaves: 4, roughness: 0.6 } },
        // 7: Add perlin to product
        { definitionId: 'math-add', position: pos(2, 1) },
        // 8: Fract for tiling
        { definitionId: 'math-fract', position: pos(2, 0) },
        // 9: Remap range for better contrast
        { definitionId: 'math-remap-range', position: pos(1, 0), parameters: { srcMin: 0, srcMax: 1, outMin: 0.1, outMax: 0.9 } },
        // 10: Spectrum
        { definitionId: 'spectrum', position: pos(2, 3) },
        // 11: Gradient-elevation to colorize
        { definitionId: 'gradient-elevation', position: pos(1, 2) },
        // 12: Blend spectrum overlay
        { definitionId: 'blend', position: pos(0, 1), parameters: { mode: 4, opacity: 60 } },
        // 13: Brightness-contrast final
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 20 } },
        // 14: Noise distortion for organic feel
        { definitionId: 'noise-distortion', position: pos(3, 2), parameters: { distortion: 25, scale: 6, octaves: 3 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(0, 'out', 2, 'source'),
        e(1, 'out', 3, 'source'),
        e(2, 'out', 4, 'source'),
        e(3, 'out', 5, 'a'),
        e(4, 'out', 5, 'b'),
        e(6, 'out', 14, 'source'),
        e(5, 'out', 7, 'a'),
        e(14, 'out', 7, 'b'),
        e(7, 'out', 8, 'source'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', 11, 'elevation'),
        e(10, 'out', 11, 'gradient'),
        e(9, 'out', 12, 'foreground'),
        e(11, 'out', 12, 'background'),
        e(12, 'out', 13, 'source'),
        e(13, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Neural Web
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Neural Web',
    description: 'Multiple cells noise edge-detected and blended into a glowing web',
    category: 'Experimental',
    tags: ['cells', 'edge', 'glow', 'neural', 'network'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Cells A - euclidean large
        { definitionId: 'cells-noise', position: pos(7, 0), parameters: { scale: 8, formula: 0, octaves: 3 } },
        // 1: Cells B - manhattan fine
        { definitionId: 'cells-noise', position: pos(7, 1), parameters: { scale: 14, formula: 1, octaves: 2 } },
        // 2: Cells C - chebyshev
        { definitionId: 'cells-noise', position: pos(7, 2), parameters: { scale: 20, formula: 2, octaves: 1 } },
        // 3: Edge detect A
        { definitionId: 'edge-detector', position: pos(6, 0) },
        // 4: Edge detect B
        { definitionId: 'edge-detector', position: pos(6, 1) },
        // 5: Edge detect C
        { definitionId: 'edge-detector', position: pos(6, 2) },
        // 6: Blend A + B (add)
        { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 1, opacity: 80 } },
        // 7: Blend AB + C (screen)
        { definitionId: 'blend', position: pos(4, 1), parameters: { mode: 3, opacity: 70 } },
        // 8: Levels to crush blacks
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 30, inWhite: 85, gamma: 1.4 } },
        // 9: Blur for glow
        { definitionId: 'blur', position: pos(3, 1), parameters: { radius: 6 } },
        // 10: Blend sharp + glow (screen)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 65 } },
        // 11: Perlin warp driver
        { definitionId: 'perlin-noise', position: pos(5, 3), parameters: { scale: 4, octaves: 2, roughness: 0.5 } },
        // 12: Noise distortion on blended edges
        { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 15, scale: 5, octaves: 2 } },
        // 13: Spectrum for color
        { definitionId: 'spectrum', position: pos(3, 3) },
        // 14: Gradient-elevation colorize
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 15: Blend color overlay
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 3, opacity: 55 } },
        // 16: Gamma final
        { definitionId: 'gamma', position: pos(1, 0), parameters: { gamma: 0.85 } },
        // 17: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 8, contrast: 15 } },
      ];
      const edges = [
        e(0, 'out', 3, 'source'),
        e(1, 'out', 4, 'source'),
        e(2, 'out', 5, 'source'),
        e(3, 'out', 6, 'foreground'),
        e(4, 'out', 6, 'background'),
        e(5, 'out', 7, 'background'),
        e(6, 'out', 12, 'source'),
        e(12, 'out', 7, 'foreground'),
        e(7, 'out', 8, 'source'),
        e(7, 'out', 9, 'source'),
        e(8, 'out', 10, 'foreground'),
        e(9, 'out', 10, 'background'),
        e(10, 'out', 14, 'elevation'),
        e(13, 'out', 14, 'gradient'),
        e(10, 'out', 15, 'foreground'),
        e(14, 'out', 15, 'background'),
        e(15, 'out', 16, 'source'),
        e(16, 'out', 17, 'source'),
        e(17, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Plasma Vortex
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Plasma Vortex',
    description: 'Perlin noise through vortex and polar coords with spectrum color',
    category: 'Experimental',
    tags: ['plasma', 'vortex', 'polar', 'spectrum', 'swirl'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base A
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 5, roughness: 0.65, contrast: 8 } },
        // 1: Perlin base B
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 12, octaves: 3, roughness: 0.4, seed: 42 } },
        // 2: Blend A + B (add)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 1, opacity: 60 } },
        // 3: Vortex
        { definitionId: 'vortex', position: pos(3, 0), parameters: { strength: 2.5 } },
        // 4: Polar coordinates
        { definitionId: 'polar-coordinates', position: pos(2, 0), parameters: { mode: 0 } },
        // 5: Spectrum
        { definitionId: 'spectrum', position: pos(3, 2) },
        // 6: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        // 7: Blur glow layer
        { definitionId: 'blur', position: pos(2, 2), parameters: { radius: 8 } },
        // 8: Blend glow
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 3, opacity: 50 } },
        // 9: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: 5, contrast: 25 } },
        // 10: Hue-saturation boost
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 0, saturation: 30, lightness: 5 } },
        // 11: Noise distortion subtle
        { definitionId: 'noise-distortion', position: pos(3, 1), parameters: { distortion: 20, scale: 4, octaves: 3 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 11, 'source'),
        e(11, 'out', 4, 'source'),
        e(4, 'out', 6, 'elevation'),
        e(5, 'out', 6, 'gradient'),
        e(6, 'out', 7, 'source'),
        e(6, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Fractal Dimension
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Fractal Dimension',
    description: 'Nested noise distortions with kaleidoscope for fractal patterns',
    category: 'Experimental',
    tags: ['fractal', 'noise', 'kaleidoscope', 'distortion', 'recursive'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Base perlin
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 5, octaves: 6, roughness: 0.7, contrast: 10 } },
        // 1: Noise distortion pass 1
        { definitionId: 'noise-distortion', position: pos(5, 0), parameters: { distortion: 40, scale: 8, octaves: 4 } },
        // 2: Noise distortion pass 2
        { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 30, scale: 12, octaves: 3 } },
        // 3: Noise distortion pass 3
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 20, scale: 16, octaves: 2 } },
        // 4: Kaleidoscope
        { definitionId: 'kaleidoscope', position: pos(2, 0), parameters: { segments: 8 } },
        // 5: Cells for texture overlay
        { definitionId: 'cells-noise', position: pos(4, 2), parameters: { scale: 10, formula: 0, octaves: 2 } },
        // 6: Blend cells with distorted
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 4, opacity: 40 } },
        // 7: Levels crush
        { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 15, inWhite: 90, gamma: 1.2 } },
        // 8: Perlin modulator
        { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 3, octaves: 2, roughness: 0.5, seed: 77 } },
        // 9: Multiply for depth
        { definitionId: 'math-multiply', position: pos(5, 1) },
        // 10: Gradient-3-color warm
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.1, 0.0, 0.2, 1], color2: [0.8, 0.3, 0.1, 1], color3: [1.0, 0.9, 0.5, 1], angle: 0 } },
        // 11: Gradient-elevation for color
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 12: Blend colored with structure
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 4, opacity: 70 } },
        // 13: Sharpen final
        { definitionId: 'sharpen', position: pos(1, 0), parameters: { amount: 40 } },
        // 14: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 0, contrast: 15 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 2, 'source'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 4, 'source'),
        e(0, 'out', 9, 'a'),
        e(8, 'out', 9, 'b'),
        e(9, 'out', 6, 'foreground'),
        e(5, 'out', 6, 'background'),
        e(4, 'out', 7, 'source'),
        e(7, 'out', 11, 'elevation'),
        e(10, 'out', 11, 'gradient'),
        e(7, 'out', 12, 'foreground'),
        e(11, 'out', 12, 'background'),
        e(12, 'out', 13, 'source'),
        e(13, 'out', 14, 'source'),
        e(14, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Quantum Entangle
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Quantum Entangle',
    description: 'Two UV branches with sine/cosine multiplied and overlaid with cells',
    category: 'Experimental',
    tags: ['uv', 'sine', 'cosine', 'cells', 'interference'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: UV coords
        { definitionId: 'uv-coordinates', position: pos(8, 1) },
        // 1: Split X
        { definitionId: 'math-split-vec2', position: pos(7, 0), parameters: { channel: 0 } },
        // 2: Split Y
        { definitionId: 'math-split-vec2', position: pos(7, 2), parameters: { channel: 1 } },
        // Branch A: X path
        // 3: Sine(X)
        { definitionId: 'math-sine', position: pos(6, 0), parameters: { units: 2 } },
        // 4: Remap X
        { definitionId: 'math-remap-range', position: pos(5, 0), parameters: { srcMin: -1, srcMax: 1, outMin: 0, outMax: 1 } },
        // Branch B: Y path
        // 5: Cosine(Y)
        { definitionId: 'math-cosine', position: pos(6, 2), parameters: { units: 2 } },
        // 6: Remap Y
        { definitionId: 'math-remap-range', position: pos(5, 2), parameters: { srcMin: -1, srcMax: 1, outMin: 0, outMax: 1 } },
        // 7: Multiply branches
        { definitionId: 'math-multiply', position: pos(4, 1) },
        // 8: Second UV pass - add with offset
        // Perlin for modulation
        { definitionId: 'perlin-noise', position: pos(6, 3), parameters: { scale: 10, octaves: 4, roughness: 0.5 } },
        // 9: Add perlin to product
        { definitionId: 'math-add', position: pos(3, 1) },
        // 10: Fract for wrapping
        { definitionId: 'math-fract', position: pos(3, 0) },
        // 11: Cells noise overlay
        { definitionId: 'cells-noise', position: pos(4, 4), parameters: { scale: 12, formula: 1, octaves: 2 } },
        // 12: Blend multiply + cells (overlay)
        { definitionId: 'blend', position: pos(2, 2), parameters: { mode: 4, opacity: 55 } },
        // 13: Second sine for interference
        { definitionId: 'math-sine', position: pos(5, 1), parameters: { units: 2 } },
        // 14: Add interference
        { definitionId: 'math-add', position: pos(4, 0) },
        // 15: Noise distortion
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 18, scale: 6, octaves: 3 } },
        // 16: Spectrum color
        { definitionId: 'spectrum', position: pos(3, 4) },
        // 17: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 3) },
        // 18: Blend color (screen)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 3, opacity: 60 } },
        // 19: Levels
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 92, gamma: 1.1 } },
        // 20: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 20, saturation: 25, lightness: 0 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(0, 'out', 2, 'source'),
        e(1, 'out', 3, 'source'),
        e(3, 'out', 4, 'source'),
        e(2, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'),
        e(4, 'out', 14, 'a'),
        e(6, 'out', 13, 'source'),
        e(13, 'out', 14, 'b'),
        e(14, 'out', 7, 'a'),
        e(6, 'out', 7, 'b'),
        e(7, 'out', 9, 'a'),
        e(8, 'out', 9, 'b'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 15, 'source'),
        e(15, 'out', 12, 'foreground'),
        e(11, 'out', 12, 'background'),
        e(12, 'out', 17, 'elevation'),
        e(16, 'out', 17, 'gradient'),
        e(12, 'out', 18, 'foreground'),
        e(17, 'out', 18, 'background'),
        e(18, 'out', 19, 'source'),
        e(19, 'out', 20, 'source'),
        e(20, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Wormhole
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Wormhole',
    description: 'Polar + twirl + ripple + noise distortion layers creating a tunnel',
    category: 'Experimental',
    tags: ['polar', 'twirl', 'ripple', 'wormhole', 'tunnel'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 8, octaves: 5, roughness: 0.6, contrast: 12 } },
        // 1: Cells accent
        { definitionId: 'cells-noise', position: pos(6, 1), parameters: { scale: 6, formula: 0, octaves: 2 } },
        // 2: Blend perlin + cells
        { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 4, opacity: 50 } },
        // 3: Polar coordinates (rect to polar)
        { definitionId: 'polar-coordinates', position: pos(4, 0), parameters: { mode: 0 } },
        // 4: Twirl
        { definitionId: 'twirl', position: pos(3, 0), parameters: { strength: 3.5, radius: 1.5 } },
        // 5: Ripple
        { definitionId: 'ripple', position: pos(2, 0), parameters: { amplitude: 0.04, frequency: 12, decay: 3 } },
        // 6: Noise distortion
        { definitionId: 'noise-distortion', position: pos(1, 0), parameters: { distortion: 25, scale: 6, octaves: 3 } },
        // 7: Perlin detail
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 15, octaves: 3, roughness: 0.4, seed: 31 } },
        // 8: Blend detail (add)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 1, opacity: 30 } },
        // 9: Gradient-3-color (deep blue to white)
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.0, 0.0, 0.15, 1], color2: [0.2, 0.1, 0.6, 1], color3: [0.9, 0.8, 1.0, 1], angle: 0 } },
        // 10: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 11: Blend color (overlay)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 4, opacity: 75 } },
        // 12: Blur glow
        { definitionId: 'blur', position: pos(2, 3), parameters: { radius: 5 } },
        // 13: Blend glow (screen)
        { definitionId: 'blend', position: pos(0, 1), parameters: { mode: 3, opacity: 35 } },
        // 14: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 3, contrast: 20 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 4, 'source'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(8, 'out', 6, 'source'),
        e(6, 'out', 10, 'elevation'),
        e(9, 'out', 10, 'gradient'),
        e(6, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(11, 'out', 12, 'source'),
        e(11, 'out', 13, 'foreground'),
        e(12, 'out', 13, 'background'),
        e(13, 'out', 14, 'source'),
        e(14, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Synaptic Fire
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Synaptic Fire',
    description: 'Cells + perlin threshold edge-detected with a glow blend',
    category: 'Experimental',
    tags: ['cells', 'perlin', 'threshold', 'edge', 'glow', 'fire'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Cells main
        { definitionId: 'cells-noise', position: pos(7, 0), parameters: { scale: 10, formula: 0, octaves: 3, roughness: 0.6 } },
        // 1: Perlin modulator
        { definitionId: 'perlin-noise', position: pos(7, 1), parameters: { scale: 5, octaves: 4, roughness: 0.5, contrast: 8 } },
        // 2: Blend cells + perlin (multiply)
        { definitionId: 'blend', position: pos(6, 0), parameters: { mode: 2, opacity: 80 } },
        // 3: Levels before threshold
        { definitionId: 'levels', position: pos(5, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 1.5 } },
        // 4: Threshold
        { definitionId: 'threshold', position: pos(4, 0), parameters: { threshold: 45 } },
        // 5: Edge detect on threshold
        { definitionId: 'edge-detector', position: pos(3, 0) },
        // 6: Cells secondary fine
        { definitionId: 'cells-noise', position: pos(7, 2), parameters: { scale: 20, formula: 1, octaves: 1 } },
        // 7: Edge detect secondary
        { definitionId: 'edge-detector', position: pos(6, 2) },
        // 8: Blend edges (add)
        { definitionId: 'blend', position: pos(5, 1), parameters: { mode: 1, opacity: 60 } },
        // 9: Invert
        { definitionId: 'invert', position: pos(4, 1) },
        // 10: Blur glow
        { definitionId: 'blur', position: pos(3, 2), parameters: { radius: 10 } },
        // 11: Blend structure + glow (screen)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 70 } },
        // 12: Perlin for color variation
        { definitionId: 'perlin-noise', position: pos(5, 3), parameters: { scale: 3, octaves: 2, roughness: 0.3, seed: 55 } },
        // 13: Gradient-3-color fire
        { definitionId: 'gradient-3-color', position: pos(4, 4), parameters: { color1: [0.1, 0.0, 0.0, 1], color2: [0.9, 0.3, 0.0, 1], color3: [1.0, 0.95, 0.4, 1], angle: 0 } },
        // 14: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(3, 3) },
        // 15: Mask structure into color
        { definitionId: 'mask', position: pos(2, 2) },
        // 16: Blend final layers
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 3, opacity: 80 } },
        // 17: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: 5, contrast: 18 } },
        // 18: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: -5, saturation: 20, lightness: 0 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 4, 'source'),
        e(4, 'out', 5, 'source'),
        e(6, 'out', 7, 'source'),
        e(5, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(5, 'out', 9, 'source'),
        e(9, 'out', 10, 'source'),
        e(8, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(12, 'out', 14, 'elevation'),
        e(13, 'out', 14, 'gradient'),
        e(14, 'out', 15, 'source'),
        e(11, 'out', 15, 'mask'),
        e(11, 'out', 16, 'foreground'),
        e(15, 'out', 16, 'background'),
        e(16, 'out', 17, 'source'),
        e(17, 'out', 18, 'source'),
        e(18, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Digital Rain
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Digital Rain',
    description: 'Wave-heavy with multiple frequencies blended with blocks noise',
    category: 'Experimental',
    tags: ['wave', 'blocks', 'digital', 'rain', 'matrix'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Blocks noise base
        { definitionId: 'blocks-noise', position: pos(5, 0), parameters: { scale: 12, octaves: 4, roughness: 0.5 } },
        // 1: Wave A - vertical streaks
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.01, ampY: 0.15, freqX: 2, freqY: 12, type: 0 } },
        // 2: Perlin detail
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 20, octaves: 3, roughness: 0.4 } },
        // 3: Wave B - horizontal ripple
        { definitionId: 'wave', position: pos(4, 1), parameters: { ampX: 0.08, ampY: 0.02, freqX: 8, freqY: 1, type: 2 } },
        // 4: Blend wave A + wave B (add)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 50 } },
        // 5: Blocks noise fine
        { definitionId: 'blocks-noise', position: pos(5, 2), parameters: { scale: 30, octaves: 2, roughness: 0.3 } },
        // 6: Blend blocks fine (multiply)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 2, opacity: 60 } },
        // 7: Levels
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 25, inWhite: 85, gamma: 1.3 } },
        // 8: Noise distortion
        { definitionId: 'noise-distortion', position: pos(2, 1), parameters: { distortion: 12, scale: 10, octaves: 2 } },
        // 9: Gradient-3-color green matrix
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.0, 0.05, 0.0, 1], color2: [0.0, 0.5, 0.1, 1], color3: [0.5, 1.0, 0.6, 1], angle: 90 } },
        // 10: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 11: Blend color (overlay)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 4, opacity: 80 } },
        // 12: Gamma
        { definitionId: 'gamma', position: pos(1, 0), parameters: { gamma: 0.8 } },
        // 13: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 25 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(2, 'out', 3, 'source'),
        e(1, 'out', 4, 'foreground'),
        e(3, 'out', 4, 'background'),
        e(4, 'out', 6, 'foreground'),
        e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'),
        e(6, 'out', 8, 'source'),
        e(7, 'out', 10, 'elevation'),
        e(9, 'out', 10, 'gradient'),
        e(8, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(11, 'out', 12, 'source'),
        e(12, 'out', 13, 'source'),
        e(13, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Nebula Core
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Nebula Core',
    description: 'Multi-perlin with spectrum blur glow and cells stars',
    category: 'Experimental',
    tags: ['nebula', 'space', 'glow', 'perlin', 'cells', 'stars'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin large clouds
        { definitionId: 'perlin-noise', position: pos(8, 0), parameters: { scale: 3, octaves: 6, roughness: 0.7, contrast: 15 } },
        // 1: Perlin medium detail
        { definitionId: 'perlin-noise', position: pos(8, 1), parameters: { scale: 8, octaves: 4, roughness: 0.5, seed: 12 } },
        // 2: Perlin fine wisps
        { definitionId: 'perlin-noise', position: pos(8, 2), parameters: { scale: 18, octaves: 3, roughness: 0.4, seed: 33 } },
        // 3: Blend large + medium (screen)
        { definitionId: 'blend', position: pos(7, 0), parameters: { mode: 3, opacity: 65 } },
        // 4: Blend result + fine (add)
        { definitionId: 'blend', position: pos(6, 0), parameters: { mode: 1, opacity: 40 } },
        // 5: Noise distortion for organic shape
        { definitionId: 'noise-distortion', position: pos(5, 0), parameters: { distortion: 35, scale: 4, octaves: 4 } },
        // 6: Spectrum
        { definitionId: 'spectrum', position: pos(6, 3) },
        // 7: Gradient-elevation for nebula color
        { definitionId: 'gradient-elevation', position: pos(5, 2) },
        // 8: Blur glow layer
        { definitionId: 'blur', position: pos(5, 1), parameters: { radius: 12 } },
        // 9: Blend nebula color + glow (screen)
        { definitionId: 'blend', position: pos(4, 1), parameters: { mode: 3, opacity: 50 } },
        // 10: Cells for stars
        { definitionId: 'cells-noise', position: pos(7, 3), parameters: { scale: 35, formula: 0, octaves: 1 } },
        // 11: Levels crush stars to points
        { definitionId: 'levels', position: pos(6, 3), parameters: { inBlack: 75, inWhite: 95, gamma: 0.5 } },
        // 12: Perlin mask for star distribution
        { definitionId: 'perlin-noise', position: pos(7, 4), parameters: { scale: 4, octaves: 2, roughness: 0.3, seed: 99 } },
        // 13: Mask stars with distribution
        { definitionId: 'mask', position: pos(5, 3) },
        // 14: Blend stars (screen)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 3, opacity: 85 } },
        // 15: Second blur for star glow
        { definitionId: 'blur', position: pos(4, 3), parameters: { radius: 3 } },
        // 16: Blend star glow
        { definitionId: 'blend', position: pos(3, 2), parameters: { mode: 1, opacity: 30 } },
        // 17: Hue-saturation boost
        { definitionId: 'hue-saturation', position: pos(2, 1), parameters: { hue: -15, saturation: 40, lightness: 5 } },
        // 18: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(2, 0), parameters: { brightness: 8, contrast: 20 } },
        // 19: Vortex subtle
        { definitionId: 'vortex', position: pos(1, 0), parameters: { strength: 0.8 } },
        // 20: Gamma
        { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 0.9 } },
      ];
      const edges = [
        e(0, 'out', 3, 'foreground'),
        e(1, 'out', 3, 'background'),
        e(3, 'out', 4, 'foreground'),
        e(2, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 7, 'elevation'),
        e(6, 'out', 7, 'gradient'),
        e(5, 'out', 8, 'source'),
        e(7, 'out', 9, 'foreground'),
        e(8, 'out', 9, 'background'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', 13, 'source'),
        e(12, 'out', 13, 'mask'),
        e(9, 'out', 14, 'foreground'),
        e(13, 'out', 14, 'background'),
        e(13, 'out', 15, 'source'),
        e(14, 'out', 16, 'foreground'),
        e(15, 'out', 16, 'background'),
        e(16, 'out', 17, 'source'),
        e(17, 'out', 18, 'source'),
        e(18, 'out', 19, 'source'),
        e(19, 'out', 20, 'source'),
        e(20, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Chromatic Split
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Chromatic Split',
    description: 'Extract RGB channels, transform each separately, reassemble',
    category: 'Experimental',
    tags: ['rgb', 'chromatic', 'split', 'aberration', 'color'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base
        { definitionId: 'perlin-noise', position: pos(8, 1), parameters: { scale: 6, octaves: 5, roughness: 0.6, contrast: 10 } },
        // 1: Cells overlay
        { definitionId: 'cells-noise', position: pos(8, 3), parameters: { scale: 10, formula: 0, octaves: 2 } },
        // 2: Blend base (overlay)
        { definitionId: 'blend', position: pos(7, 2), parameters: { mode: 4, opacity: 50 } },
        // 3: Spectrum for initial color
        { definitionId: 'spectrum', position: pos(8, 4) },
        // 4: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(7, 3) },
        // 5: Blend color
        { definitionId: 'blend', position: pos(6, 2), parameters: { mode: 2, opacity: 90 } },
        // 6: Extract R
        { definitionId: 'extract-rgb', position: pos(5, 0), parameters: { channel: 0 } },
        // 7: Extract G
        { definitionId: 'extract-rgb', position: pos(5, 2), parameters: { channel: 1 } },
        // 8: Extract B
        { definitionId: 'extract-rgb', position: pos(5, 4), parameters: { channel: 2 } },
        // 9: Offset R
        { definitionId: 'offset', position: pos(4, 0), parameters: { offsetX: 0.02, offsetY: -0.01 } },
        // 10: Wave G
        { definitionId: 'wave', position: pos(4, 2), parameters: { ampX: 0.01, ampY: 0.01, freqX: 4, freqY: 4, type: 0 } },
        // 11: Twirl B
        { definitionId: 'twirl', position: pos(4, 4), parameters: { strength: 0.3, radius: 1.2 } },
        // 12: Levels R
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 5, inWhite: 90, gamma: 1.2 } },
        // 13: Noise distortion G
        { definitionId: 'noise-distortion', position: pos(3, 2), parameters: { distortion: 8, scale: 6, octaves: 2 } },
        // 14: Spherize B
        { definitionId: 'spherize', position: pos(3, 4), parameters: { strength: 25 } },
        // 15: Assemble RGB
        { definitionId: 'assemble-rgb', position: pos(2, 2) },
        // 16: Sharpen
        { definitionId: 'sharpen', position: pos(1, 1), parameters: { amount: 35 } },
        // 17: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: 3, contrast: 15 } },
        // 18: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 0, saturation: 20, lightness: 0 } },
        // 19: Blur on one channel for soft focus
        { definitionId: 'blur', position: pos(4, 3), parameters: { radius: 2 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 4, 'elevation'),
        e(3, 'out', 4, 'gradient'),
        e(2, 'out', 5, 'foreground'),
        e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'),
        e(5, 'out', 7, 'source'),
        e(5, 'out', 8, 'source'),
        e(6, 'out', 9, 'source'),
        e(7, 'out', 10, 'source'),
        e(8, 'out', 11, 'source'),
        e(9, 'out', 12, 'source'),
        e(10, 'out', 19, 'source'),
        e(19, 'out', 13, 'source'),
        e(11, 'out', 14, 'source'),
        e(12, 'out', 15, 'red'),
        e(13, 'out', 15, 'green'),
        e(14, 'out', 15, 'blue'),
        e(15, 'out', 16, 'source'),
        e(16, 'out', 17, 'source'),
        e(17, 'out', 18, 'source'),
        e(18, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Phase Shift
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Phase Shift',
    description: 'Multiple wave nodes with offset parameters blended and vortexed',
    category: 'Experimental',
    tags: ['wave', 'phase', 'vortex', 'interference', 'moire'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 5, octaves: 4, roughness: 0.5, contrast: 8 } },
        // 1: Wave A - sine horizontal
        { definitionId: 'wave', position: pos(5, 0), parameters: { ampX: 0.12, ampY: 0.03, freqX: 6, freqY: 2, type: 0 } },
        // 2: Wave B - square vertical
        { definitionId: 'wave', position: pos(5, 1), parameters: { ampX: 0.02, ampY: 0.1, freqX: 1, freqY: 8, type: 1 } },
        // 3: Perlin second
        { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 10, octaves: 3, roughness: 0.4, seed: 17 } },
        // 4: Wave C - triangle
        { definitionId: 'wave', position: pos(5, 2), parameters: { ampX: 0.06, ampY: 0.06, freqX: 10, freqY: 10, type: 2 } },
        // 5: Blend A + B (screen)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 3, opacity: 70 } },
        // 6: Blend AB + C (add)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 1, opacity: 55 } },
        // 7: Offset for phase shift
        { definitionId: 'offset', position: pos(3, 0), parameters: { offsetX: 0.25, offsetY: 0.15 } },
        // 8: Blend offset + unshifted (difference)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 5, opacity: 80 } },
        // 9: Vortex
        { definitionId: 'vortex', position: pos(2, 1), parameters: { strength: 1.5 } },
        // 10: Levels
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 80, gamma: 1.4 } },
        // 11: Spectrum
        { definitionId: 'spectrum', position: pos(3, 3) },
        // 12: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 13: Blend color (overlay)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 4, opacity: 65 } },
        // 14: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 30, saturation: 15, lightness: 5 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(0, 'out', 2, 'source'),
        e(3, 'out', 4, 'source'),
        e(1, 'out', 5, 'foreground'),
        e(2, 'out', 5, 'background'),
        e(5, 'out', 6, 'foreground'),
        e(4, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'),
        e(7, 'out', 8, 'foreground'),
        e(6, 'out', 8, 'background'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 12, 'elevation'),
        e(11, 'out', 12, 'gradient'),
        e(10, 'out', 13, 'foreground'),
        e(12, 'out', 13, 'background'),
        e(13, 'out', 14, 'source'),
        e(14, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Entropy Field
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Entropy Field',
    description: '4 different noise types blended then noise-distorted through polar',
    category: 'Experimental',
    tags: ['entropy', 'noise', 'polar', 'distortion', 'chaos'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin
        { definitionId: 'perlin-noise', position: pos(8, 0), parameters: { scale: 6, octaves: 5, roughness: 0.6, contrast: 10 } },
        // 1: Cells
        { definitionId: 'cells-noise', position: pos(8, 1), parameters: { scale: 10, formula: 1, octaves: 3 } },
        // 2: Blocks
        { definitionId: 'blocks-noise', position: pos(8, 2), parameters: { scale: 8, octaves: 4, roughness: 0.5 } },
        // 3: Pyramids
        { definitionId: 'pyramids-noise', position: pos(8, 3), parameters: { scale: 12, octaves: 3 } },
        // 4: Blend perlin + cells (overlay)
        { definitionId: 'blend', position: pos(7, 0), parameters: { mode: 4, opacity: 60 } },
        // 5: Blend blocks + pyramids (add)
        { definitionId: 'blend', position: pos(7, 2), parameters: { mode: 1, opacity: 55 } },
        // 6: Blend pair1 + pair2 (screen)
        { definitionId: 'blend', position: pos(6, 1), parameters: { mode: 3, opacity: 70 } },
        // 7: Noise distortion heavy
        { definitionId: 'noise-distortion', position: pos(5, 0), parameters: { distortion: 50, scale: 5, octaves: 5 } },
        // 8: Noise distortion second pass
        { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 30, scale: 10, octaves: 3 } },
        // 9: Polar coordinates
        { definitionId: 'polar-coordinates', position: pos(3, 0), parameters: { mode: 0 } },
        // 10: Kaleidoscope
        { definitionId: 'kaleidoscope', position: pos(3, 1), parameters: { segments: 6 } },
        // 11: Blend polar + kaleidoscope (difference)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 5, opacity: 50 } },
        // 12: Levels
        { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 15, inWhite: 88, gamma: 1.3 } },
        // 13: Perlin for color variation
        { definitionId: 'perlin-noise', position: pos(5, 3), parameters: { scale: 3, octaves: 2, roughness: 0.4, seed: 88 } },
        // 14: Gradient-3-color vivid
        { definitionId: 'gradient-3-color', position: pos(5, 4), parameters: { color1: [0.1, 0.0, 0.3, 1], color2: [0.0, 0.7, 0.5, 1], color3: [1.0, 0.6, 0.0, 1], angle: 45 } },
        // 15: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(4, 3) },
        // 16: Blend color
        { definitionId: 'blend', position: pos(3, 2), parameters: { mode: 4, opacity: 70 } },
        // 17: Mask with noise shape
        { definitionId: 'mask', position: pos(2, 2) },
        // 18: Blend structure + colored
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 3, opacity: 65 } },
        // 19: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: 0, contrast: 22 } },
        // 20: Gamma
        { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 0.85 } },
      ];
      const edges = [
        e(0, 'out', 4, 'foreground'),
        e(1, 'out', 4, 'background'),
        e(2, 'out', 5, 'foreground'),
        e(3, 'out', 5, 'background'),
        e(4, 'out', 6, 'foreground'),
        e(5, 'out', 6, 'background'),
        e(6, 'out', 7, 'source'),
        e(7, 'out', 8, 'source'),
        e(8, 'out', 9, 'source'),
        e(8, 'out', 10, 'source'),
        e(9, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(11, 'out', 12, 'source'),
        e(13, 'out', 15, 'elevation'),
        e(14, 'out', 15, 'gradient'),
        e(12, 'out', 16, 'foreground'),
        e(15, 'out', 16, 'background'),
        e(16, 'out', 17, 'source'),
        e(12, 'out', 17, 'mask'),
        e(12, 'out', 18, 'foreground'),
        e(17, 'out', 18, 'background'),
        e(18, 'out', 19, 'source'),
        e(19, 'out', 20, 'source'),
        e(20, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Quantum Lattice
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Quantum Lattice',
    description: 'Checker + cells through math operations, kaleidoscope, spectrum color',
    category: 'Experimental',
    tags: ['checker', 'cells', 'kaleidoscope', 'lattice', 'math'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Checker grid
        { definitionId: 'checker', position: pos(6, 0), parameters: { scale: 8 } },
        // 1: Cells noise
        { definitionId: 'cells-noise', position: pos(6, 1), parameters: { scale: 8, formula: 2, octaves: 2 } },
        // 2: Multiply checker * cells
        { definitionId: 'math-multiply', position: pos(5, 0) },
        // 3: Perlin modulator
        { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 4, octaves: 3, roughness: 0.5 } },
        // 4: Add perlin
        { definitionId: 'math-add', position: pos(4, 0) },
        // 5: Fract for pattern
        { definitionId: 'math-fract', position: pos(4, 1) },
        // 6: Noise distortion
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 20, scale: 6, octaves: 3 } },
        // 7: Kaleidoscope
        { definitionId: 'kaleidoscope', position: pos(3, 1), parameters: { segments: 10 } },
        // 8: Blend kaleidoscope + straight (screen)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 60 } },
        // 9: Spectrum
        { definitionId: 'spectrum', position: pos(3, 3) },
        // 10: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 11: Blend color (overlay)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 4, opacity: 75 } },
        // 12: Levels
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 8, inWhite: 92, gamma: 1.1 } },
        // 13: Edge detect on lattice
        { definitionId: 'edge-detector', position: pos(5, 1) },
        // 14: Blend edges (add)
        { definitionId: 'blend', position: pos(4, 2), parameters: { mode: 1, opacity: 35 } },
        // 15: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: -20, saturation: 30, lightness: 0 } },
      ];
      const edges = [
        e(0, 'out', 2, 'a'),
        e(1, 'out', 2, 'b'),
        e(1, 'out', 13, 'source'),
        e(2, 'out', 4, 'a'),
        e(3, 'out', 4, 'b'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 14, 'foreground'),
        e(13, 'out', 14, 'background'),
        e(14, 'out', 6, 'source'),
        e(14, 'out', 7, 'source'),
        e(6, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(8, 'out', 10, 'elevation'),
        e(9, 'out', 10, 'gradient'),
        e(8, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(11, 'out', 12, 'source'),
        e(12, 'out', 15, 'source'),
        e(15, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // GRUNGE CATEGORY (14-25)
  // ═════════════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Rust & Decay
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Rust & Decay',
    description: 'Perlin + cells with levels crush and warm multiply tones',
    category: 'Grunge',
    tags: ['rust', 'decay', 'warm', 'grunge', 'metal'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 5, roughness: 0.7, contrast: 12 } },
        // 1: Cells noise
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 12, formula: 0, octaves: 3 } },
        // 2: Blend perlin + cells (multiply)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 70 } },
        // 3: Levels crush
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 25, inWhite: 75, gamma: 0.8 } },
        // 4: Perlin fine detail
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 25, octaves: 3, roughness: 0.5, seed: 44 } },
        // 5: Blend detail (overlay)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 4, opacity: 45 } },
        // 6: Gradient-3-color rust tones
        { definitionId: 'gradient-3-color', position: pos(4, 3), parameters: { color1: [0.15, 0.05, 0.0, 1], color2: [0.6, 0.25, 0.05, 1], color3: [0.85, 0.55, 0.2, 1], angle: 0 } },
        // 7: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(3, 2) },
        // 8: Blend color (multiply)
        { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 2, opacity: 85 } },
        // 9: Noise distortion subtle
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 10, scale: 8, octaves: 2 } },
        // 10: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: -5, contrast: 20 } },
        // 11: Hue-saturation warm
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 5, saturation: 15, lightness: -5 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(3, 'out', 5, 'foreground'),
        e(4, 'out', 5, 'background'),
        e(5, 'out', 9, 'source'),
        e(5, 'out', 7, 'elevation'),
        e(6, 'out', 7, 'gradient'),
        e(9, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(8, 'out', 10, 'source'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. Concrete Jungle
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Concrete Jungle',
    description: 'Blocks + perlin fine overlay blended, desaturated with levels',
    category: 'Grunge',
    tags: ['concrete', 'urban', 'blocks', 'desaturate', 'grey'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Blocks noise
        { definitionId: 'blocks-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 5, roughness: 0.6 } },
        // 1: Perlin fine
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 20, octaves: 4, roughness: 0.5, contrast: 5 } },
        // 2: Blend overlay
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 4, opacity: 55 } },
        // 3: Perlin medium
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 8, octaves: 3, roughness: 0.4, seed: 22 } },
        // 4: Blend add medium
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 30 } },
        // 5: Desaturate
        { definitionId: 'desaturate', position: pos(3, 1) },
        // 6: Levels
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 20, inWhite: 82, gamma: 0.9 } },
        // 7: Noise distortion subtle
        { definitionId: 'noise-distortion', position: pos(2, 1), parameters: { distortion: 8, scale: 10, octaves: 2 } },
        // 8: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: -8, contrast: 18 } },
        // 9: Gamma
        { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 0.85 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 4, 'foreground'),
        e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 7, 'source'),
        e(4, 'out', 6, 'source'),
        e(6, 'out', 8, 'source'),
        e(7, 'out', 8, 'source'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. Aged Paper
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Aged Paper',
    description: 'Perlin low freq + perlin high freq blended with warm color adjust',
    category: 'Grunge',
    tags: ['paper', 'aged', 'vintage', 'warm', 'parchment'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin low frequency (large stains)
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 3, octaves: 4, roughness: 0.6, contrast: 6 } },
        // 1: Perlin high frequency (fiber texture)
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 30, octaves: 3, roughness: 0.4, seed: 19 } },
        // 2: Blend low + high (softLight)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 8, opacity: 60 } },
        // 3: Cells very fine (paper grain)
        { definitionId: 'cells-noise', position: pos(5, 2), parameters: { scale: 40, formula: 0, octaves: 1 } },
        // 4: Blend grain (add subtle)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 20 } },
        // 5: Levels to lighten
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 5, inWhite: 70, gamma: 1.6 } },
        // 6: Gradient-3-color warm paper tones
        { definitionId: 'gradient-3-color', position: pos(3, 2), parameters: { color1: [0.75, 0.65, 0.5, 1], color2: [0.9, 0.82, 0.7, 1], color3: [0.95, 0.9, 0.8, 1], angle: 0 } },
        // 7: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 1) },
        // 8: Blend color (multiply)
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 2, opacity: 90 } },
        // 9: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { brightness: 10, contrast: -5 } },
        // 10: Hue-saturation subtle warmth
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 8, saturation: -10, lightness: 5 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 4, 'foreground'),
        e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 7, 'elevation'),
        e(6, 'out', 7, 'gradient'),
        e(5, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. Street Grit
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Street Grit',
    description: 'Blocks + checker + noise distortion through threshold and overlay',
    category: 'Grunge',
    tags: ['street', 'grit', 'urban', 'dirty', 'rough'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Blocks noise
        { definitionId: 'blocks-noise', position: pos(5, 0), parameters: { scale: 10, octaves: 5, roughness: 0.6 } },
        // 1: Checker
        { definitionId: 'checker', position: pos(5, 1), parameters: { scale: 16 } },
        // 2: Blend blocks + checker (overlay)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 4, opacity: 45 } },
        // 3: Noise distortion
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 35, scale: 8, octaves: 4 } },
        // 4: Perlin detail
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 15, octaves: 4, roughness: 0.5, seed: 66 } },
        // 5: Threshold
        { definitionId: 'threshold', position: pos(4, 2), parameters: { threshold: 55 } },
        // 6: Blend threshold detail (overlay)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 4, opacity: 50 } },
        // 7: Perlin large stains
        { definitionId: 'perlin-noise', position: pos(4, 3), parameters: { scale: 4, octaves: 3, roughness: 0.5, contrast: 8, seed: 77 } },
        // 8: Blend stains (multiply)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 40 } },
        // 9: Desaturate
        { definitionId: 'desaturate', position: pos(2, 1) },
        // 10: Levels gritty
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 30, inWhite: 78, gamma: 0.75 } },
        // 11: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -10, contrast: 25 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(4, 'out', 5, 'source'),
        e(3, 'out', 6, 'foreground'),
        e(5, 'out', 6, 'background'),
        e(6, 'out', 8, 'foreground'),
        e(7, 'out', 8, 'background'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. Worn Metal
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Worn Metal',
    description: 'Cells + perlin multiplied with cold hue-shifted levels',
    category: 'Grunge',
    tags: ['metal', 'worn', 'cold', 'industrial', 'steel'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Cells noise (scratches)
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 15, formula: 1, octaves: 3, roughness: 0.6 } },
        // 1: Perlin (surface variation)
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 5, roughness: 0.5, contrast: 10 } },
        // 2: Multiply
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 75 } },
        // 3: Perlin fine detail
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 25, octaves: 3, roughness: 0.4, seed: 38 } },
        // 4: Blend detail (add)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 30 } },
        // 5: Levels metallic
        { definitionId: 'levels', position: pos(3, 1), parameters: { inBlack: 15, inWhite: 85, gamma: 0.85 } },
        // 6: Edge detect for scratches
        { definitionId: 'edge-detector', position: pos(4, 2) },
        // 7: Blend edges (screen)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 25 } },
        // 8: Gradient-3-color cold metal
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.15, 0.15, 0.2, 1], color2: [0.45, 0.48, 0.55, 1], color3: [0.7, 0.72, 0.78, 1], angle: 0 } },
        // 9: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 10: Blend color (multiply)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 2, opacity: 85 } },
        // 11: Hue-saturation cold
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -10, saturation: -15, lightness: 0 } },
        // 12: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -3, contrast: 15 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 4, 'foreground'),
        e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(0, 'out', 6, 'source'),
        e(5, 'out', 7, 'foreground'),
        e(6, 'out', 7, 'background'),
        e(7, 'out', 9, 'elevation'),
        e(8, 'out', 9, 'gradient'),
        e(7, 'out', 10, 'foreground'),
        e(9, 'out', 10, 'background'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', 12, 'source'),
        e(12, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 19. Weathered Wood
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Weathered Wood',
    description: 'Wave + perlin horizontal grain with noise distortion and warm tones',
    category: 'Grunge',
    tags: ['wood', 'weathered', 'grain', 'warm', 'natural'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin horizontal stretch
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 6, roughness: 0.65, contrast: 8 } },
        // 1: Scale horizontally for wood grain
        { definitionId: 'scale', position: pos(4, 0), parameters: { scaleX: 4.0, scaleY: 1.0 } },
        // 2: Wave for grain lines
        { definitionId: 'wave', position: pos(3, 0), parameters: { ampX: 0.02, ampY: 0.0, freqX: 15, freqY: 1, type: 0 } },
        // 3: Perlin fine knots
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 12, octaves: 3, roughness: 0.5, seed: 50 } },
        // 4: Noise distortion
        { definitionId: 'noise-distortion', position: pos(4, 1), parameters: { distortion: 15, scale: 6, octaves: 3 } },
        // 5: Blend grain + knots (overlay)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 4, opacity: 50 } },
        // 6: Levels
        { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 18, inWhite: 82, gamma: 0.9 } },
        // 7: Gradient-3-color wood tones
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.2, 0.12, 0.05, 1], color2: [0.5, 0.32, 0.15, 1], color3: [0.7, 0.5, 0.28, 1], angle: 0 } },
        // 8: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 9: Blend color (multiply)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 2, opacity: 90 } },
        // 10: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 5, saturation: 10, lightness: -5 } },
        // 11: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -3, contrast: 12 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 2, 'source'),
        e(3, 'out', 4, 'source'),
        e(2, 'out', 5, 'foreground'),
        e(4, 'out', 5, 'background'),
        e(5, 'out', 6, 'source'),
        e(6, 'out', 8, 'elevation'),
        e(7, 'out', 8, 'gradient'),
        e(6, 'out', 9, 'foreground'),
        e(8, 'out', 9, 'background'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 20. Peeling Paint
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Peeling Paint',
    description: 'Cells threshold masked with perlin and color overlay',
    category: 'Grunge',
    tags: ['paint', 'peeling', 'decay', 'mask', 'texture'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Cells (paint chip shapes)
        { definitionId: 'cells-noise', position: pos(6, 0), parameters: { scale: 8, formula: 0, octaves: 3, roughness: 0.5 } },
        // 1: Threshold (crisp paint edges)
        { definitionId: 'threshold', position: pos(5, 0), parameters: { threshold: 50 } },
        // 2: Perlin (erosion pattern)
        { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 5, octaves: 4, roughness: 0.6, contrast: 10 } },
        // 3: Noise distortion on threshold
        { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 20, scale: 6, octaves: 3 } },
        // 4: Perlin underneath texture
        { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 15, octaves: 3, roughness: 0.4, seed: 61 } },
        // 5: Gradient-3-color paint color
        { definitionId: 'gradient-3-color', position: pos(5, 3), parameters: { color1: [0.2, 0.35, 0.5, 1], color2: [0.3, 0.55, 0.65, 1], color3: [0.5, 0.7, 0.75, 1], angle: 45 } },
        // 6: Gradient-elevation paint surface
        { definitionId: 'gradient-elevation', position: pos(4, 2) },
        // 7: Gradient-3-color base wall color
        { definitionId: 'gradient-3-color', position: pos(5, 4), parameters: { color1: [0.6, 0.55, 0.45, 1], color2: [0.7, 0.65, 0.55, 1], color3: [0.8, 0.75, 0.65, 1], angle: 90 } },
        // 8: Gradient-elevation base
        { definitionId: 'gradient-elevation', position: pos(4, 3) },
        // 9: Mask paint over base
        { definitionId: 'mask', position: pos(3, 1) },
        // 10: Edge detect for paint edge highlight
        { definitionId: 'edge-detector', position: pos(4, 1) },
        // 11: Blend edge highlight (screen)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 3, opacity: 30 } },
        // 12: Perlin dirt overlay
        { definitionId: 'perlin-noise', position: pos(3, 3), parameters: { scale: 8, octaves: 3, roughness: 0.5, seed: 72, contrast: 5 } },
        // 13: Blend dirt (multiply)
        { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 2, opacity: 25 } },
        // 14: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 0), parameters: { brightness: -2, contrast: 12 } },
        // 15: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 0, saturation: -10, lightness: 0 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'source'),
        e(3, 'out', 10, 'source'),
        e(2, 'out', 6, 'elevation'),
        e(5, 'out', 6, 'gradient'),
        e(4, 'out', 8, 'elevation'),
        e(7, 'out', 8, 'gradient'),
        e(6, 'out', 9, 'source'),
        e(3, 'out', 9, 'mask'),
        e(8, 'out', 9, 'background'),
        e(9, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(11, 'out', 13, 'foreground'),
        e(12, 'out', 13, 'background'),
        e(13, 'out', 14, 'source'),
        e(14, 'out', 15, 'source'),
        e(15, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 21. Industrial Grime
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Industrial Grime',
    description: 'Multiple noise layers with heavy distortion, desaturated and contrasty',
    category: 'Grunge',
    tags: ['industrial', 'grime', 'dirty', 'dark', 'factory'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 5, octaves: 6, roughness: 0.7, contrast: 15 } },
        // 1: Blocks noise
        { definitionId: 'blocks-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 4, roughness: 0.5 } },
        // 2: Cells grime
        { definitionId: 'cells-noise', position: pos(5, 2), parameters: { scale: 18, formula: 1, octaves: 2 } },
        // 3: Blend perlin + blocks (overlay)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 4, opacity: 65 } },
        // 4: Blend result + cells (multiply)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 2, opacity: 50 } },
        // 5: Noise distortion heavy
        { definitionId: 'noise-distortion', position: pos(3, 1), parameters: { distortion: 45, scale: 5, octaves: 5 } },
        // 6: Noise distortion second
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 25, scale: 10, octaves: 3 } },
        // 7: Desaturate
        { definitionId: 'desaturate', position: pos(2, 1) },
        // 8: Levels dark and contrasty
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 35, inWhite: 70, gamma: 0.7 } },
        // 9: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { brightness: -15, contrast: 30 } },
        // 10: Gamma dark
        { definitionId: 'gamma', position: pos(0, 0), parameters: { gamma: 0.75 } },
        // 11: Perlin stain
        { definitionId: 'perlin-noise', position: pos(4, 2), parameters: { scale: 3, octaves: 2, roughness: 0.4, seed: 55 } },
        // 12: Blend stain (multiply)
        { definitionId: 'blend', position: pos(3, 2), parameters: { mode: 2, opacity: 35 } },
      ];
      const edges = [
        e(0, 'out', 3, 'foreground'),
        e(1, 'out', 3, 'background'),
        e(3, 'out', 4, 'foreground'),
        e(2, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 12, 'foreground'),
        e(11, 'out', 12, 'background'),
        e(12, 'out', 6, 'source'),
        e(6, 'out', 7, 'source'),
        e(7, 'out', 8, 'source'),
        e(8, 'out', 9, 'source'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 22. Acid Wash
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Acid Wash',
    description: 'Perlin + wave through spherize, inverted with green hue shift',
    category: 'Grunge',
    tags: ['acid', 'wash', 'green', 'chemical', 'corrosion'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Perlin base
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 7, octaves: 5, roughness: 0.6, contrast: 10 } },
        // 1: Wave distortion
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.06, ampY: 0.04, freqX: 6, freqY: 8, type: 0 } },
        // 2: Cells texture
        { definitionId: 'cells-noise', position: pos(5, 1), parameters: { scale: 12, formula: 0, octaves: 2 } },
        // 3: Blend wave + cells (screen)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 3, opacity: 45 } },
        // 4: Spherize
        { definitionId: 'spherize', position: pos(3, 1), parameters: { strength: 40 } },
        // 5: Invert
        { definitionId: 'invert', position: pos(2, 0) },
        // 6: Levels
        { definitionId: 'levels', position: pos(2, 1), parameters: { inBlack: 12, inWhite: 88, gamma: 1.2 } },
        // 7: Gradient-3-color acid green
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.05, 0.15, 0.05, 1], color2: [0.2, 0.6, 0.15, 1], color3: [0.6, 0.9, 0.3, 1], angle: 0 } },
        // 8: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 9: Blend color (overlay)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 4, opacity: 80 } },
        // 10: Hue-saturation green shift
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 25, saturation: 20, lightness: -5 } },
        // 11: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 18 } },
      ];
      const edges = [
        e(0, 'out', 1, 'source'),
        e(1, 'out', 3, 'foreground'),
        e(2, 'out', 3, 'background'),
        e(3, 'out', 4, 'source'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'),
        e(6, 'out', 8, 'elevation'),
        e(7, 'out', 8, 'gradient'),
        e(6, 'out', 9, 'foreground'),
        e(8, 'out', 9, 'background'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 23. Distressed Leather
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Distressed Leather',
    description: 'Cells voronoi + perlin multiplied with warm levels',
    category: 'Grunge',
    tags: ['leather', 'distressed', 'warm', 'organic', 'hide'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Cells (leather grain - euclidean)
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 14, formula: 0, octaves: 3, roughness: 0.55 } },
        // 1: Perlin (wear pattern)
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 6, octaves: 4, roughness: 0.6, contrast: 8 } },
        // 2: Multiply cells * perlin
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 2, opacity: 75 } },
        // 3: Perlin fine crackle
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 30, octaves: 2, roughness: 0.3, seed: 48 } },
        // 4: Blend fine detail (softLight)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 8, opacity: 40 } },
        // 5: Noise distortion subtle
        { definitionId: 'noise-distortion', position: pos(3, 1), parameters: { distortion: 10, scale: 8, octaves: 2 } },
        // 6: Levels warm
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 0.9 } },
        // 7: Gradient-3-color leather
        { definitionId: 'gradient-3-color', position: pos(3, 3), parameters: { color1: [0.18, 0.1, 0.05, 1], color2: [0.4, 0.25, 0.12, 1], color3: [0.6, 0.42, 0.22, 1], angle: 0 } },
        // 8: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(2, 2) },
        // 9: Blend color (multiply)
        { definitionId: 'blend', position: pos(1, 1), parameters: { mode: 2, opacity: 90 } },
        // 10: Hue-saturation warm
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 3, saturation: 12, lightness: -3 } },
        // 11: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -2, contrast: 15 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 4, 'foreground'),
        e(3, 'out', 4, 'background'),
        e(4, 'out', 5, 'source'),
        e(5, 'out', 6, 'source'),
        e(6, 'out', 8, 'elevation'),
        e(7, 'out', 8, 'gradient'),
        e(6, 'out', 9, 'foreground'),
        e(8, 'out', 9, 'background'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 11, 'source'),
        e(11, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 24. Urban Decay
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Urban Decay',
    description: 'Bricks + perlin erosion with edge detect overlaid on noise',
    category: 'Grunge',
    tags: ['urban', 'decay', 'bricks', 'erosion', 'abandoned'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Bricks
        { definitionId: 'bricks', position: pos(6, 0), parameters: { columns: 6, rows: 12, bevel: 40 } },
        // 1: Perlin erosion
        { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 8, octaves: 5, roughness: 0.65, contrast: 12 } },
        // 2: Blend bricks eroded (multiply)
        { definitionId: 'blend', position: pos(5, 0), parameters: { mode: 2, opacity: 70 } },
        // 3: Noise distortion (aging)
        { definitionId: 'noise-distortion', position: pos(4, 0), parameters: { distortion: 18, scale: 6, octaves: 3 } },
        // 4: Edge detect (mortar lines)
        { definitionId: 'edge-detector', position: pos(5, 1) },
        // 5: Perlin stain
        { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 4, octaves: 3, roughness: 0.5, seed: 83 } },
        // 6: Cells fine grime
        { definitionId: 'cells-noise', position: pos(6, 3), parameters: { scale: 22, formula: 1, octaves: 2 } },
        // 7: Blend stain + grime (overlay)
        { definitionId: 'blend', position: pos(5, 2), parameters: { mode: 4, opacity: 45 } },
        // 8: Blend distorted bricks + edges (screen)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 3, opacity: 35 } },
        // 9: Blend bricks + grime (overlay)
        { definitionId: 'blend', position: pos(3, 1), parameters: { mode: 4, opacity: 50 } },
        // 10: Levels grungy
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 25, inWhite: 80, gamma: 0.85 } },
        // 11: Gradient-3-color brick tones
        { definitionId: 'gradient-3-color', position: pos(4, 3), parameters: { color1: [0.2, 0.12, 0.08, 1], color2: [0.55, 0.35, 0.2, 1], color3: [0.7, 0.55, 0.4, 1], angle: 0 } },
        // 12: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(3, 2) },
        // 13: Blend color (multiply)
        { definitionId: 'blend', position: pos(2, 1), parameters: { mode: 2, opacity: 85 } },
        // 14: Hue-saturation
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -3, saturation: -8, lightness: -5 } },
        // 15: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -5, contrast: 18 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 3, 'source'),
        e(2, 'out', 4, 'source'),
        e(5, 'out', 7, 'foreground'),
        e(6, 'out', 7, 'background'),
        e(3, 'out', 8, 'foreground'),
        e(4, 'out', 8, 'background'),
        e(8, 'out', 9, 'foreground'),
        e(7, 'out', 9, 'background'),
        e(9, 'out', 10, 'source'),
        e(10, 'out', 12, 'elevation'),
        e(11, 'out', 12, 'gradient'),
        e(10, 'out', 13, 'foreground'),
        e(12, 'out', 13, 'background'),
        e(13, 'out', 14, 'source'),
        e(14, 'out', 15, 'source'),
        e(15, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 25. Oxidized Copper
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Oxidized Copper',
    description: 'Cells + perlin with green/teal hue shift and multiply blend',
    category: 'Grunge',
    tags: ['copper', 'oxidized', 'verdigris', 'teal', 'patina'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0: Cells (patina pattern)
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 10, formula: 0, octaves: 3, roughness: 0.6 } },
        // 1: Perlin (surface variation)
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 6, octaves: 5, roughness: 0.55, contrast: 10 } },
        // 2: Blend cells + perlin (overlay)
        { definitionId: 'blend', position: pos(4, 0), parameters: { mode: 4, opacity: 65 } },
        // 3: Perlin fine detail
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 20, octaves: 3, roughness: 0.4, seed: 92 } },
        // 4: Blend fine (add subtle)
        { definitionId: 'blend', position: pos(3, 0), parameters: { mode: 1, opacity: 25 } },
        // 5: Gradient-3-color copper patina
        { definitionId: 'gradient-3-color', position: pos(4, 3), parameters: { color1: [0.45, 0.28, 0.12, 1], color2: [0.2, 0.5, 0.45, 1], color3: [0.35, 0.7, 0.6, 1], angle: 0 } },
        // 6: Gradient-elevation
        { definitionId: 'gradient-elevation', position: pos(3, 2) },
        // 7: Perlin mask (patina distribution)
        { definitionId: 'perlin-noise', position: pos(5, 3), parameters: { scale: 4, octaves: 3, roughness: 0.5, seed: 15 } },
        // 8: Gradient-3-color copper base
        { definitionId: 'gradient-3-color', position: pos(4, 4), parameters: { color1: [0.5, 0.3, 0.15, 1], color2: [0.65, 0.42, 0.2, 1], color3: [0.75, 0.55, 0.3, 1], angle: 0 } },
        // 9: Gradient-elevation copper
        { definitionId: 'gradient-elevation', position: pos(3, 3) },
        // 10: Mask patina over copper
        { definitionId: 'mask', position: pos(2, 1) },
        // 11: Blend structure (multiply)
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 2, opacity: 80 } },
        // 12: Noise distortion subtle
        { definitionId: 'noise-distortion', position: pos(2, 2), parameters: { distortion: 8, scale: 8, octaves: 2 } },
        // 13: Levels
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 10, inWhite: 88, gamma: 0.95 } },
        // 14: Hue-saturation teal
        { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: 10, saturation: 18, lightness: -3 } },
        // 15: Brightness-contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -2, contrast: 12 } },
      ];
      const edges = [
        e(0, 'out', 2, 'foreground'),
        e(1, 'out', 2, 'background'),
        e(2, 'out', 4, 'foreground'),
        e(3, 'out', 4, 'background'),
        e(4, 'out', 6, 'elevation'),
        e(5, 'out', 6, 'gradient'),
        e(4, 'out', 9, 'elevation'),
        e(8, 'out', 9, 'gradient'),
        e(6, 'out', 10, 'source'),
        e(7, 'out', 10, 'mask'),
        e(9, 'out', 10, 'background'),
        e(4, 'out', 11, 'foreground'),
        e(10, 'out', 11, 'background'),
        e(11, 'out', 12, 'source'),
        e(12, 'out', 13, 'source'),
        e(13, 'out', 14, 'source'),
        e(14, 'out', 15, 'source'),
        e(15, 'out', -1, 'source'),
      ];
      return graph(nodes, edges);
    },
  },
];
