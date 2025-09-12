import React from 'react';
import type { Novel } from '../types';
import { CheckIcon, LoaderIcon, AlertTriangleIcon } from './icons';

interface StatusBarProps {
    novel: Novel;
    saveStatus: 'idle' | 'saving' | 'saved' | 'generating' | 'error';
    statusMessage?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ novel, saveStatus, statusMessage }) => {
    const totalChapters = novel.slides.length;
    const totalWordCount = novel.slides.reduce((acc, chapter) => {
        const chapterWords = chapter.content.split(/\s+/).filter(Boolean).length;
        const extractsWords = (chapter.extracts || []).reduce((extractAcc, extract) => 
            extractAcc + extract.content.split(/\s+/).filter(Boolean).length, 0);
        return acc + chapterWords + extractsWords;
    }, 0);

    const renderStatus = () => {
        switch (saveStatus) {
            case 'saving':
                return <span>Saving...</span>;
            case 'saved':
                return (
                    <div className="flex items-center text-green-500 font-medium">
                        <CheckIcon className="w-3.5 h-3.5 mr-1" />
                        <span>All changes saved</span>
                    </div>
                );
            case 'generating':
                return (
                    <div className="flex items-center">
                        <LoaderIcon className="w-3.5 h-3.5 mr-1 animate-spin" />
                        <span>{statusMessage || 'Generating...'}</span>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex items-center text-red-500 font-medium">
                        <AlertTriangleIcon className="w-3.5 h-3.5 mr-1" />
                        <span>{statusMessage || 'An error occurred'}</span>
                    </div>
                );
            case 'idle':
            default:
                return null;
        }
    };

  return (
    <div className="bg-background border-t border-border-color px-4 py-1 flex justify-between items-center text-xs text-text-tertiary">
      <div className="flex space-x-4">
        <span>Chapters: {totalChapters}</span>
        <span>Total Words: {totalWordCount}</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="transition-opacity duration-300 min-w-[150px] text-right flex items-center justify-end">
          {renderStatus()}
        </div>
        <span>DFN Editor v1.0</span>
      </div>
    </div>
  );
};

export default StatusBar;
