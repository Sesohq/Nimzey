import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { ArrowLeft, Check, Undo2, Redo2, LogIn, LogOut, FolderOpen, Users, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/stores/authStore';

interface HeaderProps {
  onNewProject: () => void;
  documentName?: string;
  onRename?: (name: string) => void;
  onBack?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onPublish?: () => void;
  isPublishing?: boolean;
  isPublished?: boolean;
}

export default function Header({ onNewProject, documentName, onRename, onBack, onUndo, onRedo, canUndo, canRedo, onPublish, isPublishing, isPublished }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, profile, user, signOut, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const startEditing = useCallback(() => {
    if (!onRename || !documentName) return;
    setEditValue(documentName);
    setIsEditing(true);
  }, [documentName, onRename]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && onRename) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, onRename]);

  const handleSignOut = useCallback(async () => {
    setShowUserMenu(false);
    await signOut();
    setLocation('/');
  }, [signOut, setLocation]);

  // Get display name or fallback
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || null;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-darkBg text-white px-3 py-2 flex justify-between items-center shadow-md border-b border-zinc-800">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
            title="Back to documents"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <img src={nimzeyLogo} alt="NIMZEY" className="h-7 w-7" />
        <h1 className="text-base font-bold">NIMZEY</h1>

        {documentName && (
          <>
            <span className="text-zinc-600 text-sm">/</span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="h-6 px-2 text-sm bg-zinc-800 border border-zinc-600 rounded text-white outline-none focus:border-blue-500"
                />
                <button onClick={commitRename} className="p-1 text-blue-400 hover:text-blue-300">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <span
                className="text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors"
                onClick={startEditing}
                title="Click to rename"
              >
                {documentName}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        {onUndo && onRedo && (
          <div className="flex items-center gap-0.5 mr-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-default text-zinc-400 hover:text-white disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
              title="Undo (Cmd+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-default text-zinc-400 hover:text-white disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        )}
        <span className="text-[10px] text-zinc-600">Auto-saved</span>

        {/* Share to Community */}
        {isAuthenticated && onPublish && (
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 text-xs gap-1.5 ${
              isPublished
                ? 'text-green-400 hover:text-green-300'
                : 'text-zinc-400 hover:text-white'
            }`}
            onClick={onPublish}
            disabled={isPublishing || isPublished}
          >
            {isPublishing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Publishing...
              </>
            ) : isPublished ? (
              <>
                <CheckCircle2 size={12} />
                Shared
              </>
            ) : (
              <>
                <Share2 size={12} />
                Share
              </>
            )}
          </Button>
        )}

        <Button
          size="sm"
          variant="default"
          className="bg-primary hover:bg-primary/90 h-7 text-xs"
          onClick={onNewProject}
        >
          New
        </Button>

        {/* Auth section */}
        {!loading && (
          <>
            {isAuthenticated ? (
              /* User menu */
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-zinc-800 transition-colors"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-medium text-white">
                      {initials}
                    </div>
                  )}
                  <span className="text-xs text-zinc-300 max-w-[80px] truncate hidden sm:block">
                    {displayName}
                  </span>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                    <div className="px-3 py-2 border-b border-zinc-700">
                      <p className="text-xs font-medium text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); setLocation('/'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <FolderOpen size={13} />
                      My Documents
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setLocation('/community'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <Users size={13} />
                      Community
                    </button>
                    <div className="border-t border-zinc-700" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In button */
              <button
                onClick={() => setLocation('/login')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors ml-1"
              >
                <LogIn size={13} />
                Sign In
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
