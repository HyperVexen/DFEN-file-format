import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Novel, Slide } from './types';
import { INITIAL_NOVEL } from './constants';
import Ribbon from './components/Ribbon';
import SlideNavigator from './components/SlideNavigator';
import EditorPanel from './components/EditorPanel';
import PropertiesPanel from './components/PropertiesPanel';
import StatusBar from './components/StatusBar';
import ContextMenu, { ContextMenuItem } from './components/ContextMenu';
import FindReplacePanel from './components/FindReplacePanel';
import SettingsModal from './components/SettingsModal';

// --- Utility Functions ---
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const deepCloneWithNewIds = (slide: Slide): Slide => {
    const newSlide: Slide = {
        ...slide,
        id: generateId(slide.extracts ? 'chapter' : 'extract'),
    };
    if (slide.extracts) {
        newSlide.extracts = slide.extracts.map(extract => deepCloneWithNewIds(extract));
    }
    return newSlide;
};

const findSlideAndContext = (novel: Novel, slideId: string): { slide: Slide | null; parentArray: Slide[] | null; index: number; parentChapter: Slide | null } => {
    for (let i = 0; i < novel.slides.length; i++) {
        const chapter = novel.slides[i];
        if (chapter.id === slideId) {
            return { slide: chapter, parentArray: novel.slides, index: i, parentChapter: null };
        }
        if (chapter.extracts) {
            for (let j = 0; j < chapter.extracts.length; j++) {
                const extract = chapter.extracts[j];
                if (extract.id === slideId) {
                    return { slide: extract, parentArray: chapter.extracts, index: j, parentChapter: chapter };
                }
            }
        }
    }
    return { slide: null, parentArray: null, index: -1, parentChapter: null };
};

const novelToDfn = (novel: Novel): string => {
    let dfnString = `[title]${novel.title}[/title]\n\n`;
    
    novel.slides.forEach(chapter => {
        dfnString += `---CHAPTER: ${chapter.title}---\n`;
        dfnString += `[status]${chapter.status}[/status]\n`;
        dfnString += `${chapter.content}\n\n`;
        
        if (chapter.extracts) {
            chapter.extracts.forEach(extract => {
                dfnString += `---EXTRACT: ${extract.title}---\n`;
                dfnString += `[status]${extract.status}[/status]\n`;
                dfnString += `${extract.content}\n\n`;
            });
        }
    });
    return dfnString.trim();
};

const loadInitialNovel = (): Novel => {
    try {
        const savedData = localStorage.getItem('dfn-novel-autosave');
        if (savedData) {
            const savedNovel = JSON.parse(savedData);
            if (savedNovel && typeof savedNovel.title === 'string' && Array.isArray(savedNovel.slides)) {
                return savedNovel;
            }
        }
    } catch (error) {
        console.error("Failed to load novel from localStorage:", error);
    }
    return INITIAL_NOVEL;
};

type SearchResult = {
  slideId: string;
  start: number;
  end: number;
};

const initialNovelData = loadInitialNovel();

