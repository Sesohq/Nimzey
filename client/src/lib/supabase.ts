import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hrzycikekymemyjmeeuv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyenljaWtla3ltZW15am1lZXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDk5MDcsImV4cCI6MjA4NzgyNTkwN30.GJ3xd6iZvxuWhaIzR-mAKU2GvIHyX0kOVW7Xzg7cWF0';

/**
 * Persist the Supabase client across Vite HMR reloads to prevent
 * duplicate client creation. We use a no-op lock to avoid
 * navigator.locks deadlocks that block ALL Supabase queries
 * (the JS client calls getSession() internally for every request,
 * and getSession() acquires a Web Lock that can hang indefinitely
 * during HMR or in certain browser contexts).
 *
 * Bump CLIENT_VERSION whenever the client config changes so that
 * HMR picks up the new configuration instead of reusing a stale client.
 */
const CLIENT_VERSION = 2;
const globalForSupabase = globalThis as unknown as {
  __supabase?: SupabaseClient;
  __supabaseVersion?: number;
};

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Bypass navigator.locks — prevents getSession() from hanging,
      // which in turn prevents ALL data queries from hanging.
      // Cross-tab auth sync is not needed for this app.
      lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
        return await fn();
      },
    },
  });
}

// Reuse cached client if version matches, otherwise create fresh
const isCurrent = globalForSupabase.__supabase && globalForSupabase.__supabaseVersion === CLIENT_VERSION;

export const supabase = isCurrent
  ? globalForSupabase.__supabase!
  : createSupabaseClient();

globalForSupabase.__supabase = supabase;
globalForSupabase.__supabaseVersion = CLIENT_VERSION;
