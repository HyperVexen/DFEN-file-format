import React, { useState, useRef, useEffect } from 'react';
import { PanelLeftIcon, PanelRightIcon, CodeIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, TextColorIcon, ChevronDownIcon, SearchIcon } from './icons';
import Tooltip from './Tooltip';

interface RibbonProps {
    isNavOpen: boolean;
    onToggleNav: () => void;
    isPropertiesOpen: boolean;
    onToggleProperties: () => void;
    isCodeView: boolean;
    onToggleCodeView: () => void;
    onFormat: (command: string, value?: string) => void;
    onImport: () => void;
    onExport: () => void;
    onToggleFind: () => void;
    activeFormats: { [key: string]: string | boolean };
}

const Ribbon: React.FC<RibbonProps> = ({
    isNavOpen,
    onToggleNav,
    isPropertiesOpen,
    onToggleProperties,
    isCodeView,
    onToggleCodeView,
    onFormat,
    onImport,
    onExport,
    onToggleFind,
    activeFormats
}) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleImportClick = () => {
    onImport();
    setIsFileMenuOpen(false);
  };

  const handleExportClick = () => {
    onExport();
    setIsFileMenuOpen(false);
  };

  const colorValue = activeFormats.color as string || '#ffffff';
  const fontSizeValue = activeFormats.fontSize as string || '';

  return (
    <header className="bg-background border-b border-border-color px-4 py-2 flex justify-between items-center text-text-primary shrink-0 z-10">
      {/* Left side: File Menu and Nav toggle */}
      <div className="flex items-center space-x-4">
        <div className="relative" ref={menuRef}>
            <Tooltip content="File Options">
                <button
                    onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                    className="px-3 py-2 bg-background hover:bg-background-hover border border-border-color rounded-md text-sm font-medium flex items-center space-x-2"
                >
                    <span>File</span>
                    <ChevronDownIcon open={isFileMenuOpen} className="w-4 h-4" />
                </button>
            </Tooltip>
            {isFileMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-background border border-border-color rounded-md shadow-lg py-1 z-20">
                    <button
                        onClick={handleImportClick}
                        className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background-hover"
                    >
                        Import .dfn
                    </button>
                    <button
                        onClick={handleExportClick}
                        className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background-hover"
                    >
                        Export .dfn
                    </button>
                </div>
            )}
        </div>
        <Tooltip content={isNavOpen ? "Hide Navigator" : "Show Navigator"}>
            <button onClick={onToggleNav} className="p-1 text-text-tertiary hover:text-text-primary">
                <PanelLeftIcon isOpen={isNavOpen} />
            </button>
        </Tooltip>
      </div>

      {/* Center: Formatting tools */}
      <div className="flex items-center space-x-2 bg-background border border-border-color p-1 rounded-md">
        <Tooltip content="Bold (Alt+B)">
            <button onClick={() => onFormat('bold')} className={`p-2 rounded-md ${activeFormats.bold ? 'bg-background-active text-text-primary' : 'text-text-secondary hover:bg-background-hover'}`}><BoldIcon /></button>
        </Tooltip>
        <Tooltip content="Italic (Alt+I)">
            <button onClick={() => onFormat('italic')} className={`p-2 rounded-md ${activeFormats.italic ? 'bg-background-active text-text-primary' : 'text-text-secondary hover:bg-background-hover'}`}><ItalicIcon /></button>
        </Tooltip>
        <Tooltip content="Underline (Alt+U)">
            <button onClick={() => onFormat('underline')} className={`p-2 rounded-md ${activeFormats.underline ? 'bg-background-active text-text-primary' : 'text-text-secondary hover:bg-background-hover'}`}><UnderlineIcon /></button>
        </Tooltip>
        <Tooltip content="Strikethrough">
            <button onClick={() => onFormat('strikeThrough')} className={`p-2 rounded-md ${activeFormats.strikeThrough ? 'bg-background-active text-text-primary' : 'text-text-secondary hover:bg-background-hover'}`}><StrikethroughIcon /></button>
        </Tooltip>
        
         <div className="w-px h-6 bg-border-color mx-1"></div>

        <Tooltip content="Text Color">
            <div className="relative flex items-center p-2 text-text-secondary hover:bg-background-hover rounded-md cursor-pointer">
                <TextColorIcon style={{ color: colorValue }} />
                <input 
                    type="color" 
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    onChange={(e) => onFormat('foreColor', e.target.value)}
                    value={colorValue}
                />
            </div>
        </Tooltip>
        <Tooltip content="Font Size">
            <input
                type="number"
                min="8"
                max="72"
                placeholder="Size"
                value={fontSizeValue}
                onChange={(e) => onFormat('fontSize', e.target.value)}
                className="w-16 bg-background border border-border-color rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-white focus:outline-none"
            />
        </Tooltip>

      </div>

      {/* Right side: View toggles */}
      <div className="flex items-center space-x-4">
        <Tooltip content="Find & Replace (Ctrl+F)">
            <button onClick={onToggleFind} className={`p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-background-hover`}>
                <SearchIcon className="w-5 h-5"/>
            </button>
        </Tooltip>
        <Tooltip content={isCodeView ? "Visual Editor" : "Code Editor"}>
            <button onClick={onToggleCodeView} className={`p-2 rounded-md ${isCodeView ? 'bg-background-active text-text-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-background-hover'}`}>
                <CodeIcon className="w-5 h-5"/>
            </button>
        </Tooltip>
        <Tooltip content={isPropertiesOpen ? "Hide Properties" : "Show Properties"}>
            <button onClick={onToggleProperties} className="p-1 text-text-tertiary hover:text-text-primary" >
                <PanelRightIcon isOpen={isPropertiesOpen} />
            </button>
        </Tooltip>
      </div>
    </header>
  );
};

export default Ribbon;
