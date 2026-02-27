/**
 * Simplified category groups - collapses 13 technical categories into 6 intuitive groups.
 */

import { NodeCategory } from '@/types';
import {
  Sparkles,
  SlidersHorizontal,
  Wand2,
  Palette,
  Move,
  Calculator,
} from 'lucide-react';

export interface SimplifiedGroup {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  categories: NodeCategory[];
}

export const SIMPLIFIED_GROUPS: SimplifiedGroup[] = [
  {
    id: 'create',
    label: 'Create',
    icon: Sparkles,
    categories: ['noise', 'gradient', 'pattern', 'external'],
  },
  {
    id: 'adjust',
    label: 'Adjust',
    icon: SlidersHorizontal,
    categories: ['adjustment'],
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: Wand2,
    categories: ['processing'],
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: Palette,
    categories: ['channel'],
  },
  {
    id: 'transform',
    label: 'Transform',
    icon: Move,
    categories: ['transform'],
  },
  {
    id: 'math',
    label: 'Math',
    icon: Calculator,
    categories: ['math', 'curve-generator', 'curve-operation', 'control', 'advanced'],
  },
];

/**
 * Maps a NodeCategory to its simplified group ID.
 */
const categoryToGroupMap = new Map<NodeCategory, string>();
for (const group of SIMPLIFIED_GROUPS) {
  for (const cat of group.categories) {
    categoryToGroupMap.set(cat, group.id);
  }
}

export function getSimplifiedGroupId(category: NodeCategory): string {
  return categoryToGroupMap.get(category) ?? 'math';
}
