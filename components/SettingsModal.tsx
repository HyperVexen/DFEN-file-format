import React from 'react';
import { CloseIcon } from './icons';
import Tooltip from './Tooltip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

const Shortcut: React.FC<{ action: string; keys: string }> = ({ action, keys }) => (
    <div className="flex justify-between items-center py-2 border-b border-border-color">
        <span className="text-text-secondary">{action}</span>
        <kbd className="px-2 py-1 text-xs font-semibold text-text-tertiary bg-background-hover border border-border-color rounded-md">{keys}</kbd>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, onThemeChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div 
        className="bg-background border border-border-color rounded-lg shadow-lg w-full max-w-lg p-6 m-4 text-text-primary"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
          <Tooltip content="Close">
            <button onClick={onClose} className="p-1 rounded-full hover:bg-background-hover" aria-label="Close settings">
              <CloseIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        <div className="space-y-6">
            {/* --- Appearance Section --- */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-text-primary">Appearance</h3>
              <label htmlFor="theme-select" className="block text-sm font-medium text-text-secondary mb-1">Theme</label>
              <select
                id="theme-select"
                value={theme}
                onChange={(e) => onThemeChange(e.target.value)}
                className="w-full bg-background border border-border-color rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-text-primary focus:outline-none"
              >
                <option value="minimalist-black">Minimalist Black</option>
                <option value="classic-white">Classic White</option>
                <option value="sepia">Sepia</option>
                <option value="cyberpunk">Cyberpunk</option>
              </select>
            </div>

            {/* --- Shortcuts Section --- */}
            <div>
                <h3 className="text-lg font-semibold mb-2 text-text-primary">Keyboard Shortcuts</h3>
                <div className="text-sm max-h-60 overflow-y-auto pr-2">
                    <Shortcut action="Copy Slide" keys="Ctrl/Cmd + C" />
                    <Shortcut action="Cut Slide" keys="Ctrl/Cmd + X" />
                    <Shortcut action="Paste Slide" keys="Ctrl/Cmd + V" />
                    <Shortcut action="Undo" keys="Ctrl/Cmd + Z" />
                    <Shortcut action="Redo" keys="Ctrl/Cmd + Y" />
                    <Shortcut action="Add Chapter" keys="Alt + A" />
                    <Shortcut action="Add Extract" keys="Alt + E" />
                    <Shortcut action="Bold" keys="Alt + B" />
                    <Shortcut action="Italic" keys="Alt + I" />
                    <Shortcut action="Underline" keys="Alt + U" />
                    <Shortcut action="Find & Replace" keys="Ctrl/Cmd + F" />
                    <Shortcut action="Export Novel" keys="Ctrl/Cmd + S" />
                    <Shortcut action="Next Match" keys="Enter (in Find)" />
                    <Shortcut action="Previous Match" keys="Shift + Enter (in Find)" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
