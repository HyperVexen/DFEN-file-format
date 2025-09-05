import React, { useState, useRef, useCallback } from 'react';
import { Preview } from './Preview';
import { Icon } from './Icon';

interface ReaderProps {
  onBack: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ onBack }) => {
  const [dfnContent, setDfnContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDfnContent(text);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }, []);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center font-sans p-4 relative">
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 z-10 p-2.5 bg-brand-surface/80 backdrop-blur-sm rounded-full border border-brand-border hover:bg-brand-accent hover:border-brand-accent-hover transition-all duration-200"
        title="Back to Home"
      >
        <Icon name="home" />
      </button>

      <div className="w-full h-full max-w-4xl flex flex-col bg-brand-surface/80 rounded-xl border border-brand-border shadow-2xl shadow-black/30">
        {dfnContent === null ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-3xl font-bold text-brand-text-primary mb-2">DreamForge Reader</h2>
            <p className="text-brand-text-secondary mb-8">Select a DFN file from your computer to begin reading.</p>
            <button
              onClick={handleLoadClick}
              className="flex items-center gap-3 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-accent-hover transition-colors duration-200"
            >
              <Icon name="upload" className="w-6 h-6" />
              <span>Load DFN File</span>
            </button>
          </div>
        ) : (
          <div className="flex-grow flex flex-col min-h-0">
             <div className="px-6 py-3 border-b border-brand-border">
                <h3 className="font-semibold text-lg truncate text-brand-text-primary">{fileName || 'Reader'}</h3>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
                <Preview dfnText={dfnContent} />
            </div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept=".dfn,.txt" 
      />
    </div>
  );
};