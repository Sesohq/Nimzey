/**
 * AuthCallback - Handles OAuth redirect after Google sign-in.
 * Shows a loading state while the session is established, then redirects to home.
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import nimzeyLogo from '@/assets/nimzey-logo.png';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase handles the hash fragment automatically when using PKCE flow.
        // We just need to get the session once it's ready.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error.message);
        }

        // Small delay to let authStore pick up the session change
        setTimeout(() => {
          setLocation('/');
        }, 500);
      } catch (err) {
        console.error('Auth callback exception:', err);
        setLocation('/login');
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <img src={nimzeyLogo} alt="NIMZEY" className="h-10 w-10 animate-pulse" />
      <p className="text-sm text-zinc-400">Signing you in...</p>
      <svg className="animate-spin h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
