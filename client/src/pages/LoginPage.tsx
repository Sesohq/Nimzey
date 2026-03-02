/**
 * LoginPage - Dark-themed authentication page with Google OAuth and email/password.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/stores/authStore';
import nimzeyLogo from '@/assets/nimzey-logo.png';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, error, signInWithGoogle, signInWithEmail, signUp, clearError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Support username login: if no @ sign, append @nimzey.app
      const loginEmail = email.includes('@') ? email : `${email}@nimzey.app`;
      if (mode === 'signup') {
        await signUp(loginEmail, password, displayName || email);
      } else {
        await signInWithEmail(loginEmail, password);
      }
    } finally {
      setSubmitting(false);
    }
  }, [mode, email, password, displayName, signInWithEmail, signUp]);

  const toggleMode = useCallback(() => {
    clearError();
    setMode(prev => prev === 'signin' ? 'signup' : 'signin');
  }, [clearError]);

  const isLoading = loading || submitting;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={nimzeyLogo} alt="NIMZEY" className="h-12 w-12 mb-3" />
          <h1 className="text-xl font-bold text-white">NIMZEY</h1>
          <p className="text-sm text-zinc-500 mt-1">Texture & Filter Editor</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-base font-medium text-white mb-5 text-center">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {/* Google OAuth button */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-zinc-700" />
            <span className="px-3 text-xs text-zinc-500">or continue with email</span>
            <div className="flex-1 border-t border-zinc-700" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1" htmlFor="displayName">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1" htmlFor="email">
                {mode === 'signin' ? 'Email or Username' : 'Email'}
              </label>
              <input
                id="email"
                type={mode === 'signup' ? 'email' : 'text'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={mode === 'signin' ? 'username or you@example.com' : 'you@example.com'}
                required
                autoComplete={mode === 'signup' ? 'email' : 'username'}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                required
                minLength={mode === 'signup' ? 6 : 1}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="px-3 py-2 bg-red-950/50 border border-red-900 rounded-md">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-4 text-center text-xs text-zinc-500">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={toggleMode}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Skip for now */}
        <p className="mt-4 text-center text-xs text-zinc-600">
          <button
            onClick={() => setLocation('/')}
            className="hover:text-zinc-400 transition-colors"
          >
            Continue without signing in
          </button>
        </p>
      </div>
    </div>
  );
}
