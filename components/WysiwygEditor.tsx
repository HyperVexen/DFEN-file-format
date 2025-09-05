import React, { forwardRef, useRef, useLayoutEffect } from 'react';
import { parseDfn, htmlToDfn, parseDfnWithVisibleTags } from '../services/dfnParser';

interface WysiwygEditorProps {
  dfnText: string;
  onDfnTextChange: (content: string) => void;
  showTags: boolean;
}

export const WysiwygEditor = forwardRef<HTMLDivElement, WysiwygEditorProps>(
  ({ dfnText, onDfnTextChange, showTags }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const editorRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;
    
    // Refs to track the last rendered state to prevent cursor jumps during normal typing.
    const lastDfnText = useRef(dfnText);
    const lastShowTags = useRef(showTags);

    useLayoutEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const dfnHasChanged = dfnText !== lastDfnText.current;
      const showTagsHasChanged = showTags !== lastShowTags.current;

      // Only update innerHTML if the DFN source has actually changed (e.g. from undo/redo),
      // or if the tag visibility toggle has been flipped. This is crucial to avoid
      // interrupting user editing and losing the cursor position unnecessarily.
      if (dfnHasChanged || showTagsHasChanged) {
        const html = showTags ? parseDfnWithVisibleTags(dfnText) : parseDfn(dfnText);
        editor.innerHTML = html;
        
        // Update refs to the new state we just rendered.
        lastDfnText.current = dfnText;
        lastShowTags.current = showTags;
      }
    }, [dfnText, showTags, editorRef]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const editor = e.currentTarget;
      let newDfnText: string;

      if (showTags) {
        // In "show tags" mode, the source of truth is the raw text content,
        // which includes the DFN tags themselves.
        newDfnText = editor.textContent || '';
      } else {
        // In WYSIWYG mode, convert the rendered HTML back to DFN markup.
        newDfnText = htmlToDfn(editor);
      }

      // Update the ref to prevent the effect from re-running with the same text.
      lastDfnText.current = newDfnText;
      onDfnTextChange(newDfnText);
    };

    return (
      <div
        ref={editorRef}
        onInput={handleInput}
        contentEditable={true}
        suppressContentEditableWarning={true}
        className="w-full h-full flex-grow bg-transparent text-brand-text-primary p-6 rounded-t-xl focus:outline-none focus:ring-4 focus:ring-brand-accent/30 transition-shadow duration-300 resize-none prose prose-invert max-w-none prose-p:my-2 prose-headings:my-4 prose-strong:text-brand-text-primary prose-em:text-brand-text-primary"
        spellCheck="false"
      />
    );
  }
);

WysiwygEditor.displayName = 'WysiwygEditor';