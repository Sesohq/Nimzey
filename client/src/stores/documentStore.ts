/**
 * DocumentStore - CRUD operations for Nimzey documents in localStorage.
 */

import { SerializedGraph } from '@/utils/graphSerializer';

export interface NimzeyDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  graphData: SerializedGraph;
}

const STORAGE_PREFIX = 'nimzey-doc-';
const DOC_INDEX_KEY = 'nimzey-doc-index';

function getDocIndex(): string[] {
  try {
    const raw = localStorage.getItem(DOC_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDocIndex(ids: string[]) {
  localStorage.setItem(DOC_INDEX_KEY, JSON.stringify(ids));
}

export function saveDocument(doc: NimzeyDocument): boolean {
  doc.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_PREFIX + doc.id, JSON.stringify(doc));
  } catch (err) {
    // QuotaExceededError — localStorage is full (typically 5-10 MB).
    // Try to save without the thumbnail (which can be large PNG base64).
    if (doc.thumbnail) {
      console.warn('localStorage quota exceeded — retrying without thumbnail');
      try {
        const slimDoc = { ...doc, thumbnail: undefined };
        localStorage.setItem(STORAGE_PREFIX + doc.id, JSON.stringify(slimDoc));
      } catch {
        console.error('localStorage save failed even without thumbnail:', err);
        return false;
      }
    } else {
      console.error('localStorage save failed:', err);
      return false;
    }
  }

  // Ensure the ID is in the index
  const index = getDocIndex();
  if (!index.includes(doc.id)) {
    index.push(doc.id);
    setDocIndex(index);
  }
  return true;
}

export function loadDocument(id: string): NimzeyDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as NimzeyDocument;
  } catch {
    return null;
  }
}

export function listDocuments(): NimzeyDocument[] {
  const index = getDocIndex();
  const docs: NimzeyDocument[] = [];
  for (const id of index) {
    const doc = loadDocument(id);
    if (doc) docs.push(doc);
  }
  // Sort by most recently updated first
  docs.sort((a, b) => b.updatedAt - a.updatedAt);
  return docs;
}

export function deleteDocument(id: string): void {
  localStorage.removeItem(STORAGE_PREFIX + id);
  const index = getDocIndex().filter(i => i !== id);
  setDocIndex(index);
}

export function renameDocument(id: string, name: string): void {
  const doc = loadDocument(id);
  if (!doc) return;
  doc.name = name;
  saveDocument(doc);
}
