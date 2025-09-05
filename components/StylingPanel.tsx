import React, { useRef, useEffect } from 'react';
import type { ActiveFormats } from './Toolbar';
import { Icon } from './Icon';

interface StylingPanelProps {
  editorRef: React.RefObject<HTMLDivElement>;
  activeFormats: ActiveFormats;
  onStyleChange: (prop: keyof CSSStyleDeclaration, value: string) => void;
  saveSelection: () => void;
  restoreSelection: () => void;
  onClose: () => void;
}

export const StylingPanel: React.FC<StylingPanelProps> = ({ 
  editorRef, 
  activeFormats, 
  onStyleChange, 
  saveSelection, 
  restoreSelection, 
  onClose 
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Effect to close the panel when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, prop: keyof CSSStyleDeclaration) => {
    restoreSelection();
    if (e.target.value) {
      onStyleChange(prop, e.target.value);
    }
    editorRef.current?.focus();
  };
  
  const handleButtonClick = (prop: keyof CSSStyleDeclaration, value: string) => {
    restoreSelection();
    onStyleChange(prop, value);
    editorRef.current?.focus();
  };

  const getButtonClass = (isActive: boolean) =>
    `px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
      isActive ? 'bg-brand-accent text-white' : 'bg-brand-bg-light hover:bg-white/5'
    }`;

  const selectClasses = "w-full bg-brand-bg-dark border border-brand-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm";
  
  // Normalize browser default values for display
  const normalizedLineHeight = activeFormats.lineHeight === 'normal' ? '1.5' : activeFormats.lineHeight || '';
  const normalizedLetterSpacing = activeFormats.letterSpacing === 'normal' ? '0px' : activeFormats.letterSpacing || '';
  const normalizedTextTransform = activeFormats.textTransform === 'none' ? 'normal' : activeFormats.textTransform || 'normal';

  return (
    <div 
      ref={panelRef}
      className="absolute top-full mt-2 right-0 z-20 w-80 bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl shadow-2xl shadow-black/50 p-4 animate-fade-in"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-md text-brand-text-primary">Advanced Styling</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-brand-text-secondary">
          <Icon name="delete" />
        </button>
      </div>

      {/* Line Height */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">Line Height</label>
        <select 
          onFocus={saveSelection}
          onChange={(e) => handleSelectChange(e, 'lineHeight')} 
          value={normalizedLineHeight}
          className={selectClasses}
        >
          <option value="1">Single (1)</option>
          <option value="1.25">Small (1.25)</option>
          <option value="1.5">Normal (1.5)</option>
          <option value="1.75">Large (1.75)</option>
          <option value="2">Double (2)</option>
        </select>
      </div>

      <div className="my-3 h-px w-full bg-brand-border/50" />

      {/* Letter Spacing */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">Letter Spacing</label>
        <select 
          onFocus={saveSelection}
          onChange={(e) => handleSelectChange(e, 'letterSpacing')} 
          value={normalizedLetterSpacing}
          className={selectClasses}
        >
          <option value="normal">Normal</option>
          <option value="0.5px">Wide (0.5px)</option>
          <option value="1px">Wider (1px)</option>
          <option value="2px">Widest (2px)</option>
        </select>
      </div>
      
      <div className="my-3 h-px w-full bg-brand-border/50" />
      
      {/* Text Transform */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">Text Case</label>
        <div 
          onFocus={saveSelection}
          className="grid grid-cols-4 gap-2"
        >
          <button onClick={() => handleButtonClick('textTransform', 'none')} className={getButtonClass(normalizedTextTransform === 'normal')}>Normal</button>
          <button onClick={() => handleButtonClick('textTransform', 'capitalize')} className={getButtonClass(normalizedTextTransform === 'capitalize')}>Title</button>
          <button onClick={() => handleButtonClick('textTransform', 'uppercase')} className={getButtonClass(normalizedTextTransform === 'uppercase')}>UPPER</button>
          <button onClick={() => handleButtonClick('textTransform', 'lowercase')} className={getButtonClass(normalizedTextTransform === 'lowercase')}>lower</button>
        </div>
      </div>
    </div>
  );
};