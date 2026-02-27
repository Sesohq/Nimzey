import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import nimzeyLogo from '@/assets/nimzey-logo.png';
import { ArrowLeft, Check } from 'lucide-react';

interface HeaderProps {
  onNewProject: () => void;
  documentName?: string;
  onRename?: (name: string) => void;
  onBack?: () => void;
}

export default function Header({ onNewProject, documentName, onRename, onBack }: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && onRename) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, onRename]);

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
        <span className="text-[10px] text-zinc-600">Auto-saved</span>
        <Button
          size="sm"
          variant="default"
          className="bg-primary hover:bg-primary/90 h-7 text-xs"
          onClick={onNewProject}
        >
          New
        </Button>
      </div>
    </header>
  );
}
