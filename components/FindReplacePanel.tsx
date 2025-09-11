import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import Tooltip from './Tooltip';

interface FindReplacePanelProps {
  onFind: (query: string) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onReplace: (replaceWith: string) => void;
  onReplaceAll: (find: string, replaceWith: string) => void;
  onClose: () => void;
  matchIndex: number;
  totalMatches: number;
}

const FindReplacePanel: React.FC<FindReplacePanelProps> = ({
  onFind,
  onNavigate,
  onReplace,
  onReplaceAll,
  onClose,
  matchIndex,
  totalMatches,
}) => {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, []);

  const handleFindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFindQuery(e.target.value);
    onFind(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onNavigate('prev');
      } else {
        onNavigate('next');
      }
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-black border border-white/20 rounded-lg shadow-lg p-3 w-80 z-30 text-sm" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Find & Replace</h4>
        <Tooltip content="Close (Esc)">
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                <CloseIcon className="w-4 h-4" />
            </button>
        </Tooltip>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="relative flex items-center">
          <input
            ref={findInputRef}
            type="text"
            placeholder="Find"
            value={findQuery}
            onChange={handleFindChange}
            className="w-full bg-black border border-white/30 rounded-md px-2 py-1 focus:ring-1 focus:ring-white focus:outline-none pr-24"
          />
          <div className="absolute right-1 flex items-center">
            <span className="text-white/50 px-2">
              {totalMatches > 0 ? `${matchIndex + 1}/${totalMatches}` : '0/0'}
            </span>
            <Tooltip content="Previous Match (Shift+Enter)">
                <button onClick={() => onNavigate('prev')} disabled={totalMatches === 0} className="p-1 rounded-md hover:bg-white/10 disabled:opacity-50">
                    <ChevronUpIcon className="w-4 h-4" />
                </button>
            </Tooltip>
             <Tooltip content="Next Match (Enter)">
                <button onClick={() => onNavigate('next')} disabled={totalMatches === 0} className="p-1 rounded-md hover:bg-white/10 disabled:opacity-50">
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
            </Tooltip>
          </div>
        </div>
        <input
          type="text"
          placeholder="Replace with"
          value={replaceQuery}
          onChange={(e) => setReplaceQuery(e.target.value)}
          className="w-full bg-black border border-white/30 rounded-md px-2 py-1 focus:ring-1 focus:ring-white focus:outline-none"
        />
        <div className="flex items-center justify-end space-x-2 pt-1">
          <button
            onClick={() => onReplace(replaceQuery)}
            disabled={totalMatches === 0}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 disabled:opacity-50"
          >
            Replace
          </button>
          <button
            onClick={() => onReplaceAll(findQuery, replaceQuery)}
            disabled={!findQuery || totalMatches === 0}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 disabled:opacity-50"
          >
            Replace All
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindReplacePanel;
