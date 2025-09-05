import React from 'react';
import { Preview } from './Preview';
import { Icon } from './Icon';

interface PageSidebarProps {
  pages: string[];
  activePageIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({ pages, activePageIndex, onSelect, onAdd, onDelete }) => {
  return (
    <div className="flex flex-col bg-brand-surface/80 rounded-xl border border-brand-border p-3 gap-2 shadow-2xl shadow-black/30">
      <h2 className="text-lg font-bold text-brand-text-primary text-center mb-2 tracking-wide">Pages</h2>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2">
        {pages.map((pageContent, index) => (
          <div
            key={index}
            onClick={() => onSelect(index)}
            className={`relative rounded-lg p-1 cursor-pointer ring-2 ring-transparent hover:ring-brand-border/70 transition-all duration-200 group
              ${activePageIndex === index ? '!ring-brand-accent shadow-lg shadow-brand-accent/20' : ''}
            `}
            aria-label={`Page ${index + 1}`}
          >
            <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              {pages.length > 1 && (
                 <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      onDelete(index);
                    }}
                    className="p-1 rounded-full bg-red-600/80 hover:bg-red-500 text-white transition-colors"
                    title={`Delete page ${index + 1}`}
                 >
                    <Icon name="delete" />
                 </button>
              )}
            </div>
            <span className="absolute bottom-1.5 left-2 text-xs font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">{index + 1}</span>
            <div className="aspect-[4/3] bg-brand-bg-dark rounded-md overflow-hidden pointer-events-none">
              <div className="transform scale-[0.15] origin-top-left w-[666.66%] h-[666.66%]">
                 <div className="p-4">
                   <Preview dfnText={pageContent} />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="w-full bg-brand-accent text-white font-bold py-2.5 px-4 rounded-lg hover:bg-brand-accent-hover transition-colors duration-200 mt-2"
      >
        Add Page
      </button>
    </div>
  );
};