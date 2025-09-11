
import React from 'react';
import type { Novel } from '../types';

interface StatusBarProps {
    novel: Novel;
}

const StatusBar: React.FC<StatusBarProps> = ({ novel }) => {
    const totalChapters = novel.slides.length;
    const totalWordCount = novel.slides.reduce((acc, chapter) => {
        const chapterWords = chapter.content.split(/\s+/).filter(Boolean).length;
        const extractsWords = (chapter.extracts || []).reduce((extractAcc, extract) => 
            extractAcc + extract.content.split(/\s+/).filter(Boolean).length, 0);
        return acc + chapterWords + extractsWords;
    }, 0);


  return (
    <div className="bg-black border-t border-white/20 px-4 py-1 flex justify-between items-center text-xs text-white/70">
      <div className="flex space-x-4">
        <span>Chapters: {totalChapters}</span>
        <span>Total Words: {totalWordCount}</span>
      </div>
      <div>
        <span>DFN Editor v1.0</span>
      </div>
    </div>
  );
};

export default StatusBar;