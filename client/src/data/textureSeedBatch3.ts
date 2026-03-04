/**
 * Texture Seed Batch 3 - Cosmic, Abstract & Geometric procedural textures.
 * 25 pre-built node graphs for one-click texture generation.
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

export const textureSeedBatch3: TextureSeed[] = [
  // ─────────────────────────────────────────────────────────────
  // COSMIC (1–10)
  // ─────────────────────────────────────────────────────────────

  // 1. Starfield
  {
    name: 'Starfield',
    description: 'Fine cells thresholded to bright stars with a soft glow, screen-blended onto deep space',
    category: 'Cosmic',
    tags: ['stars', 'space', 'night', 'glow', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - fine cells for star positions
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 40, formula: 0, octaves: 1 } },
        // 1 - threshold to isolate bright points
        { definitionId: 'threshold', position: pos(4, 0), parameters: { threshold: 85 } },
        // 2 - invert so stars are white on black
        { definitionId: 'invert', position: pos(3, 0) },
        // 3 - blur for glow
        { definitionId: 'blur', position: pos(2, 0), parameters: { radius: 4 } },
        // 4 - second perlin layer for dim background nebula
        { definitionId: 'perlin-noise', position: pos(3, 1), parameters: { scale: 8, octaves: 4, contrast: 5 } },
        // 5 - darken background nebula
        { definitionId: 'brightness-contrast', position: pos(2, 1), parameters: { brightness: -60, contrast: 20 } },
        // 6 - screen blend glow stars onto dark bg
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 100 } },
        // 7 - levels to deepen blacks
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 90, gamma: 1.2 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(4, 'out', 5, 'source'),
          e(3, 'out', 6, 'foreground'),
          e(5, 'out', 6, 'background'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 2. Galaxy Spiral
  {
    name: 'Galaxy Spiral',
    description: 'Perlin noise twisted by a strong vortex, mapped through polar coordinates and a spectrum gradient',
    category: 'Cosmic',
    tags: ['galaxy', 'spiral', 'space', 'vortex', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 6, octaves: 5, roughness: 0.6, contrast: 8 } },
        // 1 - vortex twist
        { definitionId: 'vortex', position: pos(5, 0), parameters: { strength: 3.5 } },
        // 2 - polar coordinates for spiral feel
        { definitionId: 'polar-coordinates', position: pos(4, 0), parameters: { mode: 0 } },
        // 3 - levels to shape contrast
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 15, inWhite: 85, gamma: 1.4 } },
        // 4 - spectrum for color mapping
        { definitionId: 'spectrum', position: pos(3, 1), parameters: { angle: 0, repeat: 1 } },
        // 5 - gradient-elevation maps grayscale spiral to spectrum
        { definitionId: 'gradient-elevation', position: pos(2, 0) },
        // 6 - cells for star overlay
        { definitionId: 'cells-noise', position: pos(3, 2), parameters: { scale: 45, formula: 0, octaves: 1 } },
        // 7 - threshold for pinpoint stars
        { definitionId: 'threshold', position: pos(2, 2), parameters: { threshold: 90 } },
        // 8 - invert
        { definitionId: 'invert', position: pos(1, 2) },
        // 9 - screen blend stars over galaxy
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 3, opacity: 60 } },
        // 10 - blur glow
        { definitionId: 'blur', position: pos(0, 0), parameters: { radius: 2 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 5, 'elevation'),
          e(4, 'out', 5, 'gradient'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', 8, 'source'),
          e(5, 'out', 9, 'background'),
          e(8, 'out', 9, 'foreground'),
          e(9, 'out', 10, 'source'),
          e(10, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 3. Solar Flare
  {
    name: 'Solar Flare',
    description: 'Perlin noise twisted and waved to create fiery tendrils with warm hue shift and glow overlay',
    category: 'Cosmic',
    tags: ['sun', 'fire', 'flare', 'warm', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 5, octaves: 6, roughness: 0.7, contrast: 10 } },
        // 1 - twirl for flame distortion
        { definitionId: 'twirl', position: pos(5, 0), parameters: { strength: 2.5, radius: 1.2 } },
        // 2 - wave for organic movement
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0.08, ampY: 0.05, freqX: 4, freqY: 6 } },
        // 3 - levels to push highlights
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 20, inWhite: 80, gamma: 1.6 } },
        // 4 - spectrum for flame colors
        { definitionId: 'spectrum', position: pos(3, 1), parameters: { angle: 0, repeat: 1 } },
        // 5 - gradient elevation to map to fire spectrum
        { definitionId: 'gradient-elevation', position: pos(2, 0) },
        // 6 - warm hue shift
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -30, saturation: 40, lightness: 10 } },
        // 7 - blur for glow
        { definitionId: 'blur', position: pos(2, 2), parameters: { radius: 6 } },
        // 8 - screen blend glow
        { definitionId: 'blend', position: pos(0, 0), parameters: { mode: 3, opacity: 50 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 5, 'elevation'),
          e(4, 'out', 5, 'gradient'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(6, 'out', 8, 'background'),
          e(7, 'out', 8, 'foreground'),
          e(8, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 4. Asteroid Surface
  {
    name: 'Asteroid Surface',
    description: 'Cells and perlin multiplied together with noise distortion for a rocky cratered surface',
    category: 'Cosmic',
    tags: ['asteroid', 'rock', 'crater', 'surface', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells for crater shapes
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 12, formula: 0, octaves: 3 } },
        // 1 - perlin for surface variation
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 5, roughness: 0.5, contrast: 6 } },
        // 2 - multiply for terrain detail
        { definitionId: 'math-multiply', position: pos(4, 0) },
        // 3 - noise distort for natural roughness
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 15, scale: 6, octaves: 4 } },
        // 4 - levels for grey moon-like surface
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 20, inWhite: 75, gamma: 0.8 } },
        // 5 - desaturate to ensure greyscale
        { definitionId: 'desaturate', position: pos(1, 0) },
        // 6 - brightness-contrast final punch
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: -10, contrast: 25 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 2, 'a'),
          e(1, 'out', 2, 'b'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 5. Aurora Borealis
  {
    name: 'Aurora Borealis',
    description: 'Stretched perlin with wave distortion, polar mapping and spectrum colors creating flowing northern lights',
    category: 'Cosmic',
    tags: ['aurora', 'northern-lights', 'sky', 'polar', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - horizontally stretched perlin for curtain shapes
        { definitionId: 'perlin-noise', position: pos(7, 0), parameters: { scale: 3, octaves: 6, roughness: 0.65, contrast: 8 } },
        // 1 - wave for flowing motion
        { definitionId: 'wave', position: pos(6, 0), parameters: { ampX: 0.12, ampY: 0.02, freqX: 3, freqY: 8 } },
        // 2 - second perlin for detail
        { definitionId: 'perlin-noise', position: pos(7, 1), parameters: { scale: 10, octaves: 4, roughness: 0.4, contrast: 4, seed: 42 } },
        // 3 - add detail noise
        { definitionId: 'math-add', position: pos(5, 0) },
        // 4 - polar coordinates for curved arch shape
        { definitionId: 'polar-coordinates', position: pos(4, 0), parameters: { mode: 0 } },
        // 5 - levels to separate bands
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 25, inWhite: 70, gamma: 1.5 } },
        // 6 - spectrum generator for aurora colors
        { definitionId: 'spectrum', position: pos(3, 1), parameters: { angle: 90, repeat: 1 } },
        // 7 - elevation gradient mapping
        { definitionId: 'gradient-elevation', position: pos(2, 0) },
        // 8 - hue shift towards greens/purples
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 120, saturation: 30, lightness: 5 } },
        // 9 - blur for atmospheric softness
        { definitionId: 'blur', position: pos(0, 0), parameters: { radius: 3 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 3, 'a'),
          e(2, 'out', 3, 'b'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 7, 'elevation'),
          e(6, 'out', 7, 'gradient'),
          e(7, 'out', 8, 'source'),
          e(8, 'out', 9, 'source'),
          e(9, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 6. Dark Matter
  {
    name: 'Dark Matter',
    description: 'Multiple perlin layers multiplied and inverted with extreme levels for eerie dark cosmic patterns',
    category: 'Cosmic',
    tags: ['dark', 'matter', 'void', 'deep', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - first perlin layer
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 5, roughness: 0.6, contrast: 12 } },
        // 1 - second perlin layer offset seed
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 8, octaves: 4, roughness: 0.5, contrast: 8, seed: 77 } },
        // 2 - third perlin layer fine detail
        { definitionId: 'perlin-noise', position: pos(5, 2), parameters: { scale: 16, octaves: 3, roughness: 0.4, contrast: 5, seed: 200 } },
        // 3 - multiply first two
        { definitionId: 'math-multiply', position: pos(4, 0) },
        // 4 - multiply in third
        { definitionId: 'math-multiply', position: pos(3, 0) },
        // 5 - invert
        { definitionId: 'invert', position: pos(2, 0) },
        // 6 - extreme levels
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 40, inWhite: 60, gamma: 0.5 } },
        // 7 - cool tint via hue-saturation
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: -150, saturation: 30, lightness: -15 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 3, 'a'),
          e(1, 'out', 3, 'b'),
          e(3, 'out', 4, 'a'),
          e(2, 'out', 4, 'b'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 7. Supernova
  {
    name: 'Supernova',
    description: 'Cells and perlin combined through polar coordinates and kaleidoscope with spectrum coloring and bloom',
    category: 'Cosmic',
    tags: ['supernova', 'explosion', 'burst', 'star', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells base
        { definitionId: 'cells-noise', position: pos(7, 0), parameters: { scale: 8, formula: 1, octaves: 2 } },
        // 1 - perlin for energy tendrils
        { definitionId: 'perlin-noise', position: pos(7, 1), parameters: { scale: 5, octaves: 5, roughness: 0.7, contrast: 10 } },
        // 2 - add together
        { definitionId: 'math-add', position: pos(6, 0) },
        // 3 - polar coordinates for radial burst
        { definitionId: 'polar-coordinates', position: pos(5, 0), parameters: { mode: 0 } },
        // 4 - kaleidoscope for symmetry
        { definitionId: 'kaleidoscope', position: pos(4, 0), parameters: { segments: 8 } },
        // 5 - spherize for center concentration
        { definitionId: 'spherize', position: pos(3, 0), parameters: { strength: 60 } },
        // 6 - levels
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 15, inWhite: 75, gamma: 1.3 } },
        // 7 - spectrum
        { definitionId: 'spectrum', position: pos(3, 1), parameters: { angle: 0, repeat: 2 } },
        // 8 - elevation gradient for coloring
        { definitionId: 'gradient-elevation', position: pos(1, 0) },
        // 9 - bloom via blur
        { definitionId: 'blur', position: pos(1, 2), parameters: { radius: 8 } },
        // 10 - screen blend bloom
        { definitionId: 'blend', position: pos(0, 0), parameters: { mode: 3, opacity: 45 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 2, 'a'),
          e(1, 'out', 2, 'b'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 8, 'elevation'),
          e(7, 'out', 8, 'gradient'),
          e(8, 'out', 9, 'source'),
          e(8, 'out', 10, 'background'),
          e(9, 'out', 10, 'foreground'),
          e(10, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 8. Comet Trail
  {
    name: 'Comet Trail',
    description: 'Perlin noise with diagonal motion blur and warm levels for a streaking comet trail',
    category: 'Cosmic',
    tags: ['comet', 'trail', 'streak', 'motion', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 6, octaves: 4, roughness: 0.5, contrast: 10 } },
        // 1 - motion blur diagonal
        { definitionId: 'motion-blur', position: pos(4, 0), parameters: { radius: 40, angle: 35, directional: 100 } },
        // 2 - levels to push contrast
        { definitionId: 'levels', position: pos(3, 0), parameters: { inBlack: 30, inWhite: 70, gamma: 1.8 } },
        // 3 - spectrum for warm trail colors
        { definitionId: 'spectrum', position: pos(3, 1), parameters: { angle: 0, repeat: 1 } },
        // 4 - elevation gradient
        { definitionId: 'gradient-elevation', position: pos(2, 0) },
        // 5 - hue shift warm
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -40, saturation: 50, lightness: 5 } },
        // 6 - brightness boost
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: 15 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 4, 'elevation'),
          e(3, 'out', 4, 'gradient'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 9. Nebula Dust
  {
    name: 'Nebula Dust',
    description: 'Three perlin noise layers assembled as R/G/B channels with blur and brightness for colorful nebula clouds',
    category: 'Cosmic',
    tags: ['nebula', 'dust', 'cloud', 'colorful', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - red channel perlin
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 5, octaves: 5, roughness: 0.6, contrast: 8, seed: 10 } },
        // 1 - green channel perlin
        { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 6, octaves: 5, roughness: 0.55, contrast: 7, seed: 50 } },
        // 2 - blue channel perlin
        { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 7, octaves: 5, roughness: 0.5, contrast: 9, seed: 100 } },
        // 3 - noise distort red channel
        { definitionId: 'noise-distortion', position: pos(5, 0), parameters: { distortion: 20, scale: 4, octaves: 3 } },
        // 4 - noise distort green channel
        { definitionId: 'noise-distortion', position: pos(5, 1), parameters: { distortion: 25, scale: 5, octaves: 3, seed: 33 } },
        // 5 - noise distort blue channel
        { definitionId: 'noise-distortion', position: pos(5, 2), parameters: { distortion: 18, scale: 3, octaves: 3, seed: 66 } },
        // 6 - assemble RGB
        { definitionId: 'assemble-rgb', position: pos(4, 1) },
        // 7 - blur for softness
        { definitionId: 'blur', position: pos(3, 1), parameters: { radius: 5 } },
        // 8 - brightness boost
        { definitionId: 'brightness-contrast', position: pos(2, 1), parameters: { brightness: 15, contrast: 20 } },
        // 9 - hue shift for nebula tones
        { definitionId: 'hue-saturation', position: pos(1, 1), parameters: { hue: 0, saturation: 25, lightness: 5 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 3, 'source'),
          e(1, 'out', 4, 'source'),
          e(2, 'out', 5, 'source'),
          e(3, 'out', 6, 'red'),
          e(4, 'out', 6, 'green'),
          e(5, 'out', 6, 'blue'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', 8, 'source'),
          e(8, 'out', 9, 'source'),
          e(9, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 10. Event Horizon
  {
    name: 'Event Horizon',
    description: 'Perlin noise spherized and extremely twirled with polar coordinates and dark crushed levels',
    category: 'Cosmic',
    tags: ['black-hole', 'event-horizon', 'void', 'dark', 'cosmic'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 5, octaves: 6, roughness: 0.7, contrast: 12 } },
        // 1 - spherize for gravitational lensing
        { definitionId: 'spherize', position: pos(4, 0), parameters: { strength: 80 } },
        // 2 - extreme twirl
        { definitionId: 'twirl', position: pos(3, 0), parameters: { strength: 4.5, radius: 1.5 } },
        // 3 - polar coordinates
        { definitionId: 'polar-coordinates', position: pos(2, 0), parameters: { mode: 0 } },
        // 4 - dark levels
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 45, inWhite: 65, gamma: 0.4 } },
        // 5 - cool tint
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: -170, saturation: 20, lightness: -20 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', -1, 'source'),
        ],
      };
    },
  },

  // ─────────────────────────────────────────────────────────────
  // ABSTRACT (11–18)
  // ─────────────────────────────────────────────────────────────

  // 11. Color Soup
  {
    name: 'Color Soup',
    description: 'Three perlin noises with noise distortion assembled as RGB channels then vortexed into swirling color',
    category: 'Abstract',
    tags: ['color', 'soup', 'swirl', 'rgb', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - perlin R
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 4, octaves: 4, roughness: 0.6, contrast: 8, seed: 5 } },
        // 1 - perlin G
        { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 5, octaves: 4, roughness: 0.5, contrast: 7, seed: 30 } },
        // 2 - perlin B
        { definitionId: 'perlin-noise', position: pos(6, 2), parameters: { scale: 6, octaves: 4, roughness: 0.55, contrast: 9, seed: 80 } },
        // 3 - distort R
        { definitionId: 'noise-distortion', position: pos(5, 0), parameters: { distortion: 30, scale: 5, octaves: 3 } },
        // 4 - distort G
        { definitionId: 'noise-distortion', position: pos(5, 1), parameters: { distortion: 35, scale: 4, octaves: 3, seed: 15 } },
        // 5 - distort B
        { definitionId: 'noise-distortion', position: pos(5, 2), parameters: { distortion: 25, scale: 6, octaves: 3, seed: 45 } },
        // 6 - assemble
        { definitionId: 'assemble-rgb', position: pos(4, 1) },
        // 7 - vortex swirl
        { definitionId: 'vortex', position: pos(3, 1), parameters: { strength: 2.5 } },
        // 8 - saturation boost
        { definitionId: 'hue-saturation', position: pos(2, 1), parameters: { hue: 0, saturation: 40, lightness: 5 } },
        // 9 - brightness contrast
        { definitionId: 'brightness-contrast', position: pos(1, 1), parameters: { brightness: 5, contrast: 15 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 3, 'source'),
          e(1, 'out', 4, 'source'),
          e(2, 'out', 5, 'source'),
          e(3, 'out', 6, 'red'),
          e(4, 'out', 6, 'green'),
          e(5, 'out', 6, 'blue'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', 8, 'source'),
          e(8, 'out', 9, 'source'),
          e(9, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 12. Ink Blot
  {
    name: 'Ink Blot',
    description: 'Perlin noise double-thresholded with blur and edge detection for Rorschach-like ink blot patterns',
    category: 'Abstract',
    tags: ['ink', 'blot', 'rorschach', 'threshold', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 4, octaves: 5, roughness: 0.6, contrast: 10 } },
        // 1 - first threshold
        { definitionId: 'threshold', position: pos(4, 0), parameters: { threshold: 50 } },
        // 2 - blur to soften
        { definitionId: 'blur', position: pos(3, 0), parameters: { radius: 4 } },
        // 3 - second threshold for crisp edges
        { definitionId: 'threshold', position: pos(2, 0), parameters: { threshold: 45 } },
        // 4 - edge detect
        { definitionId: 'edge-detector', position: pos(1, 0), parameters: { formula: 0, radius: 1.5 } },
        // 5 - invert for white on black
        { definitionId: 'invert', position: pos(0, 0) },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 13. Liquid Metal
  {
    name: 'Liquid Metal',
    description: 'Cells noise spherized with refraction and blur for a molten mercury or liquid metal look',
    category: 'Abstract',
    tags: ['metal', 'liquid', 'mercury', 'chrome', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells base
        { definitionId: 'cells-noise', position: pos(6, 0), parameters: { scale: 10, formula: 0, octaves: 2 } },
        // 1 - spherize for bubble distortion
        { definitionId: 'spherize', position: pos(5, 0), parameters: { strength: 70 } },
        // 2 - perlin for height map
        { definitionId: 'perlin-noise', position: pos(5, 1), parameters: { scale: 6, octaves: 3, roughness: 0.4, contrast: 6 } },
        // 3 - refraction for liquid displacement
        { definitionId: 'refraction', position: pos(4, 0), parameters: { refraction: 45 } },
        // 4 - blur for smooth metal
        { definitionId: 'blur', position: pos(3, 0), parameters: { radius: 3 } },
        // 5 - high contrast for metallic reflections
        { definitionId: 'brightness-contrast', position: pos(2, 0), parameters: { brightness: 10, contrast: 50 } },
        // 6 - levels for silver tones
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 5, inWhite: 95, gamma: 1.8 } },
        // 7 - slight desaturate for silver
        { definitionId: 'desaturate', position: pos(0, 0) },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 3, 'source'),
          e(2, 'out', 3, 'height'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 14. Acid Dream
  {
    name: 'Acid Dream',
    description: 'Perlin noise kaleidoscoped with spectrum coloring, noise distortion and wild hue shifting',
    category: 'Abstract',
    tags: ['acid', 'psychedelic', 'trippy', 'kaleidoscope', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - perlin base
        { definitionId: 'perlin-noise', position: pos(6, 0), parameters: { scale: 4, octaves: 5, roughness: 0.7, contrast: 12 } },
        // 1 - kaleidoscope
        { definitionId: 'kaleidoscope', position: pos(5, 0), parameters: { segments: 6 } },
        // 2 - levels
        { definitionId: 'levels', position: pos(4, 0), parameters: { inBlack: 10, inWhite: 85, gamma: 1.2 } },
        // 3 - spectrum
        { definitionId: 'spectrum', position: pos(4, 1), parameters: { angle: 45, repeat: 3 } },
        // 4 - elevation gradient
        { definitionId: 'gradient-elevation', position: pos(3, 0) },
        // 5 - noise distort for trippy warping
        { definitionId: 'noise-distortion', position: pos(2, 0), parameters: { distortion: 40, scale: 3, octaves: 4 } },
        // 6 - hue shift
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: 90, saturation: 60, lightness: 10 } },
        // 7 - sharpen
        { definitionId: 'sharpen', position: pos(0, 0), parameters: { amount: 40 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 4, 'elevation'),
          e(3, 'out', 4, 'gradient'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 15. Shattered Mirror
  {
    name: 'Shattered Mirror',
    description: 'Cells kaleidoscoped with barrel distortion and edge detection for broken glass reflections',
    category: 'Abstract',
    tags: ['shattered', 'mirror', 'glass', 'broken', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells base for shard shapes
        { definitionId: 'cells-noise', position: pos(6, 0), parameters: { scale: 12, formula: 1, octaves: 1 } },
        // 1 - kaleidoscope for mirror symmetry
        { definitionId: 'kaleidoscope', position: pos(5, 0), parameters: { segments: 4 } },
        // 2 - barrel distort for lens warp
        { definitionId: 'barrel-distort', position: pos(4, 0), parameters: { strength: 0.6 } },
        // 3 - edge detect for shard outlines
        { definitionId: 'edge-detector', position: pos(3, 0), parameters: { formula: 0, radius: 2 } },
        // 4 - invert for white lines on dark
        { definitionId: 'invert', position: pos(2, 0) },
        // 5 - perlin for reflection variation
        { definitionId: 'perlin-noise', position: pos(3, 1), parameters: { scale: 3, octaves: 3, contrast: 6 } },
        // 6 - blend edge lines over perlin
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 2, opacity: 80 } },
        // 7 - levels
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 10, inWhite: 90, gamma: 1.0 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(5, 'out', 6, 'background'),
          e(4, 'out', 6, 'foreground'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 16. Oil Slick
  {
    name: 'Oil Slick',
    description: 'Perlin noise split into RGB channels with individual hue shifts and reassembled for thin-film iridescence',
    category: 'Abstract',
    tags: ['oil', 'iridescent', 'rainbow', 'film', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin
        { definitionId: 'perlin-noise', position: pos(7, 1), parameters: { scale: 6, octaves: 6, roughness: 0.65, contrast: 10 } },
        // 1 - noise distort for organic flow
        { definitionId: 'noise-distortion', position: pos(6, 1), parameters: { distortion: 30, scale: 4, octaves: 4 } },
        // 2 - extract R
        { definitionId: 'extract-rgb', position: pos(5, 0), parameters: { channel: 0 } },
        // 3 - extract G
        { definitionId: 'extract-rgb', position: pos(5, 1), parameters: { channel: 1 } },
        // 4 - extract B
        { definitionId: 'extract-rgb', position: pos(5, 2), parameters: { channel: 2 } },
        // 5 - hue shift R channel
        { definitionId: 'hue-saturation', position: pos(4, 0), parameters: { hue: 60, saturation: 50, lightness: 5 } },
        // 6 - hue shift G channel
        { definitionId: 'hue-saturation', position: pos(4, 1), parameters: { hue: -60, saturation: 50, lightness: 0 } },
        // 7 - hue shift B channel
        { definitionId: 'hue-saturation', position: pos(4, 2), parameters: { hue: 150, saturation: 50, lightness: -5 } },
        // 8 - extract R from shifted R
        { definitionId: 'extract-rgb', position: pos(3, 0), parameters: { channel: 0 } },
        // 9 - extract G from shifted G
        { definitionId: 'extract-rgb', position: pos(3, 1), parameters: { channel: 1 } },
        // 10 - extract B from shifted B
        { definitionId: 'extract-rgb', position: pos(3, 2), parameters: { channel: 2 } },
        // 11 - reassemble
        { definitionId: 'assemble-rgb', position: pos(2, 1) },
        // 12 - blur for smooth iridescence
        { definitionId: 'blur', position: pos(1, 1), parameters: { radius: 2 } },
        // 13 - saturation boost
        { definitionId: 'hue-saturation', position: pos(0, 1), parameters: { hue: 0, saturation: 35, lightness: 5 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(1, 'out', 3, 'source'),
          e(1, 'out', 4, 'source'),
          e(2, 'out', 5, 'source'),
          e(3, 'out', 6, 'source'),
          e(4, 'out', 7, 'source'),
          e(5, 'out', 8, 'source'),
          e(6, 'out', 9, 'source'),
          e(7, 'out', 10, 'source'),
          e(8, 'out', 11, 'red'),
          e(9, 'out', 11, 'green'),
          e(10, 'out', 11, 'blue'),
          e(11, 'out', 12, 'source'),
          e(12, 'out', 13, 'source'),
          e(13, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 17. Topographic Map
  {
    name: 'Topographic Map',
    description: 'Perlin noise quantized through multiple threshold levels with edge detection overlay for contour lines',
    category: 'Abstract',
    tags: ['topographic', 'contour', 'map', 'lines', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin terrain
        { definitionId: 'perlin-noise', position: pos(6, 1), parameters: { scale: 4, octaves: 5, roughness: 0.55, contrast: 8 } },
        // 1 - threshold low
        { definitionId: 'threshold', position: pos(5, 0), parameters: { threshold: 30 } },
        // 2 - threshold mid
        { definitionId: 'threshold', position: pos(5, 1), parameters: { threshold: 50 } },
        // 3 - threshold high
        { definitionId: 'threshold', position: pos(5, 2), parameters: { threshold: 70 } },
        // 4 - add low and mid
        { definitionId: 'math-add', position: pos(4, 0) },
        // 5 - add in high
        { definitionId: 'math-add', position: pos(3, 0) },
        // 6 - levels to normalize stacked thresholds
        { definitionId: 'levels', position: pos(2, 0), parameters: { inBlack: 0, inWhite: 100, gamma: 1.0 } },
        // 7 - edge detect for contour lines
        { definitionId: 'edge-detector', position: pos(2, 2), parameters: { formula: 0, radius: 1 } },
        // 8 - invert edges to get dark lines
        { definitionId: 'invert', position: pos(1, 2) },
        // 9 - overlay blend contour lines onto elevation
        { definitionId: 'blend', position: pos(1, 0), parameters: { mode: 2, opacity: 90 } },
        // 10 - hue-saturation for earthy tone
        { definitionId: 'hue-saturation', position: pos(0, 0), parameters: { hue: 30, saturation: 20, lightness: 5 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(0, 'out', 2, 'source'),
          e(0, 'out', 3, 'source'),
          e(1, 'out', 4, 'a'),
          e(2, 'out', 4, 'b'),
          e(4, 'out', 5, 'a'),
          e(3, 'out', 5, 'b'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', 8, 'source'),
          e(6, 'out', 9, 'background'),
          e(8, 'out', 9, 'foreground'),
          e(9, 'out', 10, 'source'),
          e(10, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 18. Electromagnetic
  {
    name: 'Electromagnetic',
    description: 'UV coordinates processed through math operations and fract with spectrum coloring and noise distortion',
    category: 'Abstract',
    tags: ['electromagnetic', 'field', 'wave', 'energy', 'abstract'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - UV coordinates
        { definitionId: 'uv-coordinates', position: pos(7, 0), parameters: { tilingX: 4, tilingY: 4 } },
        // 1 - extract X component
        { definitionId: 'math-split-vec2', position: pos(6, 0), parameters: { channel: 0 } },
        // 2 - extract Y component
        { definitionId: 'math-split-vec2', position: pos(6, 1), parameters: { channel: 1 } },
        // 3 - multiply X*Y for interference
        { definitionId: 'math-multiply', position: pos(5, 0) },
        // 4 - sine wave on X
        { definitionId: 'math-sine', position: pos(5, 1) },
        // 5 - add interference and sine
        { definitionId: 'math-add', position: pos(4, 0) },
        // 6 - fract for repeating bands
        { definitionId: 'math-fract', position: pos(3, 0) },
        // 7 - spectrum
        { definitionId: 'spectrum', position: pos(3, 1), parameters: { angle: 0, repeat: 2 } },
        // 8 - elevation gradient for color mapping
        { definitionId: 'gradient-elevation', position: pos(2, 0) },
        // 9 - noise distort for organic feel
        { definitionId: 'noise-distortion', position: pos(1, 0), parameters: { distortion: 15, scale: 5, octaves: 3 } },
        // 10 - brightness
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 10, contrast: 20 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(0, 'out', 2, 'source'),
          e(1, 'out', 3, 'a'),
          e(2, 'out', 3, 'b'),
          e(1, 'out', 4, 'source'),
          e(3, 'out', 5, 'a'),
          e(4, 'out', 5, 'b'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 8, 'elevation'),
          e(7, 'out', 8, 'gradient'),
          e(8, 'out', 9, 'source'),
          e(9, 'out', 10, 'source'),
          e(10, 'out', -1, 'source'),
        ],
      };
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GEOMETRIC (19–25)
  // ─────────────────────────────────────────────────────────────

  // 19. Hex Grid
  {
    name: 'Hex Grid',
    description: 'Cells with 6-segment kaleidoscope and edge detection for clean hexagonal grid lines',
    category: 'Geometric',
    tags: ['hex', 'grid', 'hexagonal', 'honeycomb', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells for hex shapes
        { definitionId: 'cells-noise', position: pos(4, 0), parameters: { scale: 8, formula: 0, octaves: 1 } },
        // 1 - kaleidoscope 6 for hex symmetry
        { definitionId: 'kaleidoscope', position: pos(3, 0), parameters: { segments: 6 } },
        // 2 - edge detect for clean lines
        { definitionId: 'edge-detector', position: pos(2, 0), parameters: { formula: 0, radius: 1.5 } },
        // 3 - levels for clean crisp lines
        { definitionId: 'levels', position: pos(1, 0), parameters: { inBlack: 5, inWhite: 50, gamma: 0.6 } },
        // 4 - invert for dark lines on white
        { definitionId: 'invert', position: pos(0, 0) },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 20. Plaid Pattern
  {
    name: 'Plaid Pattern',
    description: 'Horizontal and vertical wave patterns multiplied with a checker overlay and hue shift for plaid fabric',
    category: 'Geometric',
    tags: ['plaid', 'tartan', 'fabric', 'pattern', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - base perlin for texture
        { definitionId: 'perlin-noise', position: pos(5, 0), parameters: { scale: 2, octaves: 2, contrast: 4 } },
        // 1 - wave X (horizontal stripes)
        { definitionId: 'wave', position: pos(4, 0), parameters: { ampX: 0, ampY: 0.15, freqX: 1, freqY: 8 } },
        // 2 - wave Y (vertical stripes)
        { definitionId: 'wave', position: pos(4, 1), parameters: { ampX: 0.15, ampY: 0, freqX: 6, freqY: 1 } },
        // 3 - multiply wave patterns
        { definitionId: 'math-multiply', position: pos(3, 0) },
        // 4 - checker for grid overlay
        { definitionId: 'checker', position: pos(3, 1), parameters: { scale: 8 } },
        // 5 - overlay blend checker on waves
        { definitionId: 'blend', position: pos(2, 0), parameters: { mode: 4, opacity: 60 } },
        // 6 - hue shift for color
        { definitionId: 'hue-saturation', position: pos(1, 0), parameters: { hue: -20, saturation: 40, lightness: 0 } },
        // 7 - brightness contrast
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 5, contrast: 20 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(0, 'out', 2, 'source'),
          e(1, 'out', 3, 'a'),
          e(2, 'out', 3, 'b'),
          e(3, 'out', 5, 'foreground'),
          e(4, 'out', 5, 'background'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 21. Op Art Circles
  {
    name: 'Op Art Circles',
    description: 'Cells spherized and kaleidoscoped with threshold for bold black and white optical art circles',
    category: 'Geometric',
    tags: ['op-art', 'circles', 'optical', 'illusion', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells
        { definitionId: 'cells-noise', position: pos(4, 0), parameters: { scale: 6, formula: 0, octaves: 1 } },
        // 1 - spherize for circular distortion
        { definitionId: 'spherize', position: pos(3, 0), parameters: { strength: 75 } },
        // 2 - kaleidoscope for symmetry
        { definitionId: 'kaleidoscope', position: pos(2, 0), parameters: { segments: 8 } },
        // 3 - threshold for bold B&W
        { definitionId: 'threshold', position: pos(1, 0), parameters: { threshold: 50 } },
        // 4 - invert for variation
        { definitionId: 'invert', position: pos(0, 0) },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 22. Tiled Mosaic
  {
    name: 'Tiled Mosaic',
    description: 'Tiles and cells combined then pixelated and sharpened with vibrant color overlay for mosaic art',
    category: 'Geometric',
    tags: ['mosaic', 'tiles', 'pixel', 'colorful', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - tiles base
        { definitionId: 'tiles', position: pos(4, 0), parameters: { repeatH: 10, repeatV: 10, bevelWidth: 15, mortarWidth: 3 } },
        // 1 - cells for color variation
        { definitionId: 'cells-noise', position: pos(4, 1), parameters: { scale: 10, formula: 0, octaves: 2 } },
        // 2 - multiply for texture
        { definitionId: 'math-multiply', position: pos(3, 0) },
        // 3 - pixelate for mosaic feel
        { definitionId: 'pixelate', position: pos(2, 0), parameters: { scale: 12 } },
        // 4 - sharpen for crisp edges
        { definitionId: 'sharpen', position: pos(1, 0), parameters: { amount: 60 } },
        // 5 - brightness contrast for vibrant look
        { definitionId: 'brightness-contrast', position: pos(0, 0), parameters: { brightness: 15, contrast: 30 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 2, 'a'),
          e(1, 'out', 2, 'b'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 23. Diamond Lattice
  {
    name: 'Diamond Lattice',
    description: 'Checker rotated 45 degrees with edge detection and subtle blur for a diamond wire lattice pattern',
    category: 'Geometric',
    tags: ['diamond', 'lattice', 'wire', 'grid', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - checker base
        { definitionId: 'checker', position: pos(4, 0), parameters: { scale: 8 } },
        // 1 - rotate 45 degrees for diamonds
        { definitionId: 'rotate', position: pos(3, 0), parameters: { angle: 45 } },
        // 2 - edge detect for lattice lines
        { definitionId: 'edge-detector', position: pos(2, 0), parameters: { formula: 0, radius: 1 } },
        // 3 - slight blur for anti-aliasing
        { definitionId: 'blur', position: pos(1, 0), parameters: { radius: 1 } },
        // 4 - levels for clean look
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 60, gamma: 0.8 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 24. Spirograph
  {
    name: 'Spirograph',
    description: 'UV coordinates processed through math operations, polar, vortex and kaleidoscope for intricate spirograph patterns',
    category: 'Geometric',
    tags: ['spirograph', 'spiral', 'math', 'intricate', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - UV coordinates
        { definitionId: 'uv-coordinates', position: pos(7, 0), parameters: { tilingX: 3, tilingY: 3 } },
        // 1 - split X
        { definitionId: 'math-split-vec2', position: pos(6, 0), parameters: { channel: 0 } },
        // 2 - split Y
        { definitionId: 'math-split-vec2', position: pos(6, 1), parameters: { channel: 1 } },
        // 3 - sine of X
        { definitionId: 'math-sine', position: pos(5, 0) },
        // 4 - cosine of Y
        { definitionId: 'math-cosine', position: pos(5, 1) },
        // 5 - add sin+cos for interference
        { definitionId: 'math-add', position: pos(4, 0) },
        // 6 - fract for repeating bands
        { definitionId: 'math-fract', position: pos(3, 0) },
        // 7 - polar coordinates
        { definitionId: 'polar-coordinates', position: pos(2, 0), parameters: { mode: 0 } },
        // 8 - vortex
        { definitionId: 'vortex', position: pos(1, 0), parameters: { strength: 2.0 } },
        // 9 - kaleidoscope
        { definitionId: 'kaleidoscope', position: pos(0, 0), parameters: { segments: 12 } },
        // 10 - spectrum for color
        { definitionId: 'spectrum', position: pos(1, 2), parameters: { angle: 0, repeat: 3 } },
        // 11 - elevation gradient for coloring
        { definitionId: 'gradient-elevation', position: pos(0, 1) },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(0, 'out', 2, 'source'),
          e(1, 'out', 3, 'source'),
          e(2, 'out', 4, 'source'),
          e(3, 'out', 5, 'a'),
          e(4, 'out', 5, 'b'),
          e(5, 'out', 6, 'source'),
          e(6, 'out', 7, 'source'),
          e(7, 'out', 8, 'source'),
          e(8, 'out', 9, 'source'),
          e(9, 'out', 11, 'elevation'),
          e(10, 'out', 11, 'gradient'),
          e(11, 'out', -1, 'source'),
        ],
      };
    },
  },

  // 25. Tessellation
  {
    name: 'Tessellation',
    description: 'Cells kaleidoscoped with slight noise distortion, thresholded and edge detected for tessellated tile patterns',
    category: 'Geometric',
    tags: ['tessellation', 'pattern', 'tiles', 'repeat', 'geometric'],
    build: () => {
      const nodes: TemplateNode[] = [
        // 0 - cells base
        { definitionId: 'cells-noise', position: pos(5, 0), parameters: { scale: 10, formula: 2, octaves: 1 } },
        // 1 - kaleidoscope for tessellation symmetry
        { definitionId: 'kaleidoscope', position: pos(4, 0), parameters: { segments: 6 } },
        // 2 - slight noise distortion for organic variation
        { definitionId: 'noise-distortion', position: pos(3, 0), parameters: { distortion: 8, scale: 6, octaves: 2 } },
        // 3 - threshold for clean shapes
        { definitionId: 'threshold', position: pos(2, 0), parameters: { threshold: 50 } },
        // 4 - edge detect for outlines
        { definitionId: 'edge-detector', position: pos(1, 0), parameters: { formula: 0, radius: 1 } },
        // 5 - levels for final cleanup
        { definitionId: 'levels', position: pos(0, 0), parameters: { inBlack: 5, inWhite: 50, gamma: 0.7 } },
      ];
      return {
        nodes,
        edges: [
          e(0, 'out', 1, 'source'),
          e(1, 'out', 2, 'source'),
          e(2, 'out', 3, 'source'),
          e(3, 'out', 4, 'source'),
          e(4, 'out', 5, 'source'),
          e(5, 'out', -1, 'source'),
        ],
      };
    },
  },
];
