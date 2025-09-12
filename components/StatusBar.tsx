import React from 'react';
import type { Novel } from '../types';

interface StatusBarProps {
    novel: Novel;
    saveStatus: 'idle' | 'saving' | 'saved';
}

const StatusBar: React.FC<StatusBarProps> = ({ novel, saveStatus }) => {
    const totalChapters = novel.slides.length;
    const totalWordCount = novel.slides.reduce((acc, chapter) => {
        const chapterWords = chapter.content.split(/\s+/).filter(Boolean).length;
        const extractsWords = (chapter.extracts || []).reduce((extractAcc, extract) => 
            extractAcc + extract.content.split(/\s+/).filter(Boolean).length, 0);
        return acc + chapterWords + extractsWords;
    }, 0);

    const getStatusText = () => {
        switch (saveStatus) {
            case 'saving':
                return 'Saving...';
            case 'saved':
                return 'All changes saved';
            case 'idle':
            default:
                return '';
        }
    };

  return (
    <div className="bg-background border-t border-border-color px-4 py-1 flex justify-between items-center text-xs text-text-tertiary">
      <div className="flex space-x-4">
        <span>Chapters: {totalChapters}</span>
        <span>Total Words: {totalWordCount}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="transition-opacity duration-300 min-w-[120px] text-right">
            {getStatusText()}
        </span>
        <span>DFN Editor v1.0</span>
      </div>
    </div>
  );
};

export default StatusBar;