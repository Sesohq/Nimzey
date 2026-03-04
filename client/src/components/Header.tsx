import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { ArrowLeft, Check, Undo2, Redo2, LogIn, LogOut, FolderOpen, Image, Share2, Loader2, CheckCircle2, Shield } from 'lucide-react';
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
    <header className="bg-[#131312] text-white px-3 py-2 flex justify-between items-center shadow-md border-b border-[#333]">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 text-[#A6A6A6] hover:text-white rounded hover:bg-[#1A1A19] transition-colors"
            title="Back to documents"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <img src={nimzeyLogo} alt="NIMZEY" className="h-7 w-7" />
        <h1 className="text-base font-bold">NIMZEY</h1>

        {documentName && (
          <>
            <span className="text-[#525252] text-sm">/</span>
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
                  className="h-6 px-2 text-sm bg-[#1A1A19] border border-[#E0FF29] rounded text-white outline-none"
                />
                <button onClick={commitRename} className="p-1 text-[#E0FF29] hover:text-[#f0ff80]">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <span
                className="text-sm text-[#D6D1CB] cursor-pointer hover:text-white transition-colors"
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
              className="p-1.5 rounded hover:bg-[#1A1A19] transition-colors disabled:opacity-25 disabled:cursor-default text-[#A6A6A6] hover:text-white disabled:hover:text-[#A6A6A6] disabled:hover:bg-transparent"
              title="Undo (Cmd+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded hover:bg-[#1A1A19] transition-colors disabled:opacity-25 disabled:cursor-default text-[#A6A6A6] hover:text-white disabled:hover:text-[#A6A6A6] disabled:hover:bg-transparent"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        )}
        <span className="text-[10px] text-[#525252]">Auto-saved</span>

        {/* Share to Community */}
        {isAuthenticated && onPublish && (
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 text-xs gap-1.5 ${
              isPublished
                ? 'text-[#E0FF29] hover:text-[#f0ff80]'
                : 'text-[#A6A6A6] hover:text-white'
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

        <button
          onClick={onNewProject}
          className="h-7 px-4 text-[11px] font-medium bg-[#E0FF29] text-[#131312] rounded-full hover:bg-[#f0ff80] transition-colors"
        >
          New
        </button>

        {/* Auth section */}
        {!loading && (
          <>
            {isAuthenticated ? (
              /* User menu */
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#1A1A19] transition-colors"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-[#E0FF29] flex items-center justify-center text-[11px] font-medium text-[#131312]">
                      {initials}
                    </div>
                  )}
                  <span className="text-xs text-[#D6D1CB] max-w-[80px] truncate hidden sm:block">
                    {displayName}
                  </span>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1A19] border border-[#333] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#333]">
                      <p className="text-xs font-medium text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-[#525252] truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); setLocation('/'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#D6D1CB] hover:bg-[#252524] hover:text-white transition-colors"
                    >
                      <FolderOpen size={13} />
                      My Documents
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setLocation('/textures'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#D6D1CB] hover:bg-[#252524] hover:text-white transition-colors"
                    >
                      <Image size={13} />
                      Textures
                    </button>
                    {profile?.is_admin && (
                      <button
                        onClick={() => { setShowUserMenu(false); setLocation('/admin'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#D6D1CB] hover:bg-[#252524] hover:text-white transition-colors"
                      >
                        <Shield size={13} />
                        Admin
                      </button>
                    )}
                    <div className="border-t border-[#333]" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#D6D1CB] hover:bg-[#252524] hover:text-red-400 transition-colors"
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#D6D1CB] hover:text-white hover:bg-[#1A1A19] rounded transition-colors ml-1"
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
