import React from 'react';

const SVGIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const PanelLeftIcon: React.FC<{ isOpen?: boolean; className?: string }> = ({ isOpen, className }) => (
  <SVGIcon className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="9" x2="9" y1="3" y2="21" />
    {isOpen && <path d="m14 8-4 4 4 4" />}
  </SVGIcon>
);

export const PanelRightIcon: React.FC<{ isOpen?: boolean; className?: string }> = ({ isOpen, className }) => (
  <SVGIcon className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="15" x2="15" y1="3" y2="21" />
    {isOpen && <path d="m10 8 4 4-4 4" />}
  </SVGIcon>
);


export const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </SVGIcon>
);

export const BoldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </SVGIcon>
);

export const ItalicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </SVGIcon>
);

export const UnderlineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </SVGIcon>
);

export const StrikethroughIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <path d="M16 4H9a3 3 0 0 0-2.83 2H14a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 2.83-2H8" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </SVGIcon>
);

export const TextColorIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <SVGIcon className={className} style={style}>
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </SVGIcon>
);

export const ChevronDownIcon: React.FC<{ open?: boolean; className?: string }> = ({ open, className }) => (
  <SVGIcon className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <path d="m6 9 6 6 6-6" />
  </SVGIcon>
);

export const AddIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </SVGIcon>
);

export const ChevronRightIcon: React.FC<{ open?: boolean; className?: string }> = ({ open, className }) => (
    <SVGIcon className={`${className} transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
        <path d="m9 18 6-6-6-6" />
    </SVGIcon>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </SVGIcon>
);

export const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="m18 15-6-6-6 6" />
    </SVGIcon>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SVGIcon>
);