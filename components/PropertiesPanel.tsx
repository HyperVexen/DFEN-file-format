import React from 'react';
import type { Slide } from '../types';

interface PropertiesPanelProps {
  activeSlide: Slide | null;
  onStatusChange: (newStatus: Slide['status']) => void;
  isOpen: boolean;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ activeSlide, onStatusChange, isOpen }) => {
  const wordCount = activeSlide?.content.split(/\s+/).filter(Boolean).length ?? 0;
  const charCount = activeSlide?.content.length ?? 0;
  const readingTime = Math.ceil(wordCount / 200);

  const statuses: Slide['status'][] = ['draft', 'needs review', 'complete'];

  return (
    <div
      className={`
        bg-black shrink-0 overflow-hidden
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72 p-4 border-l border-white/20' : 'w-0 p-0 border-l-0'}
      `}
      aria-hidden={!isOpen}
    >
      <div className="w-64 overflow-hidden">
        {activeSlide ? (
          <div className="flex flex-col space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Properties</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Status</label>
              <select
                  value={activeSlide.status}
                  onChange={(e) => onStatusChange(e.target.value as Slide['status'])}
                  className="w-full bg-black border border-white/30 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-white focus:outline-none"
              >
                  {statuses.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Statistics</h3>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span className="text-white/70">Word Count</span>
                      <span className="font-mono text-white">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-white/70">Character Count</span>
                      <span className="font-mono text-white">{charCount}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-white/70">Reading Time</span>
                      <span className="font-mono text-white">~{readingTime} min</span>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-white/50">Select a slide to see its properties.</div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;