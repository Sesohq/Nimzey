/**
 * textureSeedBatch2 - 25 procedural texture definitions (Batch 2).
 * Simple-Complex natural textures (1-15) + Noise Overlay textures (16-25).
 * Each build() returns a TemplateBuildResult with 8-25 nodes.
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
const e = (
  sourceIdx: number,
  sourcePort: string,
  targetIdx: number,
  targetPort: string,
): TemplateEdge => ({ sourceIdx, sourcePort, targetIdx, targetPort });
const n = (
  definitionId: string,
  position: { x: number; y: number },
  parameters?: Record<string, number | string | boolean | number[]>,
): TemplateNode => ({ definitionId, position, ...(parameters && { parameters }) });

export const textureSeedBatch2: TextureSeed[] = [
  // ---------------------------------------------------------------------------
  // 1. Marble Veins
  // Perlin stretched horizontal + wave -> levels -> warm tones
  // ---------------------------------------------------------------------------
  {
    name: 'Marble Veins',
    description: 'Organic marble with flowing horizontal veins and warm tones',
    category: 'Organic',
    tags: ['marble', 'stone', 'organic', 'veins', 'warm'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 8, octaves: 6, roughness: 0.7, seed: 42 }),     // 0: base veins
        n('perlin-noise', pos(5, 1), { scale: 25, octaves: 4, roughness: 0.5, seed: 99 }),     // 1: fine detail
        n('wave', pos(4, 0), { ampX: 0.08, ampY: 0.02, freqX: 3, freqY: 8, type: 0 }),        // 2: stretch veins
        n('blend', pos(3, 0), { mode: 3, opacity: 35 }),                                       // 3: screen blend
        n('levels', pos(2, 0), { inBlack: 15, inWhite: 85, gamma: 1.4 }),                      // 4: vein contrast
        n('brightness-contrast', pos(1, 0), { brightness: 5, contrast: 20 }),                   // 5: punch
        n('hue-saturation', pos(1, 1), { hue: 25, saturation: 20, lightness: 5 }),              // 6: warm tones
        n('blur', pos(0, 0), { radius: 1 }),                                                    // 7: smooth feel
      ],
      edges: [
        e(0, 'out', 2, 'source'),        // Perlin -> Wave
        e(2, 'out', 3, 'foreground'),     // Wave -> Blend fg
        e(1, 'out', 3, 'background'),     // Detail -> Blend bg
        e(3, 'out', 4, 'source'),         // Blend -> Levels
        e(4, 'out', 5, 'source'),         // Levels -> B/C
        e(5, 'out', 6, 'source'),         // B/C -> Hue-Sat
        e(6, 'out', 7, 'source'),         // Hue-Sat -> Blur
        e(7, 'out', -1, 'source'),        // Blur -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 2. Brushed Steel
  // Perlin narrow + motion blur horizontal -> levels -> cold
  // ---------------------------------------------------------------------------
  {
    name: 'Brushed Steel',
    description: 'Directional brushed metal with cold blue-steel tones',
    category: 'Organic',
    tags: ['metal', 'steel', 'brushed', 'industrial', 'cold'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 30, octaves: 5, roughness: 0.6, seed: 17 }),     // 0: metal grain
        n('motion-blur', pos(4, 0), { angle: 0, radius: 12 }),                                  // 1: directional brush
        n('perlin-noise', pos(5, 1), { scale: 45, octaves: 3, roughness: 0.4, seed: 88 }),     // 2: micro-variation
        n('motion-blur', pos(4, 1), { angle: 0, radius: 8 }),                                   // 3: second brush
        n('blend', pos(3, 0), { mode: 1, opacity: 40 }),                                        // 4: add layers
        n('levels', pos(2, 0), { inBlack: 25, inWhite: 80, gamma: 0.9 }),                      // 5: metallic contrast
        n('brightness-contrast', pos(1, 0), { brightness: -5, contrast: 30 }),                   // 6: punch
        n('hue-saturation', pos(0, 0), { hue: -15, saturation: 12, lightness: -5 }),            // 7: cold steel
      ],
      edges: [
        e(0, 'out', 1, 'source'),        // Perlin1 -> MBlur1
        e(2, 'out', 3, 'source'),         // Perlin2 -> MBlur2
        e(1, 'out', 4, 'foreground'),     // MBlur1 -> Blend fg
        e(3, 'out', 4, 'background'),     // MBlur2 -> Blend bg
        e(4, 'out', 5, 'source'),         // Blend -> Levels
        e(5, 'out', 6, 'source'),         // Levels -> B/C
        e(6, 'out', 7, 'source'),         // B/C -> Hue-Sat
        e(7, 'out', -1, 'source'),        // Hue-Sat -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 3. Water Ripples
  // Cells + ripple + blur -> levels -> blue tint
  // ---------------------------------------------------------------------------
  {
    name: 'Water Ripples',
    description: 'Concentric water ripple effect with cool blue tones',
    category: 'Organic',
    tags: ['water', 'ripple', 'blue', 'liquid', 'organic'],
    build: () => ({
      nodes: [
        n('cells-noise', pos(5, 0), { scale: 12, formula: 0, octaves: 3, roughness: 0.5 }),    // 0: caustic base
        n('ripple', pos(4, 0), { amplitude: 0.05, frequency: 15, decay: 3 }),                   // 1: ripple distortion
        n('perlin-noise', pos(5, 1), { scale: 6, octaves: 4, roughness: 0.6, seed: 55 }),      // 2: organic variation
        n('blend', pos(3, 0), { mode: 3, opacity: 45 }),                                        // 3: screen blend
        n('blur', pos(2, 0), { radius: 3 }),                                                    // 4: softness
        n('levels', pos(1, 0), { inBlack: 10, inWhite: 90, gamma: 1.2 }),                      // 5: contrast
        n('hue-saturation', pos(1, 1), { hue: -120, saturation: 40, lightness: -10 }),          // 6: blue tint
        n('gamma', pos(0, 0), { gamma: 1.1 }),                                                  // 7: final brightness
      ],
      edges: [
        e(0, 'out', 1, 'source'),        // Cells -> Ripple
        e(1, 'out', 3, 'foreground'),     // Ripple -> Blend fg
        e(2, 'out', 3, 'background'),     // Perlin -> Blend bg
        e(3, 'out', 4, 'source'),         // Blend -> Blur
        e(4, 'out', 5, 'source'),         // Blur -> Levels
        e(5, 'out', 6, 'source'),         // Levels -> Hue-Sat
        e(6, 'out', 7, 'source'),         // Hue-Sat -> Gamma
        e(7, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 4. Sandstone
  // Perlin multi-octave + cells fine -> multiply blend -> warm
  // ---------------------------------------------------------------------------
  {
    name: 'Sandstone',
    description: 'Layered sedimentary sandstone with fine grain and warm earthy palette',
    category: 'Organic',
    tags: ['sandstone', 'stone', 'warm', 'earth', 'sediment'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(6, 0), { scale: 5, octaves: 8, roughness: 0.7, seed: 31 }),      // 0: geological layers
        n('wave', pos(5, 0), { ampX: 0.03, ampY: 0.01, freqX: 2, freqY: 12, type: 0 }),       // 1: sediment streaks
        n('cells-noise', pos(6, 1), { scale: 35, formula: 1, octaves: 2, roughness: 0.3 }),    // 2: grain texture
        n('perlin-noise', pos(6, 2), { scale: 15, octaves: 5, roughness: 0.5, seed: 67 }),     // 3: variation
        n('blend', pos(5, 1), { mode: 2, opacity: 60 }),                                        // 4: multiply cells+perlin
        n('blend', pos(4, 0), { mode: 2, opacity: 70 }),                                        // 5: multiply wave+grain
        n('levels', pos(3, 0), { inBlack: 10, inWhite: 80, gamma: 1.3 }),                      // 6: sandstone contrast
        n('brightness-contrast', pos(2, 0), { brightness: 12, contrast: 15 }),                   // 7: warm push
        n('hue-saturation', pos(1, 0), { hue: 30, saturation: 25, lightness: 5 }),              // 8: warm earth
        n('sharpen', pos(0, 0), { amount: 30 }),                                                 // 9: grain definition
      ],
      edges: [
        e(0, 'out', 1, 'source'),        // Perlin coarse -> Wave
        e(2, 'out', 4, 'foreground'),     // Cells -> Blend1 fg
        e(3, 'out', 4, 'background'),     // Perlin med -> Blend1 bg
        e(1, 'out', 5, 'foreground'),     // Wave -> Blend2 fg
        e(4, 'out', 5, 'background'),     // Grain blend -> Blend2 bg
        e(5, 'out', 6, 'source'),         // Blend2 -> Levels
        e(6, 'out', 7, 'source'),         // Levels -> B/C
        e(7, 'out', 8, 'source'),         // B/C -> Hue-Sat
        e(8, 'out', 9, 'source'),         // Hue-Sat -> Sharpen
        e(9, 'out', -1, 'source'),        // Sharpen -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 5. Mossy Rock
  // Perlin base + cells detail -> blend -> green hue shift
  // ---------------------------------------------------------------------------
  {
    name: 'Mossy Rock',
    description: 'Weathered rock surface with patches of green moss growth',
    category: 'Organic',
    tags: ['moss', 'rock', 'green', 'nature', 'weathered'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(6, 0), { scale: 8, octaves: 7, roughness: 0.65, seed: 22 }),     // 0: rock base
        n('cells-noise', pos(6, 1), { scale: 10, formula: 2, octaves: 3, roughness: 0.4 }),    // 1: rock cracks
        n('blend', pos(5, 0), { mode: 2, opacity: 55 }),                                        // 2: multiply rock+cracks
        n('perlin-noise', pos(6, 2), { scale: 12, octaves: 5, roughness: 0.8, seed: 44 }),     // 3: moss pattern
        n('threshold', pos(5, 2), { threshold: 55 }),                                            // 4: moss patches
        n('blur', pos(4, 2), { radius: 4 }),                                                    // 5: soft moss edges
        n('hue-saturation', pos(5, 1), { hue: 80, saturation: 50, lightness: -15 }),            // 6: green moss
        n('mask', pos(3, 0)),                                                                    // 7: mask moss onto rock
        n('levels', pos(2, 0), { inBlack: 12, inWhite: 88, gamma: 1.1 }),                      // 8: final contrast
        n('brightness-contrast', pos(1, 0), { brightness: -3, contrast: 18 }),                   // 9: punch
        n('sharpen', pos(0, 0), { amount: 40 }),                                                 // 10: rock detail
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Perlin rock -> Blend fg
        e(1, 'out', 2, 'background'),     // Cells cracks -> Blend bg
        e(2, 'out', 6, 'source'),         // Rock blend -> Hue-Sat (green)
        e(3, 'out', 4, 'source'),         // Moss perlin -> Threshold
        e(4, 'out', 5, 'source'),         // Threshold -> Blur
        e(6, 'out', 7, 'source'),         // Green rock -> Mask source
        e(5, 'out', 7, 'mask'),           // Blurred mask -> Mask mask
        e(2, 'out', 7, 'background'),     // Raw rock -> Mask background
        e(7, 'out', 8, 'source'),         // Mask -> Levels
        e(8, 'out', 9, 'source'),         // Levels -> B/C
        e(9, 'out', 10, 'source'),        // B/C -> Sharpen
        e(10, 'out', -1, 'source'),       // Sharpen -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 6. Frozen Glass
  // Cells + blur heavy + spherize -> levels -> cold blue
  // ---------------------------------------------------------------------------
  {
    name: 'Frozen Glass',
    description: 'Frosted glass surface with icy crystalline distortion',
    category: 'Organic',
    tags: ['ice', 'frost', 'glass', 'cold', 'blue', 'crystal'],
    build: () => ({
      nodes: [
        n('cells-noise', pos(5, 0), { scale: 18, formula: 0, octaves: 4, roughness: 0.5 }),    // 0: frost crystals
        n('blur', pos(4, 0), { radius: 6 }),                                                    // 1: heavy frost blur
        n('spherize', pos(3, 0), { strength: 40 }),                                              // 2: glass curvature
        n('perlin-noise', pos(5, 1), { scale: 20, octaves: 3, roughness: 0.3, seed: 77 }),     // 3: frost variation
        n('blend', pos(2, 0), { mode: 3, opacity: 30 }),                                        // 4: screen blend
        n('levels', pos(1, 0), { inBlack: 5, inWhite: 75, gamma: 1.5 }),                       // 5: icy contrast
        n('hue-saturation', pos(1, 1), { hue: -140, saturation: 35, lightness: 10 }),           // 6: cold blue
        n('gamma', pos(0, 0), { gamma: 1.2 }),                                                  // 7: brightness
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Cells -> Blur
        e(1, 'out', 2, 'source'),          // Blur -> Spherize
        e(2, 'out', 4, 'foreground'),      // Spherize -> Blend fg
        e(3, 'out', 4, 'background'),      // Perlin -> Blend bg
        e(4, 'out', 5, 'source'),          // Blend -> Levels
        e(5, 'out', 6, 'source'),          // Levels -> Hue-Sat
        e(6, 'out', 7, 'source'),          // Hue-Sat -> Gamma
        e(7, 'out', -1, 'source'),         // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 7. Silk Fabric
  // Wave multi-direction + blur -> levels -> soft contrast
  // ---------------------------------------------------------------------------
  {
    name: 'Silk Fabric',
    description: 'Smooth flowing silk with subtle directional sheen',
    category: 'Organic',
    tags: ['silk', 'fabric', 'cloth', 'soft', 'sheen'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 10, octaves: 4, roughness: 0.4, seed: 11 }),     // 0: fabric body
        n('wave', pos(4, 0), { ampX: 0.06, ampY: 0.0, freqX: 6, freqY: 1, type: 0 }),         // 1: horizontal folds
        n('perlin-noise', pos(5, 1), { scale: 14, octaves: 3, roughness: 0.35, seed: 33 }),    // 2: second layer
        n('wave', pos(4, 1), { ampX: 0.0, ampY: 0.05, freqX: 1, freqY: 8, type: 0 }),         // 3: vertical folds
        n('blend', pos(3, 0), { mode: 3, opacity: 50 }),                                        // 4: screen blend
        n('blur', pos(2, 0), { radius: 4 }),                                                    // 5: silk smoothness
        n('levels', pos(1, 0), { inBlack: 20, inWhite: 85, gamma: 1.3 }),                      // 6: soft contrast
        n('brightness-contrast', pos(0, 0), { brightness: 8, contrast: 10 }),                    // 7: gentle sheen
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Perlin1 -> WaveX
        e(2, 'out', 3, 'source'),          // Perlin2 -> WaveY
        e(1, 'out', 4, 'foreground'),      // WaveX -> Blend fg
        e(3, 'out', 4, 'background'),      // WaveY -> Blend bg
        e(4, 'out', 5, 'source'),          // Blend -> Blur
        e(5, 'out', 6, 'source'),          // Blur -> Levels
        e(6, 'out', 7, 'source'),          // Levels -> B/C
        e(7, 'out', -1, 'source'),         // B/C -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 8. Volcanic Ash
  // Perlin + blocks -> multiply -> dark levels -> warm undertones
  // ---------------------------------------------------------------------------
  {
    name: 'Volcanic Ash',
    description: 'Dark volcanic ash with blocky fractures and warm ember undertones',
    category: 'Organic',
    tags: ['volcanic', 'ash', 'dark', 'ember', 'fire', 'lava'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(6, 0), { scale: 7, octaves: 6, roughness: 0.7, seed: 66 }),      // 0: volcanic flow
        n('blocks-noise', pos(6, 1), { scale: 15, octaves: 4, roughness: 0.5 }),                // 1: fractured ash
        n('blend', pos(5, 0), { mode: 2, opacity: 75 }),                                        // 2: multiply ash
        n('perlin-noise', pos(6, 2), { scale: 4, octaves: 3, roughness: 0.6, seed: 13 }),      // 3: ember glow
        n('levels', pos(4, 0), { inBlack: 30, inWhite: 70, gamma: 0.7 }),                      // 4: crush dark
        n('hue-saturation', pos(5, 2), { hue: 15, saturation: 45, lightness: -25 }),            // 5: warm ember
        n('blend', pos(3, 0), { mode: 3, opacity: 25 }),                                        // 6: screen ember glow
        n('brightness-contrast', pos(2, 0), { brightness: -15, contrast: 25 }),                  // 7: dark overall
        n('sharpen', pos(1, 0), { amount: 35 }),                                                 // 8: ash texture
        n('gamma', pos(0, 0), { gamma: 0.85 }),                                                 // 9: final
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Perlin -> Blend1 fg
        e(1, 'out', 2, 'background'),     // Blocks -> Blend1 bg
        e(2, 'out', 4, 'source'),         // Blend1 -> Levels (dark ash)
        e(3, 'out', 5, 'source'),         // Ember perlin -> Hue-Sat
        e(4, 'out', 6, 'foreground'),     // Dark ash -> Blend2 fg
        e(5, 'out', 6, 'background'),     // Warm ember -> Blend2 bg
        e(6, 'out', 7, 'source'),         // Blend2 -> B/C
        e(7, 'out', 8, 'source'),         // B/C -> Sharpen
        e(8, 'out', 9, 'source'),         // Sharpen -> Gamma
        e(9, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 9. Cloud Cover
  // Perlin large + perlin fine -> screen blend -> levels -> bright
  // ---------------------------------------------------------------------------
  {
    name: 'Cloud Cover',
    description: 'Soft layered cloud formations with bright luminous highlights',
    category: 'Organic',
    tags: ['cloud', 'sky', 'soft', 'bright', 'atmosphere'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(6, 0), { scale: 4, octaves: 6, roughness: 0.6, seed: 7 }),       // 0: main cloud shapes
        n('blur', pos(5, 0), { radius: 5 }),                                                    // 1: soften clouds
        n('perlin-noise', pos(6, 1), { scale: 12, octaves: 5, roughness: 0.55, seed: 19 }),    // 2: cloud detail
        n('perlin-noise', pos(6, 2), { scale: 20, octaves: 3, roughness: 0.4, seed: 53 }),     // 3: thin wisps
        n('blend', pos(4, 0), { mode: 3, opacity: 55 }),                                        // 4: screen large+fine
        n('blend', pos(3, 0), { mode: 3, opacity: 30 }),                                        // 5: screen with wisps
        n('levels', pos(2, 0), { inBlack: 5, inWhite: 70, gamma: 1.6 }),                       // 6: cloud brightness
        n('brightness-contrast', pos(1, 0), { brightness: 15, contrast: 8 }),                    // 7: bright push
        n('hue-saturation', pos(1, 1), { hue: 10, saturation: 8, lightness: 10 }),              // 8: warm tint
        n('gamma', pos(0, 0), { gamma: 1.3 }),                                                  // 9: final brightness
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Large perlin -> Blur
        e(1, 'out', 4, 'foreground'),      // Blurred -> Blend1 fg
        e(2, 'out', 4, 'background'),      // Fine perlin -> Blend1 bg
        e(4, 'out', 5, 'foreground'),      // Blend1 -> Blend2 fg
        e(3, 'out', 5, 'background'),      // Wisps -> Blend2 bg
        e(5, 'out', 6, 'source'),          // Blend2 -> Levels
        e(6, 'out', 7, 'source'),          // Levels -> B/C
        e(7, 'out', 8, 'source'),          // B/C -> Hue-Sat
        e(8, 'out', 9, 'source'),          // Hue-Sat -> Gamma
        e(9, 'out', -1, 'source'),         // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 10. Cracked Earth
  // Cells voronoi + threshold -> edge detect -> overlay on perlin
  // ---------------------------------------------------------------------------
  {
    name: 'Cracked Earth',
    description: 'Dry cracked earth with deep fissures over parched terrain',
    category: 'Organic',
    tags: ['cracked', 'earth', 'dry', 'desert', 'fissure'],
    build: () => ({
      nodes: [
        n('cells-noise', pos(7, 0), { scale: 8, formula: 0, octaves: 2, roughness: 0.3 }),     // 0: crack pattern
        n('levels', pos(6, 0), { inBlack: 5, inWhite: 50, gamma: 0.6 }),                       // 1: sharpen boundaries
        n('threshold', pos(5, 0), { threshold: 30 }),                                            // 2: crack lines
        n('edge-detector', pos(4, 0)),                                                           // 3: extract edges
        n('invert', pos(3, 0)),                                                                  // 4: cracks dark
        n('perlin-noise', pos(7, 1), { scale: 10, octaves: 6, roughness: 0.65, seed: 29 }),    // 5: earth base
        n('perlin-noise', pos(7, 2), { scale: 30, octaves: 4, roughness: 0.5, seed: 41 }),     // 6: earth detail
        n('blend', pos(6, 1), { mode: 2, opacity: 50 }),                                        // 7: multiply earth textures
        n('hue-saturation', pos(5, 1), { hue: 25, saturation: 30, lightness: -5 }),             // 8: warm brown
        n('blend', pos(2, 0), { mode: 2, opacity: 85 }),                                        // 9: multiply cracks on earth
        n('blur', pos(2, 1), { radius: 1 }),                                                    // 10: soften
        n('levels', pos(1, 0), { inBlack: 8, inWhite: 90, gamma: 1.0 }),                       // 11: final contrast
        n('brightness-contrast', pos(0, 0), { brightness: -5, contrast: 20 }),                   // 12: punch
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Cells -> Levels
        e(1, 'out', 2, 'source'),          // Levels -> Threshold
        e(2, 'out', 3, 'source'),          // Threshold -> Edge
        e(3, 'out', 4, 'source'),          // Edge -> Invert
        e(5, 'out', 7, 'foreground'),      // Perlin base -> Blend1 fg
        e(6, 'out', 7, 'background'),      // Perlin fine -> Blend1 bg
        e(7, 'out', 8, 'source'),          // Earth blend -> Hue-Sat
        e(4, 'out', 9, 'foreground'),      // Cracks -> Blend2 fg
        e(8, 'out', 9, 'background'),      // Earth tinted -> Blend2 bg
        e(9, 'out', 10, 'source'),         // Blend2 -> Blur
        e(10, 'out', 11, 'source'),        // Blur -> Levels
        e(11, 'out', 12, 'source'),        // Levels -> B/C
        e(12, 'out', -1, 'source'),        // B/C -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 11. Coral Reef
  // Cells + perlin -> noise distortion -> spectrum -> hue shift
  // ---------------------------------------------------------------------------
  {
    name: 'Coral Reef',
    description: 'Colorful organic coral formations with vivid underwater hues',
    category: 'Organic',
    tags: ['coral', 'reef', 'ocean', 'colorful', 'underwater'],
    build: () => ({
      nodes: [
        n('cells-noise', pos(7, 0), { scale: 10, formula: 1, octaves: 4, roughness: 0.6 }),    // 0: coral structure
        n('perlin-noise', pos(7, 1), { scale: 6, octaves: 5, roughness: 0.55, seed: 83 }),     // 1: organic variation
        n('blend', pos(6, 0), { mode: 4, opacity: 60 }),                                        // 2: overlay blend
        n('noise-distortion', pos(5, 0), { distortion: 40, scale: 8, octaves: 4 }),             // 3: organic shape
        n('perlin-noise', pos(7, 2), { scale: 5, octaves: 3, roughness: 0.4, seed: 61 }),      // 4: color regions
        n('spectrum', pos(6, 2)),                                                                // 5: rainbow mapping
        n('hue-saturation', pos(5, 2), { hue: -60, saturation: 30, lightness: -5 }),            // 6: underwater shift
        n('blend', pos(4, 0), { mode: 4, opacity: 50 }),                                        // 7: overlay color
        n('blur', pos(3, 0), { radius: 2 }),                                                    // 8: organic softness
        n('levels', pos(2, 0), { inBlack: 10, inWhite: 85, gamma: 1.1 }),                      // 9: contrast
        n('brightness-contrast', pos(1, 0), { brightness: 5, contrast: 15 }),                    // 10: punch
        n('hue-saturation', pos(0, 0), { hue: 0, saturation: 20, lightness: 0 }),               // 11: vivid
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Cells -> Blend1 fg
        e(1, 'out', 2, 'background'),     // Perlin -> Blend1 bg
        e(2, 'out', 3, 'source'),         // Blend1 -> Noise distortion
        e(4, 'out', 5, 'source'),         // Color perlin -> Spectrum
        e(5, 'out', 6, 'source'),         // Spectrum -> Hue-Sat
        e(3, 'out', 7, 'foreground'),     // Distorted coral -> Blend2 fg
        e(6, 'out', 7, 'background'),     // Color -> Blend2 bg
        e(7, 'out', 8, 'source'),         // Blend2 -> Blur
        e(8, 'out', 9, 'source'),         // Blur -> Levels
        e(9, 'out', 10, 'source'),        // Levels -> B/C
        e(10, 'out', 11, 'source'),       // B/C -> Hue-Sat final
        e(11, 'out', -1, 'source'),       // Hue-Sat -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 12. Woven Cloth
  // Checker + wave X + wave Y -> blend -> levels
  // ---------------------------------------------------------------------------
  {
    name: 'Woven Cloth',
    description: 'Interlocking woven fabric pattern with crosshatch structure',
    category: 'Geometric',
    tags: ['woven', 'cloth', 'fabric', 'pattern', 'textile'],
    build: () => ({
      nodes: [
        n('checker', pos(6, 0), { scale: 20 }),                                                 // 0: base weave grid
        n('wave', pos(5, 0), { ampX: 0.04, ampY: 0.0, freqX: 20, freqY: 1, type: 0 }),        // 1: horizontal threads
        n('checker', pos(6, 1), { scale: 20 }),                                                 // 2: second checker
        n('offset', pos(5, 2), { offsetX: 0.025, offsetY: 0.025 }),                             // 3: shift checker
        n('wave', pos(4, 1), { ampX: 0.0, ampY: 0.04, freqX: 1, freqY: 20, type: 0 }),        // 4: vertical threads
        n('blend', pos(3, 0), { mode: 3, opacity: 50 }),                                        // 5: screen blend
        n('perlin-noise', pos(4, 2), { scale: 30, octaves: 3, roughness: 0.3, seed: 50 }),     // 6: cloth variation
        n('blend', pos(2, 0), { mode: 2, opacity: 25 }),                                        // 7: multiply variation
        n('levels', pos(1, 0), { inBlack: 15, inWhite: 85, gamma: 1.1 }),                      // 8: weave contrast
        n('hue-saturation', pos(1, 1), { hue: 20, saturation: 10, lightness: 0 }),              // 9: subtle warm
        n('sharpen', pos(0, 0), { amount: 25 }),                                                 // 10: thread definition
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Checker1 -> WaveX
        e(2, 'out', 3, 'source'),          // Checker2 -> Offset
        e(3, 'out', 4, 'source'),          // Offset -> WaveY
        e(1, 'out', 5, 'foreground'),      // WaveX -> Blend1 fg
        e(4, 'out', 5, 'background'),      // WaveY -> Blend1 bg
        e(5, 'out', 7, 'foreground'),      // Blend1 -> Blend2 fg
        e(6, 'out', 7, 'background'),      // Variation -> Blend2 bg
        e(7, 'out', 8, 'source'),          // Blend2 -> Levels
        e(8, 'out', 9, 'source'),          // Levels -> Hue-Sat
        e(9, 'out', 10, 'source'),         // Hue-Sat -> Sharpen
        e(10, 'out', -1, 'source'),        // Sharpen -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 13. Granite
  // 3 perlin different scales -> multiply chain -> sharpen -> levels
  // ---------------------------------------------------------------------------
  {
    name: 'Granite',
    description: 'Dense speckled granite with multi-scale mineral grain',
    category: 'Organic',
    tags: ['granite', 'stone', 'speckle', 'mineral', 'rock'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(7, 0), { scale: 5, octaves: 4, roughness: 0.5, seed: 14 }),      // 0: large mineral veins
        n('perlin-noise', pos(7, 1), { scale: 15, octaves: 5, roughness: 0.6, seed: 37 }),     // 1: mid-grain
        n('perlin-noise', pos(7, 2), { scale: 40, octaves: 3, roughness: 0.4, seed: 71 }),     // 2: fine speckle
        n('cells-noise', pos(7, 3), { scale: 25, formula: 2, octaves: 2, roughness: 0.3 }),    // 3: crystalline highlights
        n('blend', pos(6, 0), { mode: 2, opacity: 65 }),                                        // 4: multiply coarse+medium
        n('blend', pos(5, 0), { mode: 2, opacity: 55 }),                                        // 5: multiply +fine
        n('blend', pos(4, 0), { mode: 1, opacity: 20 }),                                        // 6: add cells highlight
        n('sharpen', pos(3, 0), { amount: 50 }),                                                 // 7: crisp grain
        n('levels', pos(2, 0), { inBlack: 15, inWhite: 85, gamma: 0.95 }),                     // 8: granite contrast
        n('brightness-contrast', pos(1, 0), { brightness: -3, contrast: 22 }),                   // 9: punch
        n('hue-saturation', pos(1, 1), { hue: 10, saturation: 8, lightness: 0 }),               // 10: slight warmth
        n('desaturate', pos(0, 0), { amount: 30 }),                                              // 11: stone neutral
      ],
      edges: [
        e(0, 'out', 4, 'foreground'),     // Coarse -> Blend1 fg
        e(1, 'out', 4, 'background'),     // Medium -> Blend1 bg
        e(4, 'out', 5, 'foreground'),     // Blend1 -> Blend2 fg
        e(2, 'out', 5, 'background'),     // Fine -> Blend2 bg
        e(5, 'out', 6, 'foreground'),     // Blend2 -> Blend3 fg
        e(3, 'out', 6, 'background'),     // Cells -> Blend3 bg
        e(6, 'out', 7, 'source'),         // Blend3 -> Sharpen
        e(7, 'out', 8, 'source'),         // Sharpen -> Levels
        e(8, 'out', 9, 'source'),         // Levels -> B/C
        e(9, 'out', 10, 'source'),        // B/C -> Hue-Sat
        e(10, 'out', 11, 'source'),       // Hue-Sat -> Desaturate
        e(11, 'out', -1, 'source'),       // Desaturate -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 14. Linen
  // Perlin fine + wave subtle -> screen blend -> desaturate -> warm
  // ---------------------------------------------------------------------------
  {
    name: 'Linen',
    description: 'Delicate linen weave with subtle warm off-white tones',
    category: 'Organic',
    tags: ['linen', 'fabric', 'cloth', 'subtle', 'warm', 'textile'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 35, octaves: 4, roughness: 0.45, seed: 27 }),    // 0: linen fiber
        n('wave', pos(4, 0), { ampX: 0.02, ampY: 0.02, freqX: 18, freqY: 18, type: 0 }),      // 1: weave pattern
        n('perlin-noise', pos(5, 1), { scale: 8, octaves: 3, roughness: 0.3, seed: 45 }),      // 2: coarser variation
        n('blend', pos(3, 0), { mode: 3, opacity: 35 }),                                        // 3: screen blend
        n('desaturate', pos(2, 0), { amount: 60 }),                                              // 4: neutral linen
        n('levels', pos(1, 0), { inBlack: 20, inWhite: 80, gamma: 1.4 }),                      // 5: soft contrast
        n('hue-saturation', pos(1, 1), { hue: 25, saturation: 15, lightness: 15 }),             // 6: warm off-white
        n('gamma', pos(0, 0), { gamma: 1.25 }),                                                 // 7: brightness
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Perlin fine -> Wave
        e(1, 'out', 3, 'foreground'),      // Wave -> Blend fg
        e(2, 'out', 3, 'background'),      // Perlin coarse -> Blend bg
        e(3, 'out', 4, 'source'),          // Blend -> Desaturate
        e(4, 'out', 5, 'source'),          // Desaturate -> Levels
        e(5, 'out', 6, 'source'),          // Levels -> Hue-Sat
        e(6, 'out', 7, 'source'),          // Hue-Sat -> Gamma
        e(7, 'out', -1, 'source'),         // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 15. Hammered Bronze
  // Cells + noise distortion -> spherize -> warm metallic
  // ---------------------------------------------------------------------------
  {
    name: 'Hammered Bronze',
    description: 'Hand-hammered bronze surface with dimpled metallic sheen',
    category: 'Organic',
    tags: ['bronze', 'metal', 'hammered', 'warm', 'metallic'],
    build: () => ({
      nodes: [
        n('cells-noise', pos(6, 0), { scale: 14, formula: 0, octaves: 3, roughness: 0.4 }),    // 0: hammer dimples
        n('noise-distortion', pos(5, 0), { distortion: 30, scale: 10, octaves: 3 }),            // 1: organic marks
        n('spherize', pos(4, 0), { strength: 35 }),                                              // 2: convex dimples
        n('perlin-noise', pos(6, 1), { scale: 20, octaves: 5, roughness: 0.5, seed: 59 }),     // 3: imperfections
        n('blend', pos(3, 0), { mode: 4, opacity: 40 }),                                        // 4: overlay blend
        n('levels', pos(2, 0), { inBlack: 15, inWhite: 80, gamma: 0.85 }),                     // 5: metallic contrast
        n('hue-saturation', pos(2, 1), { hue: 30, saturation: 40, lightness: -10 }),            // 6: warm bronze
        n('brightness-contrast', pos(1, 0), { brightness: 5, contrast: 25 }),                    // 7: metallic punch
        n('sharpen', pos(1, 1), { amount: 45 }),                                                 // 8: hammer detail
        n('gamma', pos(0, 0), { gamma: 0.9 }),                                                  // 9: final
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Cells -> Noise distortion
        e(1, 'out', 2, 'source'),          // Distorted -> Spherize
        e(2, 'out', 4, 'foreground'),      // Spherize -> Blend fg
        e(3, 'out', 4, 'background'),      // Perlin -> Blend bg
        e(4, 'out', 5, 'source'),          // Blend -> Levels
        e(5, 'out', 6, 'source'),          // Levels -> Hue-Sat
        e(6, 'out', 7, 'source'),          // Hue-Sat -> B/C
        e(7, 'out', 8, 'source'),          // B/C -> Sharpen
        e(8, 'out', 9, 'source'),          // Sharpen -> Gamma
        e(9, 'out', -1, 'source'),         // Gamma -> Result
      ],
    }),
  },

  // ===========================================================================
  // NOISE OVERLAYS (16-25)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 16. Film Grain Fine
  // Perlin high freq + levels crush -> desaturate -> low opacity
  // ---------------------------------------------------------------------------
  {
    name: 'Film Grain Fine',
    description: 'Subtle fine film grain for photographic texture overlay',
    category: 'Noise',
    tags: ['grain', 'film', 'subtle', 'photo', 'overlay'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 45, octaves: 3, roughness: 0.5, seed: 1 }),      // 0: fine grain
        n('perlin-noise', pos(5, 1), { scale: 50, octaves: 2, roughness: 0.4, seed: 92 }),     // 1: second layer
        n('blend', pos(4, 0), { mode: 1, opacity: 40 }),                                        // 2: add blend
        n('levels', pos(3, 0), { inBlack: 30, inWhite: 70, gamma: 1.0 }),                      // 3: crush for grain
        n('desaturate', pos(2, 0), { amount: 100 }),                                             // 4: fully desaturate
        n('brightness-contrast', pos(1, 0), { brightness: 0, contrast: -15 }),                   // 5: low for overlay
        n('levels', pos(1, 1), { inBlack: 35, inWhite: 65, gamma: 1.0 }),                      // 6: narrow range
        n('gamma', pos(0, 0), { gamma: 1.1 }),                                                  // 7: final grain density
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Perlin1 -> Blend fg
        e(1, 'out', 2, 'background'),     // Perlin2 -> Blend bg
        e(2, 'out', 3, 'source'),         // Blend -> Levels
        e(3, 'out', 4, 'source'),         // Levels -> Desaturate
        e(4, 'out', 5, 'source'),         // Desaturate -> B/C
        e(5, 'out', 6, 'source'),         // B/C -> Levels2
        e(6, 'out', 7, 'source'),         // Levels2 -> Gamma
        e(7, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 17. Film Grain Heavy
  // Perlin + blocks -> multiply -> levels extreme -> desaturate
  // ---------------------------------------------------------------------------
  {
    name: 'Film Grain Heavy',
    description: 'Heavy coarse film grain with visible clumps for analog look',
    category: 'Noise',
    tags: ['grain', 'film', 'heavy', 'analog', 'coarse', 'overlay'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 30, octaves: 5, roughness: 0.7, seed: 8 }),      // 0: base grain
        n('blocks-noise', pos(5, 1), { scale: 25, octaves: 3, roughness: 0.5 }),                // 1: clumpy grain
        n('blend', pos(4, 0), { mode: 2, opacity: 70 }),                                        // 2: multiply grit
        n('perlin-noise', pos(5, 2), { scale: 48, octaves: 2, roughness: 0.3, seed: 56 }),     // 3: fine overlay
        n('blend', pos(3, 0), { mode: 1, opacity: 30 }),                                        // 4: add fine grain
        n('levels', pos(2, 0), { inBlack: 25, inWhite: 65, gamma: 0.8 }),                      // 5: extreme contrast
        n('desaturate', pos(1, 0), { amount: 100 }),                                             // 6: fully desaturate
        n('brightness-contrast', pos(1, 1), { brightness: 5, contrast: 20 }),                    // 7: final density
        n('gamma', pos(0, 0), { gamma: 0.9 }),                                                  // 8: final
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Perlin -> Blend1 fg
        e(1, 'out', 2, 'background'),     // Blocks -> Blend1 bg
        e(2, 'out', 4, 'foreground'),     // Blend1 -> Blend2 fg
        e(3, 'out', 4, 'background'),     // Fine perlin -> Blend2 bg
        e(4, 'out', 5, 'source'),         // Blend2 -> Levels
        e(5, 'out', 6, 'source'),         // Levels -> Desaturate
        e(6, 'out', 7, 'source'),         // Desaturate -> B/C
        e(7, 'out', 8, 'source'),         // B/C -> Gamma
        e(8, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 18. Dust & Scratches
  // Perlin thin + wave thin lines -> threshold -> blur slight
  // ---------------------------------------------------------------------------
  {
    name: 'Dust & Scratches',
    description: 'Dusty surface with thin scattered scratches for vintage overlay',
    category: 'Noise',
    tags: ['dust', 'scratches', 'vintage', 'overlay', 'damage'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(7, 0), { scale: 40, octaves: 6, roughness: 0.8, seed: 3 }),      // 0: dust spots
        n('threshold', pos(6, 0), { threshold: 72 }),                                            // 1: dust specks
        n('perlin-noise', pos(7, 1), { scale: 3, octaves: 2, roughness: 0.3, seed: 48 }),      // 2: scratch base
        n('wave', pos(6, 1), { ampX: 0.15, ampY: 0.0, freqX: 1, freqY: 15, type: 0 }),        // 3: scratch lines
        n('motion-blur', pos(5, 1), { angle: 80, radius: 10 }),                                 // 4: linear scratches
        n('threshold', pos(4, 1), { threshold: 78 }),                                            // 5: sharp scratches
        n('perlin-noise', pos(7, 2), { scale: 6, octaves: 3, roughness: 0.4, seed: 20 }),      // 6: distribution
        n('mask', pos(3, 1)),                                                                    // 7: mask scratches
        n('blend', pos(2, 0), { mode: 3, opacity: 65 }),                                        // 8: screen dust+scratches
        n('blur', pos(1, 0), { radius: 1 }),                                                    // 9: soften
        n('desaturate', pos(1, 1), { amount: 100 }),                                             // 10: desaturate
        n('levels', pos(0, 0), { inBlack: 0, inWhite: 85, gamma: 1.3 }),                       // 11: final density
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Dust perlin -> Threshold
        e(2, 'out', 3, 'source'),          // Scratch perlin -> Wave
        e(3, 'out', 4, 'source'),          // Wave -> Motion blur
        e(4, 'out', 5, 'source'),          // Motion blur -> Threshold
        e(5, 'out', 7, 'source'),          // Scratch threshold -> Mask source
        e(6, 'out', 7, 'mask'),            // Distribution -> Mask mask
        e(5, 'out', 7, 'background'),      // Scratch as background
        e(1, 'out', 8, 'foreground'),      // Dust -> Blend fg
        e(7, 'out', 8, 'background'),      // Masked scratches -> Blend bg
        e(8, 'out', 9, 'source'),          // Blend -> Blur
        e(9, 'out', 10, 'source'),         // Blur -> Desaturate
        e(10, 'out', 11, 'source'),        // Desaturate -> Levels
        e(11, 'out', -1, 'source'),        // Levels -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 19. VHS Static
  // Blocks + wave horizontal -> levels -> desaturate -> contrast
  // ---------------------------------------------------------------------------
  {
    name: 'VHS Static',
    description: 'Horizontal VHS tape static with scan distortion artifacts',
    category: 'Noise',
    tags: ['vhs', 'static', 'retro', 'glitch', 'analog', 'overlay'],
    build: () => ({
      nodes: [
        n('blocks-noise', pos(5, 0), { scale: 30, octaves: 5, roughness: 0.6 }),                // 0: digital static
        n('wave', pos(4, 0), { ampX: 0.1, ampY: 0.0, freqX: 1, freqY: 3, type: 1 }),          // 1: scan lines
        n('perlin-noise', pos(5, 1), { scale: 5, octaves: 2, roughness: 0.3, seed: 72 }),      // 2: irregular distortion
        n('blend', pos(3, 0), { mode: 2, opacity: 45 }),                                        // 3: multiply irregularity
        n('motion-blur', pos(2, 0), { angle: 0, radius: 4 }),                                   // 4: VHS streaks
        n('levels', pos(1, 0), { inBlack: 20, inWhite: 75, gamma: 0.85 }),                     // 5: static contrast
        n('desaturate', pos(1, 1), { amount: 100 }),                                             // 6: fully desaturate
        n('brightness-contrast', pos(0, 0), { brightness: -5, contrast: 30 }),                   // 7: static punch
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Blocks -> Wave
        e(1, 'out', 3, 'foreground'),      // Wave -> Blend fg
        e(2, 'out', 3, 'background'),      // Perlin -> Blend bg
        e(3, 'out', 4, 'source'),          // Blend -> Motion blur
        e(4, 'out', 5, 'source'),          // MBlur -> Levels
        e(5, 'out', 6, 'source'),          // Levels -> Desaturate
        e(6, 'out', 7, 'source'),          // Desaturate -> B/C
        e(7, 'out', -1, 'source'),         // B/C -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 20. Halftone Dots
  // Perlin -> halftone -> levels
  // ---------------------------------------------------------------------------
  {
    name: 'Halftone Dots',
    description: 'Classic print halftone dot pattern with adjustable density',
    category: 'Noise',
    tags: ['halftone', 'dots', 'print', 'pattern', 'overlay'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(4, 0), { scale: 6, octaves: 4, roughness: 0.5, seed: 35 }),      // 0: tone variation
        n('levels', pos(3, 0), { inBlack: 15, inWhite: 85, gamma: 1.0 }),                      // 1: pre-halftone
        n('halftone', pos(2, 0), { scale: 5, angle: 45 }),                                      // 2: halftone
        n('levels', pos(1, 0), { inBlack: 10, inWhite: 90, gamma: 1.0 }),                      // 3: post-halftone
        n('desaturate', pos(1, 1), { amount: 100 }),                                             // 4: desaturate
        n('brightness-contrast', pos(0, 0), { brightness: 0, contrast: 15 }),                    // 5: punch
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Perlin -> Levels pre
        e(1, 'out', 2, 'source'),          // Levels -> Halftone
        e(2, 'out', 3, 'source'),          // Halftone -> Levels post
        e(3, 'out', 4, 'source'),          // Levels -> Desaturate
        e(4, 'out', 5, 'source'),          // Desaturate -> B/C
        e(5, 'out', -1, 'source'),         // B/C -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 21. Scanlines
  // Checker stretched + perlin subtle -> multiply -> levels
  // ---------------------------------------------------------------------------
  {
    name: 'Scanlines',
    description: 'CRT monitor scanline overlay with subtle intensity variation',
    category: 'Noise',
    tags: ['scanlines', 'crt', 'retro', 'monitor', 'overlay'],
    build: () => ({
      nodes: [
        n('checker', pos(5, 0), { scale: 50 }),                                                 // 0: scanline bars
        n('scale', pos(4, 0), { scaleX: 1, scaleY: 0.02 }),                                    // 1: stretch to lines
        n('perlin-noise', pos(5, 1), { scale: 8, octaves: 3, roughness: 0.4, seed: 64 }),      // 2: intensity variation
        n('blend', pos(3, 0), { mode: 2, opacity: 40 }),                                        // 3: multiply variation
        n('perlin-noise', pos(5, 2), { scale: 45, octaves: 2, roughness: 0.3, seed: 90 }),     // 4: CRT noise
        n('blend', pos(2, 0), { mode: 1, opacity: 15 }),                                        // 5: add CRT noise
        n('levels', pos(1, 0), { inBlack: 25, inWhite: 75, gamma: 1.0 }),                      // 6: contrast
        n('desaturate', pos(0, 0), { amount: 100 }),                                             // 7: desaturate
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Checker -> Scale
        e(1, 'out', 3, 'foreground'),      // Scaled -> Blend1 fg
        e(2, 'out', 3, 'background'),      // Perlin -> Blend1 bg
        e(3, 'out', 5, 'foreground'),      // Blend1 -> Blend2 fg
        e(4, 'out', 5, 'background'),      // CRT noise -> Blend2 bg
        e(5, 'out', 6, 'source'),          // Blend2 -> Levels
        e(6, 'out', 7, 'source'),          // Levels -> Desaturate
        e(7, 'out', -1, 'source'),         // Desaturate -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 22. Paper Texture
  // Perlin fine + perlin coarse -> screen -> desaturate -> levels
  // ---------------------------------------------------------------------------
  {
    name: 'Paper Texture',
    description: 'Organic paper fiber texture with subtle tooth and warm undertone',
    category: 'Noise',
    tags: ['paper', 'texture', 'fiber', 'organic', 'overlay'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(5, 0), { scale: 35, octaves: 5, roughness: 0.55, seed: 16 }),    // 0: paper fiber
        n('perlin-noise', pos(5, 1), { scale: 8, octaves: 4, roughness: 0.5, seed: 39 }),      // 1: broad texture
        n('blend', pos(4, 0), { mode: 3, opacity: 45 }),                                        // 2: screen blend
        n('cells-noise', pos(5, 2), { scale: 45, formula: 1, octaves: 2, roughness: 0.3 }),    // 3: fiber detail
        n('blend', pos(3, 0), { mode: 1, opacity: 20 }),                                        // 4: add fiber
        n('desaturate', pos(2, 0), { amount: 80 }),                                              // 5: neutral
        n('levels', pos(1, 0), { inBlack: 20, inWhite: 75, gamma: 1.4 }),                      // 6: paper contrast
        n('hue-saturation', pos(1, 1), { hue: 20, saturation: 10, lightness: 15 }),             // 7: warm paper
        n('gamma', pos(0, 0), { gamma: 1.15 }),                                                 // 8: brightness
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Fine perlin -> Blend1 fg
        e(1, 'out', 2, 'background'),     // Coarse perlin -> Blend1 bg
        e(2, 'out', 4, 'foreground'),     // Blend1 -> Blend2 fg
        e(3, 'out', 4, 'background'),     // Cells fiber -> Blend2 bg
        e(4, 'out', 5, 'source'),         // Blend2 -> Desaturate
        e(5, 'out', 6, 'source'),         // Desaturate -> Levels
        e(6, 'out', 7, 'source'),         // Levels -> Hue-Sat
        e(7, 'out', 8, 'source'),         // Hue-Sat -> Gamma
        e(8, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 23. Noise Speckle
  // Cells fine + threshold -> blur 1px -> levels -> desaturate
  // ---------------------------------------------------------------------------
  {
    name: 'Noise Speckle',
    description: 'Sharp scattered noise speckles for gritty texture overlay',
    category: 'Noise',
    tags: ['speckle', 'noise', 'gritty', 'dots', 'overlay'],
    build: () => ({
      nodes: [
        n('cells-noise', pos(5, 0), { scale: 40, formula: 0, octaves: 2, roughness: 0.3 }),    // 0: speckle base
        n('perlin-noise', pos(5, 1), { scale: 20, octaves: 3, roughness: 0.4, seed: 82 }),     // 1: variation
        n('blend', pos(4, 0), { mode: 2, opacity: 50 }),                                        // 2: multiply varied
        n('threshold', pos(3, 0), { threshold: 65 }),                                            // 3: sharp speckles
        n('blur', pos(2, 0), { radius: 1 }),                                                    // 4: soften edges
        n('levels', pos(1, 0), { inBlack: 10, inWhite: 90, gamma: 1.0 }),                      // 5: speckle density
        n('desaturate', pos(1, 1), { amount: 100 }),                                             // 6: desaturate
        n('gamma', pos(0, 0), { gamma: 1.05 }),                                                 // 7: final
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Cells -> Blend fg
        e(1, 'out', 2, 'background'),     // Perlin -> Blend bg
        e(2, 'out', 3, 'source'),         // Blend -> Threshold
        e(3, 'out', 4, 'source'),         // Threshold -> Blur
        e(4, 'out', 5, 'source'),         // Blur -> Levels
        e(5, 'out', 6, 'source'),         // Levels -> Desaturate
        e(6, 'out', 7, 'source'),         // Desaturate -> Gamma
        e(7, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 24. Digital Noise
  // Blocks fine + perlin fine -> difference -> levels -> desat
  // ---------------------------------------------------------------------------
  {
    name: 'Digital Noise',
    description: 'Digital compression artifact noise with blocky interference',
    category: 'Noise',
    tags: ['digital', 'noise', 'compression', 'artifact', 'overlay'],
    build: () => ({
      nodes: [
        n('blocks-noise', pos(5, 0), { scale: 35, octaves: 4, roughness: 0.5 }),                // 0: digital squares
        n('perlin-noise', pos(5, 1), { scale: 38, octaves: 3, roughness: 0.45, seed: 25 }),    // 1: smooth noise
        n('blend', pos(4, 0), { mode: 5, opacity: 70 }),                                        // 2: difference
        n('blocks-noise', pos(5, 2), { scale: 10, octaves: 2, roughness: 0.3 }),                // 3: macro artifacts
        n('blend', pos(3, 0), { mode: 1, opacity: 20 }),                                        // 4: add macro
        n('levels', pos(2, 0), { inBlack: 20, inWhite: 70, gamma: 0.9 }),                      // 5: contrast
        n('desaturate', pos(1, 0), { amount: 100 }),                                             // 6: desaturate
        n('brightness-contrast', pos(1, 1), { brightness: -5, contrast: 25 }),                   // 7: harshness
        n('gamma', pos(0, 0), { gamma: 0.95 }),                                                 // 8: final
      ],
      edges: [
        e(0, 'out', 2, 'foreground'),     // Blocks fine -> Blend1 fg
        e(1, 'out', 2, 'background'),     // Perlin fine -> Blend1 bg
        e(2, 'out', 4, 'foreground'),     // Difference -> Blend2 fg
        e(3, 'out', 4, 'background'),     // Blocks coarse -> Blend2 bg
        e(4, 'out', 5, 'source'),         // Blend2 -> Levels
        e(5, 'out', 6, 'source'),         // Levels -> Desaturate
        e(6, 'out', 7, 'source'),         // Desaturate -> B/C
        e(7, 'out', 8, 'source'),         // B/C -> Gamma
        e(8, 'out', -1, 'source'),        // Gamma -> Result
      ],
    }),
  },

  // ---------------------------------------------------------------------------
  // 25. Crosshatch
  // Wave diagonal1 + wave diagonal2 -> multiply -> threshold -> levels
  // ---------------------------------------------------------------------------
  {
    name: 'Crosshatch',
    description: 'Diagonal crosshatch pen strokes for illustration overlay',
    category: 'Noise',
    tags: ['crosshatch', 'hatching', 'pen', 'illustration', 'overlay'],
    build: () => ({
      nodes: [
        n('perlin-noise', pos(6, 0), { scale: 12, octaves: 3, roughness: 0.4, seed: 5 }),      // 0: diagonal var 1
        n('wave', pos(5, 0), { ampX: 0.04, ampY: 0.04, freqX: 15, freqY: 15, type: 0 }),      // 1: NW-SE diagonal
        n('perlin-noise', pos(6, 1), { scale: 14, octaves: 3, roughness: 0.35, seed: 78 }),    // 2: diagonal var 2
        n('wave', pos(5, 1), { ampX: 0.04, ampY: -0.04, freqX: 15, freqY: 15, type: 0 }),     // 3: NE-SW diagonal
        n('blend', pos(4, 0), { mode: 2, opacity: 75 }),                                        // 4: multiply diagonals
        n('perlin-noise', pos(6, 2), { scale: 6, octaves: 4, roughness: 0.5, seed: 43 }),      // 5: density variation
        n('mask', pos(3, 0)),                                                                    // 6: mask crosshatch
        n('threshold', pos(2, 0), { threshold: 50 }),                                            // 7: crisp lines
        n('blur', pos(1, 0), { radius: 1 }),                                                    // 8: anti-alias
        n('levels', pos(1, 1), { inBlack: 5, inWhite: 95, gamma: 1.0 }),                       // 9: final contrast
        n('desaturate', pos(0, 0), { amount: 100 }),                                             // 10: desaturate
      ],
      edges: [
        e(0, 'out', 1, 'source'),         // Perlin1 -> Wave1
        e(2, 'out', 3, 'source'),          // Perlin2 -> Wave2
        e(1, 'out', 4, 'foreground'),      // Wave1 -> Blend fg
        e(3, 'out', 4, 'background'),      // Wave2 -> Blend bg
        e(4, 'out', 6, 'source'),          // Blend -> Mask source
        e(5, 'out', 6, 'mask'),            // Density -> Mask mask
        e(4, 'out', 6, 'background'),      // Blend also as background
        e(6, 'out', 7, 'source'),          // Mask -> Threshold
        e(7, 'out', 8, 'source'),          // Threshold -> Blur
        e(8, 'out', 9, 'source'),          // Blur -> Levels
        e(9, 'out', 10, 'source'),         // Levels -> Desaturate
        e(10, 'out', -1, 'source'),        // Desaturate -> Result
      ],
    }),
  },
];
