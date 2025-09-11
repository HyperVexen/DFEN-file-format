import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Novel, Slide } from './types';
import { INITIAL_NOVEL } from './constants';
import Ribbon from './components/Ribbon';
import SlideNavigator from './components/SlideNavigator';
import EditorPanel from './components/EditorPanel';
import PropertiesPanel from './components/PropertiesPanel';
import StatusBar from './components/StatusBar';
import ContextMenu, { ContextMenuItem } from './components/ContextMenu';

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


const App: React.FC = () => {
  const [history, setHistory] = useState<Novel[]>([INITIAL_NOVEL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const novel = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const [activeSlideId, setActiveSlideId] = useState<string | null>(INITIAL_NOVEL.slides[0]?.id || null);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isCodeView, setIsCodeView] = useState(false);
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: string | boolean }>({});
  const [clipboard, setClipboard] = useState<Slide | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string | null; show: boolean }>({ x: 0, y: 0, slideId: null, show: false });

  const editorRef = useRef<HTMLTextAreaElement>(null);

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
  }, [novel, handleDeleteSlide]);

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
        if (start === end && command !== 'fontSize' && command !== 'foreColor') return; // Allow applying color/size to cursor

        const selectedText = textarea.value.substring(start, end);
        let newText;

        const commandToTag: { [key: string]: string } = {
            bold: 'b',
            italic: 'i',
            underline: 'u',
            strikeThrough: 's',
        };
        const tag = commandToTag[command];

        if (tag) {
            newText = `[${tag}]${selectedText}[/${tag}]`;
        } else if (command === 'foreColor' && value) {
            newText = `[color=${value}]${selectedText}[/color]`;
        } else if (command === 'fontSize' && value) {
            newText = `[size=${value}]${selectedText}[/size]`;
        } else {
            return;
        }

        const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        updateSlide(activeSlideId, { content: newContent });

        // After state update, re-focus and set selection
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                // If there was no selection, place cursor in the middle of the new tags
                const newCursorPos = start === end ? start + newText.indexOf(']') + 1 : start + newText.length;
                editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);

    } else { // WYSIWYG
        const simpleCommands = ['bold', 'italic', 'underline', 'strikeThrough', 'foreColor'];
        if (simpleCommands.includes(command)) {
            document.execCommand(command, false, value);
        } else if (command === 'fontSize' && value) {
            // execCommand for fontSize is unreliable (1-7 scale).
            // A common robust method is to wrap selection in a span.
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = `${value}px`;
                
                if (range.collapsed) {
                    // If no text is selected, insert the span and place cursor inside
                    range.insertNode(span);
                    // Add a zero-width space to be able to type inside
                    span.appendChild(document.createTextNode('\u200B')); 
                    range.selectNodeContents(span);
                    selection.collapseToEnd();
                } else {
                    try {
                        range.surroundContents(span);
                    } catch (e) {
                         // Fallback for selections spanning multiple elements
                        document.execCommand('styleWithCSS', false, 'true');
                        const tempFont = `__size${value}`;
                        document.execCommand('fontName', false, tempFont);
                        const editorNode = document.querySelector('[contenteditable="true"]');
                        if (editorNode) {
                            const fonts = editorNode.querySelectorAll<HTMLElement>(`font[face="${tempFont}"]`);
                            fonts.forEach(font => {
                                const replacementSpan = document.createElement('span');
                                replacementSpan.style.fontSize = `${value}px`;
                                replacementSpan.innerHTML = font.innerHTML;
                                font.parentNode?.replaceChild(replacementSpan, font);
                            });
                        }
                    }
                }
            }
        }
        // Trigger an input event to let the editor component know content has changed.
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [novel]);

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

  // --- Context Menu ---
  const handleContextMenu = (event: React.MouseEvent, slideId: string | null) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, slideId, show: true });
  };
  
  const handleCloseContextMenu = () => setContextMenu({ ...contextMenu, show: false });

  const getContextMenuItems = (): ContextMenuItem[] => {
    const { slideId } = contextMenu;
    if (slideId === null) {
        return [
            { label: 'Add Chapter', action: () => handleAddSlide() },
            { label: 'Paste', action: () => handlePasteSlide(null), disabled: !clipboard || clipboard.extracts === undefined }
        ];
    }
    const { slide } = findSlideAndContext(novel, slideId);
    if (!slide) return [];
    const isChapter = !!slide.extracts;
    let items: ContextMenuItem[] = isChapter ? [{ label: 'Add Extract', action: () => handleAddSlide(slideId) }] : [];
    items.push(
      { label: 'Duplicate', action: () => handleDuplicateSlide(slideId) },
      { label: 'Copy', action: () => handleCopySlide(slideId) },
      { label: 'Cut', action: () => handleCutSlide(slideId) },
      { label: 'Paste', action: () => handlePasteSlide(slideId), disabled: !clipboard },
      { label: 'Delete', action: () => handleDeleteSlide(slideId) }
    );
    return items;
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

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const isCtrl = event.ctrlKey || event.metaKey;
        const target = event.target as HTMLElement;

        // Don't interfere with text inputs if not a formatting shortcut
        if (target.tagName === 'INPUT' && !(isCtrl && event.key.toLowerCase() === 's')) {
             return;
        }
        
        if (isCtrl) {
            switch (event.key.toLowerCase()) {
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) handleRedo(); else handleUndo();
                    break;
                case 'y':
                    event.preventDefault();
                    handleRedo();
                    break;
                case 'b':
                    event.preventDefault();
                    handleFormat('bold');
                    break;
                case 'i':
                    event.preventDefault();
                    handleFormat('italic');
                    break;
                case 'u':
                    event.preventDefault();
                    handleFormat('underline');
                    break;
                case 's':
                    event.preventDefault();
                    handleExport();
                    break;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleFormat, handleExport]);


  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
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
        activeFormats={activeFormats}
      />
      <main className="flex flex-1 overflow-hidden">
        <SlideNavigator
          novel={novel}
          activeSlideId={activeSlideId}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onReorder={handleReorder}
          isOpen={isNavOpen}
          onContextMenu={handleContextMenu}
        />
        <EditorPanel
          activeSlide={activeSlide}
          onContentChange={handleContentChange}
          onTitleChange={handleTitleChange}
          editorRef={editorRef}
          isCodeView={isCodeView}
          onSelectionChange={setActiveFormats}
        />
        <PropertiesPanel
          activeSlide={activeSlide}
          onStatusChange={handleStatusChange}
          isOpen={isPropertiesOpen}
        />
      </main>
      <StatusBar novel={novel} />
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        show={contextMenu.show}
        items={getContextMenuItems()}
        onClose={handleCloseContextMenu}
      />
    </div>
  );
};

export default App;