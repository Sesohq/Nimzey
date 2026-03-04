/**
 * Combined texture seed data - 100 procedural texture presets for the community library.
 * Imports from 4 batch files and re-exports as a single array.
 */

export type { TextureSeed } from './textureSeedBatch1';

import { textureSeedBatch1 } from './textureSeedBatch1';
import { textureSeedBatch2 } from './textureSeedBatch2';
import { textureSeedBatch3 } from './textureSeedBatch3';
import { textureSeedBatch4 } from './textureSeedBatch4';

export const textureSeedData = [
  ...textureSeedBatch1,
  ...textureSeedBatch2,
  ...textureSeedBatch3,
  ...textureSeedBatch4,
];
