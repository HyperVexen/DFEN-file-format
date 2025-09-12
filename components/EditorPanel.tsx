import React, { useEffect } from 'react';
import type { Slide } from '../types';
import WysiwygEditor from './WysiwygEditor';

interface EditorPanelProps {
  activeSlide: Slide | null;
  onContentChange: (newContent: string) => void;
  onTitleChange: (newTitle: string) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  isCodeView: boolean;
  onSelectionChange: (formats: { [key: string]: string | boolean }) => void;
  codeHighlightRange: { start: number; end: number } | null;
  wysiwygHighlight: { query: string; occurrenceIndex: number } | null;
}

const ChapterContainerView: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center text-text-tertiary p-8">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-text-disabled"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    <h3 className="text-lg font-semibold text-text-secondary">This chapter is a container.</h3>
    <p className="max-w-md mt-1">Its content is organized into the extracts nested under it in the navigator. Select an extract to begin editing.</p>
  </div>
);


const EditorPanel: React.FC<EditorPanelProps> = ({ 
  activeSlide, 
  onContentChange, 
  onTitleChange, 
  editorRef, 
  isCodeView, 
  onSelectionChange,
  codeHighlightRange,
  wysiwygHighlight
}) => {

  useEffect(() => {
    if (isCodeView && editorRef.current) {
        editorRef.current.style.height = 'auto';
        editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  }, [activeSlide, isCodeView, editorRef]);

  useEffect(() => {
    if (isCodeView && editorRef.current && codeHighlightRange) {
        const textarea = editorRef.current;
        textarea.focus();
        textarea.setSelectionRange(codeHighlightRange.start, codeHighlightRange.end);
        
        // Scroll into view logic
        const { selectionStart } = textarea;
        const text = textarea.value;
        const textBefore = text.substring(0, selectionStart);
        const lines = textBefore.split('\n').length;
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20; // fallback
        
        // Center it a bit
        const desiredScrollTop = (lines - 1) * lineHeight - textarea.clientHeight / 2 + lineHeight / 2;
        textarea.scrollTop = Math.max(0, desiredScrollTop);
    }
  }, [codeHighlightRange, isCodeView]);

  if (!activeSlide) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-disabled p-8">
        Select a chapter or extract to begin editing.
      </div>
    );
  }

  const isChapterContainer = !!(activeSlide.extracts && activeSlide.extracts.length > 0);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        <div className="bg-background p-4 sm:p-6 md:p-8 flex flex-col min-h-full w-full">
            <input 
                type="text"
                value={activeSlide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-border-color focus:border-text-primary focus:outline-none pb-2 mb-4 text-text-primary"
            />
            {isChapterContainer ? (
              <ChapterContainerView />
            ) : isCodeView ? (
                <textarea
                    ref={editorRef}
                    value={activeSlide.content}
                    onChange={(e) => onContentChange(e.target.value)}
                    className="flex-1 bg-transparent w-full resize-none focus:outline-none text-text-secondary leading-relaxed font-mono text-sm"
                    placeholder="Start writing..."
                />
            ) : (
                <WysiwygEditor
                    dfnContent={activeSlide.content}
                    onDfnContentChange={onContentChange}
                    onSelectionChange={onSelectionChange}
                    highlightInfo={isCodeView ? null : wysiwygHighlight}
                />
            )}
        </div>
    </div>
  );
};

export default EditorPanel;