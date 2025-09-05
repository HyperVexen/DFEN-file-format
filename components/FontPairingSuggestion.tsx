import React, { useState, useCallback } from 'react';
import { getFontPairing } from '../services/geminiService';
import { FONT_LIST } from '../constants';
import type { FontPairing } from '../types';

interface FontPairingSuggestionProps {
  onApplyFont: (fontFamily: string) => void;
}

export const FontPairingSuggestion: React.FC<FontPairingSuggestionProps> = ({ onApplyFont }) => {
  const [baseFont, setBaseFont] = useState<string>('Georgia');
  const [suggestion, setSuggestion] = useState<FontPairing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await getFontPairing(baseFont);
      setSuggestion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [baseFont]);

  return (
    <div className="p-4 border-t border-brand-border/50">
      <div className="flex items-center justify-between gap-4 mb-4">
         <h3 className="text-md font-semibold text-brand-text-secondary whitespace-nowrap">AI Font Pairing</h3>
        <div className="flex items-center gap-2 w-full">
            <select
              value={baseFont}
              onChange={(e) => setBaseFont(e.target.value)}
              className="bg-brand-bg-dark border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm w-full"
              disabled={isLoading}
            >
              {FONT_LIST.map((font) => (
                <option key={font.name} value={font.name}>
                  {font.name}
                </option>
              ))}
            </select>
            <button
              onClick={fetchSuggestion}
              disabled={isLoading}
              className="bg-brand-accent text-white font-bold py-2 px-4 rounded-md hover:bg-brand-accent-hover disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isLoading ? 'Thinking...' : 'Get Suggestion'}
            </button>
        </div>
      </div>
      {error && <div className="text-red-400 bg-red-900/30 p-3 rounded-md animate-fade-in">{error}</div>}
      {suggestion && (
        <div className="bg-brand-bg-dark/50 p-4 rounded-lg animate-fade-in">
          <p className="text-sm text-brand-text-secondary mb-4 italic border-l-2 border-brand-accent pl-3">{suggestion.reasoning}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center">
                <p className="text-xs uppercase text-brand-text-secondary tracking-wider">Heading</p>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => onApplyFont(suggestion.header.fontFamily)}
                  className="text-xs bg-brand-accent/80 hover:bg-brand-accent text-white font-semibold py-1 px-2 rounded-md transition-colors"
                  title={`Apply ${suggestion.header.name} font`}
                >
                  Apply
                </button>
              </div>
              <p style={{ fontFamily: suggestion.header.fontFamily }} className="text-3xl font-bold truncate mt-1">{suggestion.header.name}</p>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <p className="text-xs uppercase text-brand-text-secondary tracking-wider">Body</p>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => onApplyFont(suggestion.body.fontFamily)}
                  className="text-xs bg-brand-accent/80 hover:bg-brand-accent text-white font-semibold py-1 px-2 rounded-md transition-colors"
                  title={`Apply ${suggestion.body.name} font`}
                >
                  Apply
                </button>
              </div>
              <p style={{ fontFamily: suggestion.body.fontFamily }} className="text-base text-brand-text-primary/90 mt-1">The quick brown fox jumps over the lazy dog.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};