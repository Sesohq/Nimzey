/**
 * graphTemplates - Predefined graph templates for learning and quick starts.
 * Each template builds a complete, working node graph.
 */

import { GraphState } from '@/stores/graphStore';

export interface GraphTemplate {
  id: string;
  name: string;
  description: string;
  icon: 'Waves' | 'Droplets' | 'Layers' | 'Sparkles';
  /** Builds the template by returning node/edge definitions to add atomically */
  build: () => TemplateBuildResult;
}

export interface TemplateNode {
  definitionId: string;
  position: { x: number; y: number };
  parameters?: Record<string, number | string | boolean | number[]>;
}

export interface TemplateEdge {
  /** Index into nodes array for source */
  sourceIdx: number;
  sourcePort: string;
  /** Index into nodes array for target, -1 = result node */
  targetIdx: number;
  targetPort: string;
}

export interface TemplateBuildResult {
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

const NODE_GAP = 280;
const RESULT_X = 500;
const RESULT_Y = 200;

export const graphTemplates: GraphTemplate[] = [
  {
    id: 'noise-texture',
    name: 'Noise Texture',
    description: 'Perlin noise piped to output',
    icon: 'Waves',
    build: () => ({
      nodes: [
        {
          definitionId: 'perlin-noise',
          position: { x: RESULT_X - NODE_GAP, y: RESULT_Y },
        },
      ],
      edges: [
        { sourceIdx: 0, sourcePort: 'out', targetIdx: -1, targetPort: 'source' },
      ],
    }),
  },
  {
    id: 'displacement-effect',
    name: 'Displacement Effect',
    description: 'Cells warped by Perlin Noise refraction',
    icon: 'Droplets',
    build: (): TemplateBuildResult => ({
      nodes: [
        {
          definitionId: 'cells-noise',
          position: { x: RESULT_X - NODE_GAP * 3, y: RESULT_Y - 60 },
        },
        {
          definitionId: 'perlin-noise',
          position: { x: RESULT_X - NODE_GAP * 3, y: RESULT_Y + 100 },
          parameters: { scale: 4, octaves: 3 },
        },
        {
          definitionId: 'refraction',
          position: { x: RESULT_X - NODE_GAP, y: RESULT_Y },
          parameters: { refraction: 35 },
        },
      ],
      edges: [
        // Cells → Refraction (source)
        { sourceIdx: 0, sourcePort: 'out', targetIdx: 2, targetPort: 'source' },
        // Perlin → Refraction (height)
        { sourceIdx: 1, sourcePort: 'out', targetIdx: 2, targetPort: 'height' },
        // Refraction → Result
        { sourceIdx: 2, sourcePort: 'out', targetIdx: -1, targetPort: 'source' },
      ],
    }),
  },
  {
    id: 'blended-pattern',
    name: 'Blended Pattern',
    description: 'Bricks + Perlin blended with Overlay',
    icon: 'Layers',
    build: (): TemplateBuildResult => ({
      nodes: [
        {
          definitionId: 'bricks',
          position: { x: RESULT_X - NODE_GAP * 3, y: RESULT_Y - 60 },
        },
        {
          definitionId: 'perlin-noise',
          position: { x: RESULT_X - NODE_GAP * 3, y: RESULT_Y + 100 },
          parameters: { scale: 6 },
        },
        {
          definitionId: 'blend',
          position: { x: RESULT_X - NODE_GAP, y: RESULT_Y },
          parameters: { mode: 9, opacity: 75 }, // Overlay blend
        },
      ],
      edges: [
        // Bricks → Blend foreground
        { sourceIdx: 0, sourcePort: 'out', targetIdx: 2, targetPort: 'foreground' },
        // Perlin → Blend background
        { sourceIdx: 1, sourcePort: 'out', targetIdx: 2, targetPort: 'background' },
        // Blend → Result
        { sourceIdx: 2, sourcePort: 'out', targetIdx: -1, targetPort: 'source' },
      ],
    }),
  },
  {
    id: 'stylized-cells',
    name: 'Stylized Cells',
    description: 'Cells enhanced with contrast + sharpen',
    icon: 'Sparkles',
    build: (): TemplateBuildResult => ({
      nodes: [
        {
          definitionId: 'cells-noise',
          position: { x: RESULT_X - NODE_GAP * 3, y: RESULT_Y },
        },
        {
          definitionId: 'brightness-contrast',
          position: { x: RESULT_X - NODE_GAP * 2, y: RESULT_Y },
          parameters: { brightness: 10, contrast: 40 },
        },
        {
          definitionId: 'sharpen',
          position: { x: RESULT_X - NODE_GAP, y: RESULT_Y },
          parameters: { amount: 70 },
        },
      ],
      edges: [
        // Cells → B/C
        { sourceIdx: 0, sourcePort: 'out', targetIdx: 1, targetPort: 'source' },
        // B/C → Sharpen
        { sourceIdx: 1, sourcePort: 'out', targetIdx: 2, targetPort: 'source' },
        // Sharpen → Result
        { sourceIdx: 2, sourcePort: 'out', targetIdx: -1, targetPort: 'source' },
      ],
    }),
  },
];
