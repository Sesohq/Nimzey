/**
 * AuthStore - React hook for Supabase authentication state management.
 * Provides sign-in, sign-up, sign-out, and session persistence via onAuthStateChange.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Singleton state so all components share the same auth state.
 * We use a simple pub/sub pattern to avoid external state libraries.
 */
let globalState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
};

type Listener = (state: AuthState) => void;
const listeners = new Set<Listener>();
let initialized = false;

function setState(patch: Partial<AuthState>) {
  globalState = { ...globalState, ...patch };
  listeners.forEach(fn => fn(globalState));
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Failed to fetch profile:', error.message);
    return null;
  }
  return data as Profile;
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

/** Max time we'll wait for initial auth before giving up and showing the page. */
const AUTH_TIMEOUT_MS = 5000;

function initAuth() {
  if (initialized) return;
  initialized = true;

  // Get initial session — timeout prevents infinite hang from stale Web Locks
  withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS, 'getSession')
    .then(async ({ data: { session } }) => {
      if (session?.user) {
        // If profile fetch fails, still keep the user authenticated
        let profile: Profile | null = null;
        try {
          profile = await withTimeout(
            fetchProfile(session.user.id),
            AUTH_TIMEOUT_MS,
            'fetchProfile',
          );
        } catch (e) {
          console.warn('Profile fetch failed, continuing without profile:', e);
        }
        setState({ user: session.user, session, profile, loading: false });
      } else {
        setState({ loading: false });
      }
    }).catch((err) => {
      console.warn('Failed to get session:', err);
      setState({ loading: false });
    });

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setState({
        user: session.user,
        session,
        profile,
        loading: false,
        error: null,
      });
    } else {
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
      });
    }
  });
}

export function useAuth() {
  const [state, setLocalState] = useState<AuthState>(globalState);

  useEffect(() => {
    initAuth();

    const listener: Listener = (newState) => {
      setLocalState(newState);
    };
    listeners.add(listener);

    // Sync with current global state in case it changed before mount
    setLocalState(globalState);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setState({ loading: false, error: error.message });
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setState({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState({ loading: false, error: error.message });
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setState({ loading: true, error: null });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setState({ loading: false, error: error.message });
    }
  }, []);

  const signOut = useCallback(async () => {
    setState({ loading: true, error: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState({ loading: false, error: error.message });
    }
  }, []);

  const clearError = useCallback(() => {
    setState({ error: null });
  }, []);

  const isAuthenticated = !!state.user && !state.loading;

  return useMemo(() => ({
    user: state.user,
    session: state.session,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    isAuthenticated,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
    clearError,
  }), [state, isAuthenticated, signInWithGoogle, signInWithEmail, signUp, signOut, clearError]);
}
