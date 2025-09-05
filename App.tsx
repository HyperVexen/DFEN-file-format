import React, { useState, useRef, useCallback } from 'react';
import { WysiwygEditor } from './components/WysiwygEditor';
import { Toolbar } from './components/Toolbar';
import { FontPairingSuggestion } from './components/FontPairingSuggestion';
import { PageSidebar } from './components/PageSidebar';
import { Landing } from './components/Landing';
import { Reader } from './components/Reader';
import { Icon } from './components/Icon';

const initialDfnText = `[font=Georgia]Welcome to your first page![/font]\n\nThis is a [b]WYSIWYG[/b] editor. What you see is what you get! Use the toolbar above to format your text.\n\nYou can reveal the underlying DFN tags by using the [i](</>) toggle[/i] in the toolbar.`;

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'editor' | 'reader'>('landing');
  
  const [history, setHistory] = useState<{ pages: string[], activePageIndex: number }[]>([
    { pages: [initialDfnText], activePageIndex: 0 }
  ]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const currentState = history[currentHistoryIndex];
  const { pages, activePageIndex } = currentState;
  const dfnText = pages[activePageIndex];

  const updateState = useCallback((newState: { pages: string[], activePageIndex: number }, consolidate = false) => {
    const newHistory = consolidate 
      ? [...history.slice(0, currentHistoryIndex), newState]
      : [...history.slice(0, currentHistoryIndex + 1), newState];
      
    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  }, [history, currentHistoryIndex]);

  const handleTextUpdate = useCallback((text: string, consolidate = false) => {
    const newPages = [...pages];
    newPages[activePageIndex] = text;
    updateState({ pages: newPages, activePageIndex }, consolidate);
  }, [pages, activePageIndex, updateState]);
  
  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    }
  }, [currentHistoryIndex]);
  
  const redo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  }, [currentHistoryIndex, history.length]);

  const handleAddPage = useCallback(() => {
    const newPages = [...pages, `New page ${pages.length + 1}`];
    updateState({ pages: newPages, activePageIndex: pages.length });
  }, [pages, updateState]);

  const handleDeletePage = useCallback((indexToDelete: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, index) => index !== indexToDelete);
    let newActiveIndex = activePageIndex;
    if (activePageIndex === indexToDelete) {
      newActiveIndex = Math.max(0, indexToDelete - 1);
    } else if (activePageIndex > indexToDelete) {
      newActiveIndex = activePageIndex - 1;
    }
    updateState({ pages: newPages, activePageIndex: newActiveIndex });
  }, [pages, activePageIndex, updateState]);
  
  const handleSelectPage = useCallback((indexToSelect: number) => {
    if (indexToSelect !== activePageIndex) {
       updateState({ pages, activePageIndex: indexToSelect });
    }
  }, [pages, activePageIndex, updateState]);

  const handleImportText = useCallback((text: string) => {
    handleTextUpdate(text);
  }, [handleTextUpdate]);

  const handleReplaceAllPages = useCallback((findText: string, replaceText: string) => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    
    const newPages = pages.map(pageContent => pageContent.replace(regex, replaceText));

    updateState({ pages: newPages, activePageIndex });

  }, [pages, activePageIndex, updateState]);

  const handleApplyFont = useCallback((fontFamily: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        editor.focus();
        return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    if (!editor.contains(range.commonAncestorContainer)) return;

    const wrapperNode = document.createElement('span');
    wrapperNode.style.fontFamily = fontFamily;

    try {
        wrapperNode.appendChild(range.extractContents());
        range.insertNode(wrapperNode);

        selection.removeAllRanges();
        range.selectNodeContents(wrapperNode);
        range.collapse(false);
        selection.addRange(range);
    } catch (e) {
        console.error("Could not apply font style:", e);
    }

    editor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    editor.focus();
  }, [editorRef]);

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  const renderEditor = () => (
    <div className="h-screen font-sans flex flex-col relative">
      <button 
        onClick={() => setView('landing')}
        className="absolute top-4 left-4 z-30 p-2.5 bg-brand-surface/80 backdrop-blur-sm rounded-full border border-brand-border hover:bg-brand-accent hover:border-brand-accent-hover transition-all duration-200"
        title="Back to Home"
      >
        <Icon name="home" />
      </button>
      <main className="flex-grow grid grid-cols-[250px_1fr] gap-4 min-h-0 p-4">
        <PageSidebar 
          pages={pages}
          activePageIndex={activePageIndex}
          onSelect={handleSelectPage}
          onAdd={handleAddPage}
          onDelete={handleDeletePage}
        />

        <div className="flex flex-col gap-4 min-w-0">
            <Toolbar 
              editorRef={editorRef} 
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              showTags={showTags}
              onToggleTags={() => setShowTags(!showTags)}
              currentPageText={dfnText}
              activePageIndex={activePageIndex}
              onImport={handleImportText}
              onReplaceAllPages={handleReplaceAllPages}
            />
            <div className="flex-grow flex flex-col min-h-0 bg-brand-surface/80 rounded-xl border border-brand-border shadow-2xl shadow-black/30">
               <WysiwygEditor 
                  key={activePageIndex} 
                  ref={editorRef} 
                  dfnText={dfnText} 
                  onDfnTextChange={handleTextUpdate} 
                  showTags={showTags}
                />
               <FontPairingSuggestion onApplyFont={handleApplyFont} />
            </div>
        </div>
      </main>
    </div>
  );

  switch(view) {
    case 'editor':
      return renderEditor();
    case 'reader':
      return <Reader onBack={() => setView('landing')} />;
    case 'landing':
    default:
      return <Landing onSelectView={setView} />;
  }
};

export default App;