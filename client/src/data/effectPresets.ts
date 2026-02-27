/**
 * One-click effect presets - pre-built chains that insert into the graph.
 * Each preset defines a series of nodes with parameter overrides.
 */

import { Sunset, Pencil, Sparkles, Contrast, Layers } from 'lucide-react';

export interface PresetStep {
  definitionId: string;
  parameters?: Record<string, number | string | boolean>;
}

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  steps: PresetStep[];
}

export const effectPresets: EffectPreset[] = [
  {
    id: 'vintage',
    name: 'Vintage Photo',
    description: 'Warm, faded retro look',
    icon: Sunset,
    steps: [
      { definitionId: 'desaturate', parameters: { amount: 40 } },
      { definitionId: 'brightness-contrast', parameters: { brightness: 8, contrast: -10 } },
      { definitionId: 'gamma', parameters: { gamma: 1.15 } },
    ],
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    description: 'Hand-drawn pencil look',
    icon: Pencil,
    steps: [
      { definitionId: 'edge-detector', parameters: { strength: 1.5 } },
      { definitionId: 'invert', parameters: {} },
      { definitionId: 'levels', parameters: { inBlack: 20, inWhite: 200 } },
    ],
  },
  {
    id: 'dreamy',
    name: 'Dreamy Glow',
    description: 'Soft, ethereal glow effect',
    icon: Sparkles,
    steps: [
      { definitionId: 'blur', parameters: { radius: 8 } },
      { definitionId: 'brightness-contrast', parameters: { brightness: 15, contrast: 10 } },
      { definitionId: 'gamma', parameters: { gamma: 1.3 } },
    ],
  },
  {
    id: 'popart',
    name: 'Pop Art',
    description: 'Bold, high-contrast style',
    icon: Contrast,
    steps: [
      { definitionId: 'brightness-contrast', parameters: { brightness: 0, contrast: 50 } },
      { definitionId: 'threshold', parameters: { threshold: 128 } },
    ],
  },
  {
    id: 'emboss',
    name: 'Emboss',
    description: 'Raised surface texture',
    icon: Layers,
    steps: [
      { definitionId: 'edge-detector', parameters: { strength: 1.0 } },
      { definitionId: 'gamma', parameters: { gamma: 0.6 } },
    ],
  },
];
