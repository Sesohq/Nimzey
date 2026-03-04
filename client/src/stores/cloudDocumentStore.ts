/**
 * CloudDocumentStore - Supabase CRUD operations for Nimzey documents.
 * Mirrors the localStorage documentStore interface for cloud persistence.
 */

import { supabase } from '@/lib/supabase';
import { SerializedGraph } from '@/utils/graphSerializer';

export interface CloudDocument {
  id: string;
  user_id: string;
  name: string;
  data: {
    graphData: SerializedGraph;
    width: number;
    height: number;
  };
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CloudDocumentListItem {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** Race a promise against a timeout. Rejects with an error on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

const SUPABASE_TIMEOUT_MS = 8000;

/**
 * List the authenticated user's own documents (excludes public community docs).
 * Does NOT fetch `data` to keep the response lightweight.
 */
export async function listCloudDocuments(): Promise<CloudDocumentListItem[]> {
  const { data: { user } } = await withTimeout(
    supabase.auth.getUser(),
    SUPABASE_TIMEOUT_MS,
    'getUser',
  );
  if (!user) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, thumbnail_url, is_public, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to list cloud documents:', error.message);
    return [];
  }

  return (data || []).map(doc => ({
    id: doc.id,
    name: doc.name,
    width: 512,
    height: 512,
    thumbnail_url: doc.thumbnail_url,
    is_public: doc.is_public,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }));
}

/**
 * Load a single document by ID.
 */
export async function loadCloudDocument(id: string): Promise<CloudDocument | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to load cloud document:', error.message);
    return null;
  }

  return data as CloudDocument;
}

/**
 * Save (upsert) a document to the cloud.
 */
export async function saveCloudDocument(params: {
  id: string;
  name: string;
  graphData: SerializedGraph;
  width: number;
  height: number;
  thumbnail?: string | null;
  isPublic?: boolean;
}): Promise<{ id: string } | null> {
  const { data: { user } } = await withTimeout(
    supabase.auth.getUser(),
    SUPABASE_TIMEOUT_MS,
    'getUser',
  );
  if (!user) {
    console.warn('Cannot save to cloud: not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('documents')
    .upsert({
      id: params.id,
      user_id: user.id,
      name: params.name,
      data: {
        graphData: params.graphData,
        width: params.width,
        height: params.height,
      },
      thumbnail_url: params.thumbnail || null,
      is_public: params.isPublic ?? false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save cloud document:', error.message);
    return null;
  }

  return data;
}

/**
 * Delete a document from the cloud.
 */
export async function deleteCloudDocument(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete cloud document:', error.message);
    return false;
  }
  return true;
}

/**
 * Rename a document in the cloud.
 */
export async function renameCloudDocument(id: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('documents')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Failed to rename cloud document:', error.message);
    return false;
  }
  return true;
}
