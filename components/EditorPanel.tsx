import React, { useRef, useEffect } from 'react';
import type { Slide } from '../types';
import WysiwygEditor from './WysiwygEditor';

interface EditorPanelProps {
  activeSlide: Slide | null;
  onContentChange: (newContent: string) => void;
  onTitleChange: (newTitle: string) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  isCodeView: boolean;
  onSelectionChange: (formats: { [key: string]: string | boolean }) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ activeSlide, onContentChange, onTitleChange, editorRef, isCodeView, onSelectionChange }) => {

  useEffect(() => {
    if (isCodeView && editorRef.current) {
        editorRef.current.style.height = 'auto';
        editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  }, [activeSlide, isCodeView, editorRef]);

  if (!activeSlide) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/50 p-8">
        Select a chapter or extract to begin editing.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black overflow-y-auto">
        <div className="bg-black p-4 sm:p-6 md:p-8 flex flex-col min-h-full w-full">
            <input 
                type="text"
                value={activeSlide.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-white/30 focus:border-white focus:outline-none pb-2 mb-4 text-white"
            />
            {isCodeView ? (
                <textarea
                    ref={editorRef}
                    value={activeSlide.content}
                    onChange={(e) => onContentChange(e.target.value)}
                    className="flex-1 bg-transparent w-full resize-none focus:outline-none text-white/90 leading-relaxed font-mono text-sm"
                    placeholder="Start writing..."
                />
            ) : (
                <WysiwygEditor
                    dfnContent={activeSlide.content}
                    onDfnContentChange={onContentChange}
                    onSelectionChange={onSelectionChange}
                />
            )}
        </div>
    </div>
  );
};

export default EditorPanel;