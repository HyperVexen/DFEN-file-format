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
import { GoogleGenAI } from "@google/genai";
import { CutIcon, CopyIcon, PasteIcon, TrashIcon, FilePlusIcon, SparklesIcon } from './components/icons';

// --- AI Initialization ---
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

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
        
        if (!chapter.extracts || chapter.extracts.length === 0) {
            dfnString += `${chapter.content}\n\n`;
        } else {
            dfnString += '\n'; // Add blank line for container chapters
        }
        
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

const dfnToNovel = (dfnString: string): Novel => {
    const novel: Novel = { title: "Untitled Novel", slides: [] };
    const lines = dfnString.split('\n');

    let currentChapter: Slide | null = null;
    let currentExtract: Slide | null = null;
    let currentContent = '';

    const saveCurrentContent = () => {
        if (currentExtract) {
            currentExtract.content = currentContent.trim();
        } else if (currentChapter) {
            currentChapter.content = currentContent.trim();
        }
        currentContent = '';
    };

    const titleMatch = dfnString.match(/\[title\](.*?)\[\/title\]/);
    if (titleMatch) {
        novel.title = titleMatch[1];
    }

    for (const line of lines) {
        const chapterMatch = line.match(/^---CHAPTER: (.*?)---$/);
        if (chapterMatch) {
            saveCurrentContent();
            currentExtract = null;
            currentChapter = {
                id: generateId('chapter'),
                title: chapterMatch[1],
                content: '',
                status: 'draft',
                extracts: [],
            };
            novel.slides.push(currentChapter);
            continue;
        }

        const extractMatch = line.match(/^---EXTRACT: (.*?)---$/);
        if (extractMatch && currentChapter) {
            saveCurrentContent();
            currentExtract = {
                id: generateId('extract'),
                title: extractMatch[1],
                content: '',
                status: 'draft',
            };
            if (!currentChapter.extracts) currentChapter.extracts = [];
            currentChapter.extracts.push(currentExtract);
            continue;
        }
        
        const statusMatch = line.match(/^\[status\](.*?)\[\/status\]$/);
        if (statusMatch) {
            const status = statusMatch[1] as Slide['status'];
            if(currentExtract) currentExtract.status = status;
            else if(currentChapter) currentChapter.status = status;
            continue;
        }

        if (line.match(/\[title\].*?\[\/title\]/)) continue;

        currentContent += line + '\n';
    }
    saveCurrentContent();

    // Enforce container chapter rule on import
    novel.slides.forEach(chapter => {
        if (chapter.extracts && chapter.extracts.length > 0) {
            chapter.content = '';
        }
    });

    return novel;
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'generating' | 'error'>(() => localStorage.getItem('dfn-novel-autosave') ? 'saved' : 'idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('dfn-theme') || 'minimalist-black');

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
  
  const handleAddSlide = useCallback((parentId?: string, afterSlideId?: string) => {
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
          
          if (parentSlide.extracts.length === 0) {
            parentSlide.content = ''; // Chapter becomes a container
          }
          
          if (afterSlideId) {
              const insertIndex = parentSlide.extracts.findIndex(s => s.id === afterSlideId);
              if (insertIndex !== -1) {
                  parentSlide.extracts.splice(insertIndex + 1, 0, newSlide);
              } else {
                  parentSlide.extracts.push(newSlide);
              }
          } else {
               parentSlide.extracts.push(newSlide);
          }
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
            const nextSlide = parentArray[index] || parentArray[index - 1] || newNovel.slides[0]?.extracts?.[0] || newNovel.slides[0] || null;
            setActiveSlideId(nextSlide?.id || null);
        }
        commitChange(newNovel);
    }
  }, [novel, activeSlideId, commitChange]);

  const handleCopySlide = useCallback((slideId: string) => {
    const { slide } = findSlideAndContext(novel, slideId);
    if (slide) {
        setClipboard(JSON.parse(JSON.stringify(slide)));
    }
  }, [novel]);

  const handleCutSlide = useCallback((slideId: string) => {
    handleCopySlide(slideId);
    handleDeleteSlide(slideId);
  }, [handleCopySlide, handleDeleteSlide]);

  const handlePasteSlide = useCallback((targetId: string | null) => {
    if (!clipboard) return;

    const newNovel = JSON.parse(JSON.stringify(novel));
    const newSlide = deepCloneWithNewIds(clipboard);

    if (targetId) {
        const { parentArray, index, parentChapter } = findSlideAndContext(newNovel, targetId);
        const targetIsChapter = !parentChapter;

        if (newSlide.extracts) {
            if (targetIsChapter && parentArray) {
                parentArray.splice(index + 1, 0, newSlide);
            } else {
                newNovel.slides.push(newSlide);
            }
        } else {
            if (targetIsChapter && parentChapter === null) {
                const targetChapter = parentArray?.[index];
                if(targetChapter) {
                    if (!targetChapter.extracts) targetChapter.extracts = [];
                    targetChapter.extracts.push(newSlide);
                }
            } else if (!targetIsChapter && parentArray) {
                 parentArray.splice(index + 1, 0, newSlide);
            } else {
                if (newNovel.slides[0]) {
                    if (!newNovel.slides[0].extracts) newNovel.slides[0].extracts = [];
                    newNovel.slides[0].extracts.push(newSlide);
                }
            }
        }
    } else {
        if (newSlide.extracts) {
            newNovel.slides.push(newSlide);
        } else {
            if (newNovel.slides.length > 0) {
                 if (!newNovel.slides[0].extracts) newNovel.slides[0].extracts = [];
                 newNovel.slides[0].extracts.push(newSlide);
            }
        }
    }

    setActiveSlideId(newSlide.id);
    commitChange(newNovel);
  }, [clipboard, novel, commitChange]);

  const handleDuplicateSlide = useCallback((slideId: string) => {
    const newNovel = JSON.parse(JSON.stringify(novel));
    const { slide, parentArray, index } = findSlideAndContext(newNovel, slideId);
    if (slide && parentArray && index > -1) {
        const newSlide = deepCloneWithNewIds(slide);
        newSlide.title = `${newSlide.title} (Copy)`;
        parentArray.splice(index + 1, 0, newSlide);
        setActiveSlideId(newSlide.id);
        commitChange(newNovel);
    }
  }, [novel, commitChange]);

  const handleSuggestTitle = useCallback(async (slideId: string) => {
    const { slide } = findSlideAndContext(novel, slideId);
    if (!slide || !slide.content) return;

    setSaveStatus('generating');
    setStatusMessage('Suggesting title...');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest a short, compelling title for the following text. The title should be 5 words or less. Do not use quotes.
            
            TEXT:
            ---
            ${slide.content.substring(0, 2000)}
            ---
            
            TITLE:`,
        });
        const newTitle = response.text.trim().replace(/"/g, '');
        if (newTitle) {
            updateSlide(slideId, { title: newTitle });
        }
        setSaveStatus('idle');
    } catch (error) {
        console.error("AI title suggestion failed:", error);
        setSaveStatus('error');
        setStatusMessage('AI suggestion failed.');
    }
  }, [novel, updateSlide]);

  const handleReorder = useCallback((draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    const newNovel = JSON.parse(JSON.stringify(novel));

    const { slide: draggedSlide, parentArray: sourceArray, index: sourceIndex } = findSlideAndContext(newNovel, draggedId);
    if (!draggedSlide || !sourceArray || sourceIndex === -1) return;
    sourceArray.splice(sourceIndex, 1);

    const { slide: targetSlide, parentArray: targetArray, index: targetIndex } = findSlideAndContext(newNovel, targetId);
    if (!targetSlide || !targetArray || targetIndex === -1) {
        sourceArray.splice(sourceIndex, 0, draggedSlide);
        commitChange(newNovel);
        return;
    }

    if (position === 'inside') {
        if (!targetSlide.extracts) targetSlide.extracts = [];
        if (targetSlide.extracts.length === 0) {
            targetSlide.content = ''; // Chapter becomes a container
        }
        targetSlide.extracts.push(draggedSlide);
    } else if (position === 'before') {
        targetArray.splice(targetIndex, 0, draggedSlide);
    } else if (position === 'after') {
        targetArray.splice(targetIndex + 1, 0, draggedSlide);
    }
    
    commitChange(newNovel);
  }, [novel, commitChange]);

  const getContextMenuItems = (slideId: string | null): ContextMenuItem[] => {
    const { slide, parentChapter } = findSlideAndContext(novel, slideId || '');
    const isChapter = !!(slide && !parentChapter);
    const isExtract = !!(slide && parentChapter);

    const slideActions: ContextMenuItem[] = slide ? [
        { label: 'Suggest Title ✨', action: () => handleSuggestTitle(slide.id), icon: SparklesIcon, disabled: !slide.content },
        { isSeparator: true },
        { label: 'Cut', action: () => handleCutSlide(slide.id), icon: CutIcon },
        { label: 'Copy', action: () => handleCopySlide(slide.id), icon: CopyIcon },
        { label: 'Duplicate', action: () => handleDuplicateSlide(slide.id), icon: CopyIcon },
        { label: 'Paste', action: () => handlePasteSlide(slide.id), icon: PasteIcon, disabled: !clipboard },
        { isSeparator: true },
        { label: 'Delete', action: () => handleDeleteSlide(slide.id), icon: TrashIcon, isDestructive: true },
    ] : [];

    if (isChapter) {
        slideActions.splice(2, 0, { label: 'Add Extract', action: () => handleAddSlide(slide!.id), icon: FilePlusIcon });
    }
    
    if(isExtract) {
        slideActions.splice(2, 0, { label: 'Add Extract', action: () => handleAddSlide(parentChapter!.id, slide!.id), icon: FilePlusIcon });
    }

    const generalActions: ContextMenuItem[] = [
        { label: 'Add Chapter', action: () => handleAddSlide(), icon: FilePlusIcon },
        { label: 'Paste', action: () => handlePasteSlide(null), icon: PasteIcon, disabled: !clipboard },
    ];
    
    return slide ? slideActions : generalActions;
  };

  const handleExport = useCallback(() => {
    const dfnContent = novelToDfn(novel);
    const blob = new Blob([dfnContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = novel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${sanitizedTitle || 'novel'}.dfn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [novel]);
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dfn';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const newNovel = dfnToNovel(content);
                commitChange(newNovel);
                setActiveSlideId(newNovel.slides[0]?.id || null);
            };
            reader.readAsText(file);
        }
    };
    input.click();
  };

  const handleFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const handleUndo = useCallback(() => {
    if (canUndo) {
        setHistoryIndex(historyIndex - 1);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
        setHistoryIndex(historyIndex + 1);
    }
  }, [canRedo, historyIndex]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = window.setTimeout(() => {
        try {
            localStorage.setItem('dfn-novel-autosave', JSON.stringify(novel));
            setSaveStatus('saved');
        } catch (error) {
            console.error("Auto-save failed:", error);
            setSaveStatus('error');
            setStatusMessage('Save failed');
        }
    }, 1500);

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [novel]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dfn-theme', theme);
  }, [theme]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlKey = isMac ? e.metaKey : e.ctrlKey;
    const target = e.target as HTMLElement;

    const isEditingText = target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName);
    const isWysiwygEditing = target.isContentEditable;


    // --- Formatting Shortcuts (only in WYSIWYG editor) ---
    if (isWysiwygEditing && e.altKey && !isCtrlKey) {
        let formatted = false;
        switch (e.key.toLowerCase()) {
            case 'b':
                handleFormat('bold');
                formatted = true;
                break;
            case 'i':
                handleFormat('italic');
                formatted = true;
                break;
            case 'u':
                handleFormat('underline');
                formatted = true;
                break;
        }
        if (formatted) {
            e.preventDefault();
            return;
        }
    }
    
    // --- Slide Creation Shortcuts (Global) ---
    if (e.altKey && !isCtrlKey) {
        if (e.key.toLowerCase() === 'a') {
            e.preventDefault();
            handleAddSlide();
            return;
        }
        if (e.key.toLowerCase() === 'e') {
            e.preventDefault();
            if (activeSlideId) {
                const { slide, parentChapter } = findSlideAndContext(novel, activeSlideId);
                if (slide && parentChapter) { // It's an extract
                    handleAddSlide(parentChapter.id, slide.id);
                } else if (slide && !parentChapter) { // It's a chapter
                    handleAddSlide(slide.id);
                }
            }
            return;
        }
    }

    // --- Global App Shortcuts ---
    if (isCtrlKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
            case 'i':
            case 'u':
                // Prevent default browser formatting to enforce Alt-key shortcuts
                if (isWysiwygEditing) {
                    e.preventDefault();
                }
                return;
            case 'z':
                e.preventDefault();
                handleUndo();
                return;
            case 'y':
                e.preventDefault();
                handleRedo();
                return;
            case 'f':
                e.preventDefault();
                setIsFindOpen(true);
                return;
            case 's':
                e.preventDefault();
                handleExport();
                return;
            // --- Contextual Slide C/C/P ---
            // Only if not editing text, to allow normal text C/C/P
            case 'c':
                if (!isEditingText) {
                    e.preventDefault();
                    if(activeSlideId) handleCopySlide(activeSlideId);
                }
                return;
            case 'x':
                 if (!isEditingText) {
                    e.preventDefault();
                    if(activeSlideId) handleCutSlide(activeSlideId);
                }
                return;
            case 'v':
                 if (!isEditingText) {
                    e.preventDefault();
                    handlePasteSlide(activeSlideId);
                }
                return;
        }
    }
  }, [
    activeSlideId, 
    novel, 
    handleCopySlide, 
    handleCutSlide, 
    handlePasteSlide, 
    handleAddSlide, 
    handleExport, 
    handleUndo, 
    handleRedo, 
    handleFormat
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  useEffect(() => {
    if (!searchQuery) {
        setSearchResults([]);
        setCurrentMatchIndex(-1);
        return;
    }
    const results: SearchResult[] = [];
    const queryLower = searchQuery.toLowerCase();
    const searchInSlide = (slide: Slide) => {
        const contentLower = slide.content.toLowerCase();
        let startIndex = 0;
        let index;
        while ((index = contentLower.indexOf(queryLower, startIndex)) > -1) {
            results.push({ slideId: slide.id, start: index, end: index + searchQuery.length });
            startIndex = index + 1;
        }
    };
    novel.slides.forEach(chapter => {
        searchInSlide(chapter);
        chapter.extracts?.forEach(extract => searchInSlide(extract));
    });
    setSearchResults(results);
    setCurrentMatchIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, novel]);

  useEffect(() => {
    if (currentMatchIndex !== -1 && searchResults[currentMatchIndex]) {
        setActiveSlideId(searchResults[currentMatchIndex].slideId);
    }
  }, [currentMatchIndex, searchResults]);

  const handleFindNavigate = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    let nextIndex = direction === 'next'
        ? (currentMatchIndex + 1) % searchResults.length
        : (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
  };
  
  const handleReplace = (replaceWith: string) => {
     if (currentMatchIndex === -1 || !activeSlide) return;
    const newNovel = JSON.parse(JSON.stringify(novel));
    const { slide } = findSlideAndContext(newNovel, activeSlide.id);
    const match = searchResults[currentMatchIndex];
    if (!slide || slide.id !== match.slideId) return;

    slide.content = slide.content.substring(0, match.start) + replaceWith + slide.content.substring(match.end);
    commitChange(newNovel);
    setSearchQuery(searchQuery); 
  };
  
  const handleReplaceAll = (find: string, replaceWith: string) => {
    if (!find) return;
    const newNovel = JSON.parse(JSON.stringify(novel));
    const regex = new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    
    newNovel.slides.forEach((chapter: Slide) => {
        chapter.content = chapter.content.replace(regex, replaceWith);
        chapter.extracts?.forEach((extract: Slide) => {
            extract.content = extract.content.replace(regex, replaceWith);
        });
    });
    commitChange(newNovel);
  };

  const codeHighlightRange = useMemo(() => {
    if (isCodeView && currentMatchIndex !== -1 && searchResults[currentMatchIndex]?.slideId === activeSlideId) {
        return { start: searchResults[currentMatchIndex].start, end: searchResults[currentMatchIndex].end };
    }
    return null;
  }, [isCodeView, currentMatchIndex, searchResults, activeSlideId]);
  
  const wysiwygHighlight = useMemo(() => {
      if (!isCodeView && searchQuery && searchResults.length > 0 && currentMatchIndex !== -1 && searchResults[currentMatchIndex]?.slideId === activeSlideId) {
          const currentGlobalMatch = searchResults[currentMatchIndex];
          const occurrencesInSlide = searchResults.filter(r => r.slideId === activeSlideId);
          const occurrenceIndex = occurrencesInSlide.findIndex(r => r.start === currentGlobalMatch.start);
          return { query: searchQuery, occurrenceIndex };
      }
      return null;
  }, [isCodeView, searchQuery, searchResults, currentMatchIndex, activeSlideId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background" onClick={() => contextMenu.show && setContextMenu({ ...contextMenu, show: false })}>
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
      <main className="flex-1 flex overflow-hidden">
        <SlideNavigator
          novel={novel}
          activeSlideId={activeSlideId}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onReorder={handleReorder}
          isOpen={isNavOpen}
          onContextMenu={(e, slideId) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({ x: e.clientX, y: e.clientY, slideId, show: true });
          }}
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
      </main>
      <StatusBar novel={novel} saveStatus={saveStatus} statusMessage={statusMessage} />
      <ContextMenu
        {...contextMenu}
        items={getContextMenuItems(contextMenu.slideId)}
        onClose={() => setContextMenu({ ...contextMenu, show: false })}
      />
      {isFindOpen && (
        <FindReplacePanel 
          onFind={setSearchQuery}
          onNavigate={handleFindNavigate}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => setIsFindOpen(false)}
          matchIndex={currentMatchIndex}
          totalMatches={searchResults.length}
        />
      )}
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