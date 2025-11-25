import React, { useState } from 'react';
import { CloseIcon, PaletteIcon, KeyboardIcon, BookOpenIcon } from './icons';
import Tooltip from './Tooltip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

const Shortcut: React.FC<{ action: string; keys: string }> = ({ action, keys }) => (
    <div className="flex justify-between items-center py-2 border-b border-border-color last:border-b-0">
        <span className="text-text-secondary">{action}</span>
        <kbd className="px-2 py-1 text-xs font-semibold text-text-tertiary bg-background-hover border border-border-color rounded-md">{keys}</kbd>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('appearance');

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
    { id: 'shortcuts', label: 'Shortcuts', icon: KeyboardIcon },
    { id: 'help', label: 'Help', icon: BookOpenIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div 
        className="bg-background border border-border-color rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col p-6 m-4 text-text-primary"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
          <Tooltip content="Close">
            <button onClick={onClose} className="p-1 rounded-full hover:bg-background-hover" aria-label="Close settings">
              <CloseIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        <div className="flex border-b border-border-color mb-4 flex-shrink-0">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px
                        ${activeTab === tab.id 
                            ? 'border-text-primary text-text-primary' 
                            : 'border-transparent text-text-tertiary hover:text-text-primary'
                        }`}
                    aria-selected={activeTab === tab.id}
                    role="tab"
                >
                    <tab.icon className="w-4 h-4 mr-2" />
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
        
        <div className="overflow-y-auto pr-2 flex-grow">
          {activeTab === 'appearance' && (
            <div role="tabpanel">
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
          )}
          {activeTab === 'shortcuts' && (
            <div role="tabpanel">
                <h3 className="text-lg font-semibold mb-2 text-text-primary">Keyboard Shortcuts</h3>
                <div className="text-sm">
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
          )}
          {activeTab === 'help' && (
            <div role="tabpanel" className="space-y-6 text-sm text-text-secondary leading-relaxed">
                <div>
                    <h4 className="font-bold text-base text-text-primary mb-2">What is DFN?</h4>
                    <p>DFN (Dynamic Fiction Notation) is a simple, lightweight markup language designed for writers. It allows for rich text formatting using straightforward tags, similar to BBCode. This makes it easy to write and edit your novel's content while keeping the underlying text clean and portable.</p>
                    <p className="mt-2">The editor provides a WYSIWYG (What You See Is What You Get) interface, but you can always switch to the Code View to see and edit the raw DFN markup.</p>
                    
                    <h5 className="font-semibold text-text-primary mt-4 mb-2">Common Tags:</h5>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Bold Text: <code>[b]bold text[/b]</code> &rarr; <b>bold text</b></li>
                        <li>Italic Text: <code>[i]italic text[/i]</code> &rarr; <i>italic text</i></li>
                        <li>Underlined Text: <code>[u]underlined text[/u]</code> &rarr; <u>underlined text</u></li>
                        <li>Colored Text: <code>[color=red]red text[/color]</code> &rarr; <span style={{color:'red'}}>red text</span></li>
                        <li>Highlighted Text: <code>[bg=yellow][color=black]highlighted[/color][/bg]</code> &rarr; <span style={{backgroundColor:'yellow', color: 'black'}}>highlighted</span></li>
                        <li>Different Font: <code>[font=Courier New]courier font[/font]</code> &rarr; <span style={{fontFamily:'Courier New'}}>courier font</span></li>
                        <li>Font Size: <code>[size=20]bigger text[/size]</code> &rarr; <span style={{fontSize:'20px'}}>bigger text</span></li>
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-bold text-base text-text-primary mb-2">Editor Basics</h4>
                    <h5 className="font-semibold text-text-primary mt-4 mb-2">Navigator Panel (Left)</h5>
                    <p>This panel shows the structure of your novel. Your novel is made of <strong>Chapters</strong> and <strong>Extracts</strong>.</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><strong>Chapters</strong> are the main sections.</li>
                        <li><strong>Extracts</strong> are sub-sections within a chapter. A chapter with extracts acts as a container and cannot have its own content.</li>
                        <li>You can <strong>drag and drop</strong> chapters and extracts to reorder them.</li>
                        <li><strong>Right-click</strong> on an item or the panel background to open a context menu with more actions like adding, deleting, and duplicating slides.</li>
                    </ul>

                    <h5 className="font-semibold text-text-primary mt-4 mb-2">AI Features</h5>
                    <p>This editor uses AI to help you with your writing process. You can access AI features through the context menu (right-click on a slide).</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><strong>Suggest Title:</strong> If you're stuck on a title for a chapter or extract, this feature will analyze its content and suggest a compelling title for you.</li>
                    </ul>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
