import React, { RefObject, useCallback, useRef, useState, useEffect } from 'react';
import { Icon } from './Icon';
import { FONT_LIST } from '../constants';
import { findFontDetails, rgbToHex } from '../services/dfnParser';
import { StylingPanel } from './StylingPanel';
import { FindAndReplace } from './FindAndReplace';

interface ToolbarProps {
  editorRef: RefObject<HTMLDivElement>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showTags: boolean;
  onToggleTags: () => void;
  currentPageText: string;
  activePageIndex: number;
  onImport: (text: string) => void;
  onReplaceAllPages: (find: string, replace: string) => void;
}

export interface ActiveFormats {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontName?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  editorRef, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  showTags, 
  onToggleTags,
  currentPageText,
  activePageIndex,
  onImport,
  onReplaceAllPages,
}) => {
  const savedRangeRef = useRef<Range | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({});
  const [isStylingPanelOpen, setIsStylingPanelOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  // --- Import / Export ---
  const handleExport = useCallback(() => {
    const blob = new Blob([currentPageText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-${activePageIndex + 1}.dfn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentPageText, activePageIndex]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onImport(text);
      };
      reader.readAsText(file);
    }
    // Reset input value to allow importing the same file again
    event.target.value = '';
  };

  // --- Active Format Detection ---
  const updateActiveFormats = useCallback(() => {
    if (showTags || !editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.anchorNode) {
        setActiveFormats({});
        return;
    }

    if (!editorRef.current.contains(selection.anchorNode)) {
        setActiveFormats({});
        return;
    }

    const formats: ActiveFormats = {};
    let currentNode: Node | null = selection.anchorNode;

    while (currentNode && currentNode !== editorRef.current) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const el = currentNode as HTMLElement;
            switch (el.nodeName) {
                case 'STRONG': formats.bold = true; break;
                case 'EM': formats.italic = true; break;
                case 'U': formats.underline = true; break;
            }

            const styles = window.getComputedStyle(el);
            if (!formats.color && styles.color) formats.color = rgbToHex(styles.color);
            if (!formats.fontName && styles.fontFamily) {
                const fontName = findFontDetails('value', styles.fontFamily.split(',')[0].trim())?.name;
                if (fontName) formats.fontName = fontName;
            }
            if (!formats.fontSize && styles.fontSize) {
                 const size = Math.round(parseFloat(styles.fontSize));
                 if (!isNaN(size)) formats.fontSize = size.toString();
            }
            if (!formats.lineHeight && styles.lineHeight) formats.lineHeight = styles.lineHeight;
            if (!formats.letterSpacing && styles.letterSpacing) formats.letterSpacing = styles.letterSpacing;
            if (!formats.textTransform && styles.textTransform) formats.textTransform = styles.textTransform;
        }
        currentNode = currentNode.parentNode;
    }
    
    if (!formats.color) {
        formats.color = rgbToHex(window.getComputedStyle(editorRef.current).color);
    }
    
    setActiveFormats(formats);
  }, [editorRef, showTags]);
  
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
        const handler = () => requestAnimationFrame(updateActiveFormats);
        document.addEventListener('selectionchange', handler);
        editor.addEventListener('keyup', handler);
        editor.addEventListener('mouseup', handler);
        editor.addEventListener('focus', handler);
        
        handler();

        return () => {
            document.removeEventListener('selectionchange', handler);
            editor.removeEventListener('keyup', handler);
            editor.removeEventListener('mouseup', handler);
            editor.removeEventListener('focus', handler);
        };
    }
  }, [editorRef, updateActiveFormats]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    if (isFileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFileMenuOpen]);

  // --- Selection Management ---
  const saveSelection = useCallback(() => {
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range;
          return;
        }
      }
    }
    savedRangeRef.current = null;
  }, [editorRef]);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (editor && savedRangeRef.current) {
      editor.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
    }
  }, [editorRef]);

  // --- Core Action Logic ---
  const triggerEditorUpdate = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }, [editorRef]);

  const applyWrapper = useCallback((wrapperNode: HTMLElement) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    
    if (!editor.contains(range.commonAncestorContainer)) return;

    try {
      wrapperNode.appendChild(range.extractContents());
      range.insertNode(wrapperNode);

      selection.removeAllRanges();
      range.selectNodeContents(wrapperNode);
      range.collapse(false);
      selection.addRange(range);

      savedRangeRef.current = null;
    } catch (e) {
      console.error("Could not apply wrapper:", e);
    }

    triggerEditorUpdate();
  }, [editorRef, triggerEditorUpdate]);
  
  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  const handleSimpleTag = (tagName: 'strong' | 'em' | 'u') => {
    const wrapper = document.createElement(tagName);
    applyWrapper(wrapper);
  };

  const handleStyleChange = (styleProp: keyof CSSStyleDeclaration, value: string) => {
    const wrapper = document.createElement('span');
    wrapper.style[styleProp as any] = value;
    applyWrapper(wrapper);
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    restoreSelection();
    handleStyleChange('color', e.target.value);
    editorRef.current?.focus();
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    restoreSelection();
    if (e.target.value) {
      const fontValue = FONT_LIST.find(f => f.name === e.target.value)?.value;
      if (fontValue) {
        handleStyleChange('fontFamily', fontValue);
      }
    }
    editorRef.current?.focus();
  };
  
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    restoreSelection();
    if (e.target.value) {
      handleStyleChange('fontSize', `${e.target.value}px`);
    }
    editorRef.current?.focus();
  };
  
  const formatControlsDisabled = showTags;

  const getButtonClasses = (isActive: boolean = false) => 
    `p-2 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 ${isActive ? 'bg-brand-accent text-white hover:bg-brand-accent-hover' : ''}`;
  const selectClasses = "bg-brand-surface/50 border border-brand-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="relative flex items-center gap-2 p-2 bg-brand-surface/80 backdrop-blur-sm rounded-xl border border-brand-border flex-wrap shadow-lg shadow-black/30">
      <button onClick={onUndo} disabled={!canUndo} className={getButtonClasses()} title="Undo"><Icon name="undo" /></button>
      <button onClick={onRedo} disabled={!canRedo} className={getButtonClasses()} title="Redo"><Icon name="redo" /></button>
      
      <div className="h-6 w-px bg-brand-border/50 mx-1"></div>
      
      <button onClick={onToggleTags} className={getButtonClasses(showTags)} title={showTags ? "Hide DFN Tags" : "Show DFN Tags"}><Icon name="code" /></button>

      <div className="h-6 w-px bg-brand-border/50 mx-1"></div>

      <button onMouseDown={(e) => handleMouseDown(e, () => handleSimpleTag('strong'))} disabled={formatControlsDisabled} className={getButtonClasses(activeFormats.bold)} title="Bold"><Icon name="bold" /></button>
      <button onMouseDown={(e) => handleMouseDown(e, () => handleSimpleTag('em'))} disabled={formatControlsDisabled} className={getButtonClasses(activeFormats.italic)} title="Italic"><Icon name="italic" /></button>
      <button onMouseDown={(e) => handleMouseDown(e, () => handleSimpleTag('u'))} disabled={formatControlsDisabled} className={getButtonClasses(activeFormats.underline)} title="Underline"><Icon name="underline" /></button>
      
      <div className="h-6 w-px bg-brand-border/50 mx-1"></div>

      <button onClick={() => setIsStylingPanelOpen(prev => !prev)} className={getButtonClasses(isStylingPanelOpen)} title="Advanced Styling"><Icon name="sliders" /></button>
      
      <button onClick={() => setIsFindReplaceOpen(prev => !prev)} className={getButtonClasses(isFindReplaceOpen)} title="Find & Replace"><Icon name="search" /></button>

      <div className="h-6 w-px bg-brand-border/50 mx-1"></div>
      
      <div className="relative" title="Text Color">
        <button
          onClick={() => colorInputRef.current?.click()}
          onFocus={saveSelection}
          disabled={formatControlsDisabled}
          className="flex items-center p-2 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Icon name="textColor" color={activeFormats.color || '#e5e7eb'} />
          <Icon name="chevron-down" className="w-4 h-4 ml-1 opacity-60" />
        </button>
        <input 
          ref={colorInputRef}
          type="color" 
          value={activeFormats.color || '#e5e7eb'}
          onChange={handleColorChange} 
          disabled={formatControlsDisabled} 
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="h-6 w-px bg-brand-border/50 mx-1"></div>
      
      <select onFocus={saveSelection} onChange={handleFontChange} value={activeFormats.fontName || ''} disabled={formatControlsDisabled} className={selectClasses} title="Font Family">
        <option value="">Select Font</option>
        {FONT_LIST.map(font => <option key={font.name} value={font.name}>{font.name}</option>)}
      </select>
      
      <select onFocus={saveSelection} onChange={handleSizeChange} value={activeFormats.fontSize || ''} disabled={formatControlsDisabled} className={selectClasses} title="Font Size">
        <option value="">Font Size</option>
        {[12, 14, 16, 18, 24, 32, 48].map(size => <option key={size} value={size}>{size}px</option>)}
      </select>

      <div className="flex-grow"></div>
      
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".dfn,.txt" />

      <div className="relative" ref={fileMenuRef}>
        <button
          onClick={() => setIsFileMenuOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${isFileMenuOpen ? 'bg-white/10' : ''}`}
        >
          <span className="font-semibold text-sm">File</span>
          <Icon name="chevron-down" className="w-4 h-4 opacity-70" />
        </button>
        {isFileMenuOpen && (
          <div className="absolute top-full mt-2 right-0 z-20 w-52 bg-brand-surface/90 backdrop-blur-md border border-brand-border rounded-lg shadow-2xl shadow-black/50 p-2 animate-fade-in">
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setIsFileMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm"
            >
              <Icon name="import" />
              <span>Import from File...</span>
            </button>
            <button
              onClick={() => {
                handleExport();
                setIsFileMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm"
            >
              <Icon name="export" />
              <span>Export Current Page</span>
            </button>
          </div>
        )}
      </div>

      {isStylingPanelOpen && (
        <StylingPanel 
          editorRef={editorRef}
          activeFormats={activeFormats}
          onStyleChange={handleStyleChange}
          saveSelection={saveSelection}
          restoreSelection={restoreSelection}
          onClose={() => setIsStylingPanelOpen(false)}
        />
      )}
      {isFindReplaceOpen && (
        <FindAndReplace
          editorRef={editorRef}
          currentPageText={currentPageText}
          onReplaceCurrentPage={onImport}
          onReplaceAllPages={onReplaceAllPages}
          onClose={() => setIsFindReplaceOpen(false)}
        />
      )}
    </div>
  );
};
