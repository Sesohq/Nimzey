/**
 * Simplified category groups - matches old Nimzey category style.
 * Each group corresponds to a section in the FilterPanel sidebar.
 */

import { NodeCategory } from '@/types';
import {
  Sparkles,
  Settings,
  Blend,
  Layers,
  SlidersHorizontal,
  Wand2,
  Move,
  Palette,
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
    id: 'generators',
    label: 'Generators',
    icon: Sparkles,
    categories: ['generator'],
  },
  {
    id: 'utility',
    label: 'Utility',
    icon: Settings,
    categories: ['utility'],
  },
  {
    id: 'blenders',
    label: 'Blenders',
    icon: Blend,
    categories: ['blender'],
  },
  {
    id: 'filters',
    label: 'Filters',
    icon: Layers,
    categories: ['filter'],
  },
  {
    id: 'adjustments',
    label: 'Adjustments',
    icon: SlidersHorizontal,
    categories: ['adjustment'],
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: Wand2,
    categories: ['effect'],
  },
  {
    id: 'transforms',
    label: 'Transforms',
    icon: Move,
    categories: ['transform'],
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: Palette,
    categories: ['channel'],
  },
  {
    id: 'math',
    label: 'Math',
    icon: Calculator,
    categories: ['math', 'curve'],
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
