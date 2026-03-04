/**
 * PublishDialog - Enhanced publish modal with description, tags, category, and filter chain toggle.
 * Shown before sharing a texture to the community.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, X, Eye, EyeOff, Tag, FolderOpen } from 'lucide-react';
import { CATEGORIES, type Category } from '@/stores/communityStore';

export interface PublishDialogResult {
  description: string;
  tags: string[];
  category: string;
  showFilterChain: boolean;
}

interface PublishDialogProps {
  open: boolean;
  documentName: string;
  isPublishing: boolean;
  publishError: string | null;
  onClose: () => void;
  onPublish: (result: PublishDialogResult) => void;
}

export default function PublishDialog({
  open,
  documentName,
  isPublishing,
  publishError,
  onClose,
  onPublish,
}: PublishDialogProps) {
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [showFilterChain, setShowFilterChain] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on outside click
  useEffect(() => {
    if (!showCategoryDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCategoryDropdown]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDescription('');
      setTagInput('');
      setTags([]);
      setCategory('');
      setShowFilterChain(true);
    }
  }, [open]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag();
      }
      if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [handleAddTag, tagInput, tags],
  );

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSubmit = useCallback(() => {
    onPublish({
      description: description.trim(),
      tags,
      category,
      showFilterChain,
    });
  }, [description, tags, category, showFilterChain, onPublish]);

  if (!open) return null;

  // Filter out "All" from categories for selection
  const selectableCategories = CATEGORIES.filter((c) => c !== 'All');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={() => !isPublishing && onClose()}
    >
      <div
        className="bg-[#1A1A19] border border-[#333] rounded-xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#E0FF29]" />
            <h3 className="text-sm font-semibold text-white">Share to Community</h3>
          </div>
          <button
            onClick={() => !isPublishing && onClose()}
            className="p-1 text-[#525252] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Document name preview */}
          <div>
            <p className="text-xs text-[#525252] mb-1">Texture</p>
            <p className="text-sm text-[#D6D1CB] font-medium">{documentName}</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#A6A6A6] mb-1.5 block">
              Description <span className="text-[#525252]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your texture..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[#0E0E0E] border border-[#333] rounded-lg text-white placeholder-[#525252] outline-none focus:border-[#E0FF29]/60 transition-colors resize-none"
            />
            <p className="text-[10px] text-[#525252] text-right mt-0.5">
              {description.length}/500
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-[#A6A6A6] mb-1.5 block flex items-center gap-1">
              <FolderOpen size={11} />
              Category
            </label>
            <div className="relative" ref={categoryRef}>
              <button
                onClick={() => setShowCategoryDropdown((p) => !p)}
                className="w-full h-9 px-3 text-sm text-left bg-[#0E0E0E] border border-[#333] rounded-lg text-white outline-none focus:border-[#E0FF29]/60 transition-colors flex items-center justify-between"
              >
                <span className={category ? 'text-white' : 'text-[#525252]'}>
                  {category || 'Select a category'}
                </span>
                <svg
                  className="w-3 h-3 text-[#525252]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showCategoryDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#1A1A19] border border-[#333] rounded-lg shadow-xl z-10 py-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setCategory('');
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      !category
                        ? 'text-[#E0FF29] bg-[#E0FF29]/5'
                        : 'text-[#A6A6A6] hover:bg-[#252524] hover:text-white'
                    }`}
                  >
                    None
                  </button>
                  {selectableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        category === cat
                          ? 'text-[#E0FF29] bg-[#E0FF29]/5'
                          : 'text-[#D6D1CB] hover:bg-[#252524] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-[#A6A6A6] mb-1.5 block flex items-center gap-1">
              <Tag size={11} />
              Tags <span className="text-[#525252]">(optional, press Enter to add)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0E0E0E] border border-[#333] rounded-lg focus-within:border-[#E0FF29]/60 transition-colors min-h-[36px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-[#1A1A19] border border-[#333] rounded-full text-[#D6D1CB]"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#525252] hover:text-white"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Add tags...' : ''}
                className="flex-1 min-w-[80px] text-xs bg-transparent text-white placeholder-[#525252] outline-none"
              />
            </div>
          </div>

          {/* Show Filter Chain Toggle */}
          <div className="flex items-start gap-3 p-3 bg-[#0E0E0E] border border-[#333] rounded-lg">
            <button
              onClick={() => setShowFilterChain((p) => !p)}
              className={`shrink-0 w-10 h-5 rounded-full transition-colors relative mt-0.5 ${
                showFilterChain ? 'bg-[#E0FF29]' : 'bg-[#333]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                  showFilterChain ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <p className="text-xs font-medium text-[#D6D1CB] flex items-center gap-1.5">
                {showFilterChain ? <Eye size={12} /> : <EyeOff size={12} />}
                Show Filter Chain
              </p>
              <p className="text-[11px] text-[#525252] mt-0.5 leading-relaxed">
                {showFilterChain
                  ? 'Others can open and edit your full node graph.'
                  : 'Only the output texture will be shared. Your nodes stay private.'}
              </p>
            </div>
          </div>

          {/* Error */}
          {publishError && (
            <p className="text-xs text-red-400 p-2.5 bg-red-400/10 rounded-lg border border-red-400/20">
              {publishError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#262626]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#A6A6A6]"
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="bg-[#E0FF29] hover:bg-[#f0ff80] text-[#131312] gap-1.5 px-5"
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Share2 size={12} />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
