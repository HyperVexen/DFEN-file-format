import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface FindAndReplaceProps {
  editorRef: React.RefObject<HTMLDivElement>;
  currentPageText: string;
  onReplaceCurrentPage: (newText: string) => void;
  onReplaceAllPages: (find: string, replace: string) => void;
  onClose: () => void;
}

export const FindAndReplace: React.FC<FindAndReplaceProps> = ({
  editorRef,
  currentPageText,
  onReplaceCurrentPage,
  onReplaceAllPages,
  onClose,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scopeMenuRef = useRef<HTMLDivElement>(null);
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
      if (scopeMenuRef.current && !scopeMenuRef.current.contains(event.target as Node)) {
        setIsScopeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleFind = (backwards = false) => {
    if (!findText || !editorRef.current) return;
    editorRef.current.focus();
    
    // To restart search from the top/bottom if nothing is found from the current position
    const selection = window.getSelection();
    if(selection) {
        // This makes find wrap around the document
        if (selection.anchorNode === editorRef.current && selection.isCollapsed) {
            selection.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(backwards); // true for previous (end), false for next (start)
            selection.addRange(range);
        }
    }
    
    // FIX: The `window.find` method is non-standard and not in the default TypeScript lib definitions.
    // Cast to `any` to allow its use.
    (window as any).find(findText, false, backwards, true, false, true, false);
  };
  
  const handleReplace = () => {
    if (!findText || !editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    // Only replace if the selection matches the find text (case-insensitive)
    if (selection && selection.toString().toLowerCase() === findText.toLowerCase()) {
        document.execCommand('insertText', false, replaceText);
        // Dispatch input event to notify editor of change
        editorRef.current.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
    // Find the next occurrence
    handleFind();
  };
  
  const handleReplaceAll = (scope: 'current' | 'all') => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    
    if (scope === 'current') {
      const newText = currentPageText.replace(regex, replaceText);
      onReplaceCurrentPage(newText);
    } else {
      onReplaceAllPages(findText, replaceText);
    }
    setIsScopeMenuOpen(false);
    onClose();
  };

  const inputClasses = "w-full bg-brand-bg-dark border border-brand-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm";
  const buttonClasses = "px-3 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-2 right-0 z-20 w-96 bg-brand-surface/90 backdrop-blur-md border border-brand-border rounded-xl shadow-2xl shadow-black/50 p-4 animate-fade-in"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-md text-brand-text-primary">Find & Replace</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-brand-text-secondary">
          <Icon name="delete" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Find"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          className={inputClasses}
          autoFocus
        />
        <input
          type="text"
          placeholder="Replace with"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
         <div className="flex items-center gap-1">
            <button onClick={() => handleFind(true)} disabled={!findText} className={`${buttonClasses} bg-brand-bg-light hover:bg-white/5`} title="Find Previous">
              <Icon name="chevron-up" className="w-5 h-5" />
            </button>
            <button onClick={() => handleFind(false)} disabled={!findText} className={`${buttonClasses} bg-brand-bg-light hover:bg-white/5`} title="Find Next">
              <Icon name="chevron-down" className="w-5 h-5" />
            </button>
         </div>

         <div className="flex items-center gap-2">
            <button onClick={handleReplace} disabled={!findText} className={`${buttonClasses} bg-brand-bg-light hover:bg-white/5`}>
              Replace
            </button>
            
            <div className="relative" ref={scopeMenuRef}>
              <button
                onClick={() => setIsScopeMenuOpen(prev => !prev)}
                disabled={!findText}
                className={`${buttonClasses} bg-brand-accent hover:bg-brand-accent-hover text-white flex items-center gap-1`}
              >
                Replace All
                <Icon name="chevron-down" className="w-4 h-4" />
              </button>
              {isScopeMenuOpen && (
                 <div className="absolute bottom-full mb-2 right-0 z-10 w-48 bg-brand-surface border border-brand-border rounded-lg shadow-2xl p-2 animate-fade-in">
                    <button
                      onClick={() => handleReplaceAll('current')}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm"
                    >
                      In This Page
                    </button>
                    <button
                      onClick={() => handleReplaceAll('all')}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm"
                    >
                      In All Pages
                    </button>
                 </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};