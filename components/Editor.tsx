
import React, { forwardRef } from 'react';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ content, onContentChange }, ref) => {
  return (
    <textarea
      ref={ref}
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      className="w-full h-full flex-grow bg-[#1e1e1e] text-gray-200 p-4 rounded-md border border-brand-border focus:ring-2 focus:ring-brand-accent focus:outline-none resize-none font-mono text-sm leading-6"
      placeholder="Start writing your story in DFN format..."
      spellCheck="false"
    />
  );
});

Editor.displayName = 'Editor';