const App: React.FC = () => {
  const [history, setHistory] = useState<Novel[]>([initialNovelData]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const novel = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const [activeSlideId, setActiveSlideId] = useState<string | null>(initialNovelData.slides[0]?.id || null);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isCodeView, setIsCodeView] = useState(false);
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: string | boolean }>({});
  const [clipboard, setClipboard] = useState<Slide | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string | null; show: boolean }>({ x: 0, y: 0, slideId: null, show: false });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(() => localStorage.getItem('dfn-novel-autosave') ? 'saved' : 'idle');
  
  // Theme State
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('dfn-theme') || 'minimalist-black');

  // Find & Replace State
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const commitChange = useCallback((newNovel: Novel) => {
    const currentNovel = history[historyIndex];
    if (JSON.stringify(currentNovel) === JSON.stringify(newNovel)) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNovel);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const activeSlide = useMemo(() => {
    if (!activeSlideId) return null;
    return findSlideAndContext(novel, activeSlideId).slide;
  }, [novel, activeSlideId]);

  const updateSlide = useCallback((slideId: string, updates: Partial<Slide>) => {
    const newNovel = JSON.parse(JSON.stringify(novel));
    const { slide } = findSlideAndContext(newNovel, slideId);
    if (slide) {
        Object.assign(slide, updates);
        commitChange(newNovel);
    }
  }, [novel, commitChange]);

  const handleSelectSlide = (id: string) => {
    setActiveSlideId(id);
    setContextMenu({ ...contextMenu, show: false });
  };
  
  const handleContentChange = useCallback((newContent: string) => {
    if (activeSlideId) {
        updateSlide(activeSlideId, { content: newContent });
    }
  }, [activeSlideId, updateSlide]);

  const handleTitleChange = useCallback((newTitle: string) => {
    if (activeSlideId) {
        updateSlide(activeSlideId, { title: newTitle });
    }
  }, [activeSlideId, updateSlide]);

  const handleStatusChange = useCallback((newStatus: Slide['status']) => {
    if (activeSlideId) {
        updateSlide(activeSlideId, { status: newStatus });
    }
  }, [activeSlideId, updateSlide]);
  
  const handleAddSlide = useCallback((parentId?: string) => {
      const newNovel = JSON.parse(JSON.stringify(novel));
      const isExtract = !!parentId;
      const newSlide: Slide = {
        id: generateId(isExtract ? 'extract' : 'chapter'),
        title: isExtract ? 'New Extract' : 'New Chapter',
        content: '',
        status: 'draft',
      };

      if (parentId) {
        const { slide: parentSlide } = findSlideAndContext(newNovel, parentId);
        if (parentSlide) {
          if (!parentSlide.extracts) parentSlide.extracts = [];
          parentSlide.extracts.push(newSlide);
        }
      } else {
        newNovel.slides.push(newSlide);
      }
      setActiveSlideId(newSlide.id);
      commitChange(newNovel);
  }, [novel, commitChange]);

  const handleDeleteSlide = useCallback((slideId: string) => {
    const newNovel = JSON.parse(JSON.stringify(novel));
    const { parentArray, index } = findSlideAndContext(newNovel, slideId);
    if (parentArray && index > -1) {
        parentArray.splice(index, 1);
        if (activeSlideId === slideId) {
            const nextSlide = newNovel.slides[0]?.extracts?.[0] || newNovel.slides[0] || null;
            setActiveSlideId(nextSlide?.id || null);
        }
    }
    commitChange(newNovel);
  }, [novel, activeSlideId, commitChange]);
  
  const handleDuplicateSlide = useCallback((slideId: string) => {
    const newNovel = JSON.parse(JSON.stringify(novel));
    const { slide, parentArray, index } = findSlideAndContext(newNovel, slideId);
    if(slide && parentArray) {
        const newSlide = deepCloneWithNewIds(slide);
        newSlide.title = `${slide.title} (Copy)`;
        parentArray.splice(index + 1, 0, newSlide);
        setActiveSlideId(newSlide.id);
        commitChange(newNovel);
    }
  }, [novel, commitChange]);

  const handleCopySlide = (slideId: string) => {
      const { slide } = findSlideAndContext(novel, slideId);
      if(slide) {
        setClipboard(JSON.parse(JSON.stringify(slide)));
      }
  };

  const handleCutSlide = useCallback((slideId: string) => {
      handleCopySlide(slideId);
      handleDeleteSlide(slideId);
  }, [handleDeleteSlide]);

  const handlePasteSlide = useCallback((targetSlideId: string | null) => {
    if (!clipboard) return;
    const newNovel = JSON.parse(JSON.stringify(novel));
    const slideToPaste = deepCloneWithNewIds(clipboard);
    const isPastingChapter = slideToPaste.extracts !== undefined;

    if (targetSlideId === null) {
        if (isPastingChapter) {
            newNovel.slides.push(slideToPaste);
            setActiveSlideId(slideToPaste.id);
        }
    } else {
        const { slide: targetSlide, index: targetIndex, parentChapter: targetParentChapter } = findSlideAndContext(newNovel, targetSlideId);
        if (!targetSlide) return;

        if (isPastingChapter) {
            const chapterToInsertAfter = targetParentChapter || targetSlide;
            const chapterIndex = newNovel.slides.findIndex(s => s.id === chapterToInsertAfter.id);
            if (chapterIndex > -1) {
                newNovel.slides.splice(chapterIndex + 1, 0, slideToPaste);
                setActiveSlideId(slideToPaste.id);
            }
        } else { 
            const chapterToInsertInto = targetParentChapter ? targetParentChapter : targetSlide;
            if (chapterToInsertInto.extracts === undefined) return;
            if (!chapterToInsertInto.extracts) chapterToInsertInto.extracts = [];
            const insertIndex = targetParentChapter ? targetIndex + 1 : chapterToInsertInto.extracts.length;
            chapterToInsertInto.extracts.splice(insertIndex, 0, slideToPaste);
            setActiveSlideId(slideToPaste.id);
        }
    }
    commitChange(newNovel);
  }, [novel, clipboard, commitChange]);

  const handleReorder = useCallback((draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
      const newNovel = JSON.parse(JSON.stringify(novel));
      const { slide: draggedSlide, parentArray: sourceParent, index: sourceIndex } = findSlideAndContext(newNovel, draggedId);
      if (!draggedSlide || !sourceParent) return;
      sourceParent.splice(sourceIndex, 1);
      const { parentArray: targetParent, index: targetIndex, slide: targetSlide } = findSlideAndContext(newNovel, targetId);
      if (!targetParent || !targetSlide) return;
      if (position === 'inside' && targetSlide.extracts !== undefined) {
          if(!targetSlide.extracts) targetSlide.extracts = [];
          targetSlide.extracts.push(draggedSlide);
      } else {
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          targetParent.splice(insertIndex, 0, draggedSlide);
      }
      commitChange(newNovel);
  }, [novel, commitChange]);
    
  const handleFormat = useCallback((command: string, value?: string) => {
    if (isCodeView) {
        if (!editorRef.current || !activeSlideId) return;
        const textarea = editorRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start === end && command !== 'fontSize' && command !== 'foreColor') return;

        const selectedText = textarea.value.substring(start, end);
        let newText;

        const commandToTag: { [key: string]: string } = { bold: 'b', italic: 'i', underline: 'u', strikeThrough: 's' };
        const tag = commandToTag[command];

        if (tag) newText = `[${tag}]${selectedText}[/${tag}]`;
        else if (command === 'foreColor' && value) newText = `[color=${value}]${selectedText}[/color]`;
        else if (command === 'fontSize' && value) newText = `[size=${value}]${selectedText}[/size]`;
        else return;

        const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        updateSlide(activeSlideId, { content: newContent });

        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                const newCursorPos = start === end ? start + newText.indexOf(']') + 1 : start + newText.length;
                editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);

    } else { // WYSIWYG
        if (['bold', 'italic', 'underline', 'strikeThrough', 'foreColor'].includes(command)) {
            document.execCommand(command, false, value);
        } else if (command === 'fontSize' && value) {
            const selection = window.getSelection();
            if (selection?.rangeCount) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = `${value}px`;
                range.collapsed ? range.insertNode(span) : range.surroundContents(span);
            }
        }
        const editor = document.querySelector('[contenteditable="true"]');
        if (editor) editor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }, [isCodeView, activeSlideId, updateSlide]);

  const handleImport = () => { /* Placeholder */ };
  const handleExport = useCallback(() => {
    const content = novelToDfn(novel);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${novel.title.replace(/\s+/g, '_') || 'novel'}.dfn`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }, [novel]);

  const handleUndo = useCallback(() => canUndo && setHistoryIndex(historyIndex - 1), [canUndo, historyIndex]);
  const handleRedo = useCallback(() => canRedo && setHistoryIndex(historyIndex + 1), [canRedo, historyIndex]);

  // --- Auto-save ---
  useEffect(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
        try {
            localStorage.setItem('dfn-novel-autosave', JSON.stringify(novel));
            setSaveStatus('saved');
        } catch (error) { console.error("Failed to save novel:", error); }
    }, 1000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [novel]);

  useEffect(() => {
      if (saveStatus === 'saved') {
          const timer = setTimeout(() => setSaveStatus('idle'), 2000);
          return () => clearTimeout(timer);
      }
  }, [saveStatus]);
  
  // --- Theme ---
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('dfn-theme', theme);
  }, [theme]);

  // --- Context Menu ---
  const handleContextMenu = (event: React.MouseEvent, slideId: string | null) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, slideId, show: true });
  };
  const handleCloseContextMenu = () => setContextMenu({ ...contextMenu, show: false });
  const getContextMenuItems = (): ContextMenuItem[] => {
    const { slideId } = contextMenu;
    if (slideId === null) return [
        { label: 'Add Chapter', action: () => handleAddSlide() },
        { label: 'Paste', action: () => handlePasteSlide(null), disabled: !clipboard || clipboard.extracts === undefined }
    ];
    const { slide } = findSlideAndContext(novel, slideId);
    if (!slide) return [];
    return [
      ...(!!slide.extracts ? [{ label: 'Add Extract', action: () => handleAddSlide(slideId) }] : []),
      { label: 'Duplicate', action: () => handleDuplicateSlide(slideId) },
      { label: 'Copy', action: () => handleCopySlide(slideId) },
      { label: 'Cut', action: () => handleCutSlide(slideId) },
      { label: 'Paste', action: () => handlePasteSlide(slideId), disabled: !clipboard },
      { label: 'Delete', action: () => handleDeleteSlide(slideId) }
    ];
  };

  useEffect(() => {
    const handleGlobalClick = () => handleCloseContextMenu();
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && handleCloseContextMenu();
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleEsc);
    }
  }, []);

  // --- Find & Replace ---
  const performSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      setCurrentMatchIndex(-1);
      return;
    }
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const searchInSlide = (slide: Slide) => {
      const contentLower = slide.content.toLowerCase();
      let lastIndex = -1;
      while ((lastIndex = contentLower.indexOf(queryLower, lastIndex + 1)) !== -1) {
        results.push({ slideId: slide.id, start: lastIndex, end: lastIndex + query.length });
      }
    };
    novel.slides.forEach(chapter => {
      searchInSlide(chapter);
      chapter.extracts?.forEach(extract => searchInSlide(extract));
    });
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentMatchIndex(0);
      setActiveSlideId(results[0].slideId);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [novel]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    const nextIndex = direction === 'next'
      ? (currentMatchIndex + 1) % searchResults.length
      : (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
    setActiveSlideId(searchResults[nextIndex].slideId);
  };

  const handleReplace = useCallback((replaceWith: string) => {
    if (searchResults.length === 0 || currentMatchIndex === -1) return;
    const match = searchResults[currentMatchIndex];
    const newNovel = JSON.parse(JSON.stringify(novel));
    const { slide } = findSlideAndContext(newNovel, match.slideId);
    if (slide) {
      slide.content = slide.content.substring(0, match.start) + replaceWith + slide.content.substring(match.end);
      commitChange(newNovel);
      // Re-run search after replacing. This resets to the first match, which is a simple and robust behavior.
      setTimeout(() => performSearch(searchQuery), 50);
    }
  }, [novel, searchResults, currentMatchIndex, searchQuery, commitChange, performSearch]);

  const handleReplaceAll = useCallback((find: string, replaceWith: string) => {
    if (!find) return;
    const newNovel = JSON.parse(JSON.stringify(novel));
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const replaceInSlide = (slide: Slide) => { slide.content = slide.content.replace(regex, replaceWith); };
    newNovel.slides.forEach(chapter => {
      replaceInSlide(chapter);
      chapter.extracts?.forEach(extract => replaceInSlide(extract));
    });
    commitChange(newNovel);
    performSearch('');
    setIsFindOpen(false);
  }, [novel, commitChange, performSearch]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const isCtrl = event.ctrlKey || event.metaKey;
        if ((event.target as HTMLElement).closest('.z-30')) return; // Ignore keydowns in find panel
        if ((event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'SELECT') return;

        if (isCtrl) {
            switch (event.key.toLowerCase()) {
                case 'z': event.preventDefault(); event.shiftKey ? handleRedo() : handleUndo(); break;
                case 'y': event.preventDefault(); handleRedo(); break;
                case 'b': event.preventDefault(); handleFormat('bold'); break;
                case 'i': event.preventDefault(); handleFormat('italic'); break;
                case 'u': event.preventDefault(); handleFormat('underline'); break;
                case 's': event.preventDefault(); handleExport(); break;
                case 'f': event.preventDefault(); setIsFindOpen(true); break;
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleFormat, handleExport]);

  const wysiwygHighlight = useMemo(() => {
    if (!isFindOpen || currentMatchIndex === -1 || !searchQuery) return null;
    const match = searchResults[currentMatchIndex];
    if (match.slideId !== activeSlideId) return null;
    const occurrenceIndex = searchResults.slice(0, currentMatchIndex).filter(r => r.slideId === activeSlideId).length;
    return { query: searchQuery, occurrenceIndex };
  }, [isFindOpen, currentMatchIndex, searchResults, activeSlideId, searchQuery]);

  const codeHighlightRange = useMemo(() => {
    if (!isFindOpen || currentMatchIndex === -1) return null;
    const match = searchResults[currentMatchIndex];
    if (match.slideId !== activeSlideId) return null;
    return { start: match.start, end: match.end };
  }, [isFindOpen, currentMatchIndex, searchResults, activeSlideId]);

  return (
    <div className="flex flex-col h-screen bg-background text-text-primary font-sans">
      <Ribbon
        isNavOpen={isNavOpen}
        onToggleNav={() => setIsNavOpen(!isNavOpen)}
        isPropertiesOpen={isPropertiesOpen}
        onToggleProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
        isCodeView={isCodeView}
        onToggleCodeView={() => setIsCodeView(!isCodeView)}
        onFormat={handleFormat}
        onImport={handleImport}
        onExport={handleExport}
        onToggleFind={() => setIsFindOpen(!isFindOpen)}
        activeFormats={activeFormats}
      />
      <main className="flex flex-1 overflow-hidden relative">
        <SlideNavigator
          novel={novel}
          activeSlideId={activeSlideId}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onReorder={handleReorder}
          isOpen={isNavOpen}
          onContextMenu={handleContextMenu}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <EditorPanel
          activeSlide={activeSlide}
          onContentChange={handleContentChange}
          onTitleChange={handleTitleChange}
          editorRef={editorRef}
          isCodeView={isCodeView}
          onSelectionChange={setActiveFormats}
          codeHighlightRange={codeHighlightRange}
          wysiwygHighlight={wysiwygHighlight}
        />
        <PropertiesPanel
          activeSlide={activeSlide}
          onStatusChange={handleStatusChange}
          isOpen={isPropertiesOpen}
        />
        {isFindOpen && (
          <FindReplacePanel
            onFind={performSearch}
            onNavigate={navigateMatch}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            onClose={() => setIsFindOpen(false)}
            matchIndex={currentMatchIndex}
            totalMatches={searchResults.length}
          />
        )}
      </main>
      <StatusBar novel={novel} saveStatus={saveStatus} />
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        show={contextMenu.show}
        items={getContextMenuItems()}
        onClose={handleCloseContextMenu}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
};

export default App;