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

export const AddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </SVGIcon>
);

export const ChevronRightIcon: React.FC<{ open?: boolean; className?: string }> = ({ open, className }) => (
  <SVGIcon className={`transition-transform duration-200 ${open ? 'rotate-90' : ''} ${className}`}>
    <path d="m9 18 6-6-6-6" />
  </SVGIcon>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </SVGIcon>
);

export const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon className={className}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </SVGIcon>
);

export const BoldIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className} strokeWidth="2.5">
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
        <path d="M16 4H9a3 3 0 0 0-2.83 2H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.17A3 3 0 0 0 9 12h2" />
        <path d="M8 20H15a3 3 0 0 0 2.83-2H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1.17A3 3 0 0 0 15 12h-2" />
        <line x1="4" y1="12" x2="20" y2="12" />
    </SVGIcon>
);

export const TextColorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <SVGIcon {...props}>
        <polyline points="7 13 12 4 17 13" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <path d="M3 18h18" strokeWidth="3"/>
    </SVGIcon>
);

export const ChevronDownIcon: React.FC<{ open?: boolean; className?: string }> = ({ open, className }) => (
  <SVGIcon className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} ${className}`}>
    <path d="m6 9 6 6 6-6" />
  </SVGIcon>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SVGIcon>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <polyline points="20 6 9 17 4 12" />
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

export const CutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </SVGIcon>
);

export const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </SVGIcon>
);

export const PasteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </SVGIcon>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </SVGIcon>
);

export const FilePlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
    </SVGIcon>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9L12 3z" />
        <path d="M5 8v4" />
        <path d="M19 8v4" />
        <path d="M8 5h4" />
        <path d="M8 19h4" />
    </SVGIcon>
);

export const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </SVGIcon>
);

export const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </SVGIcon>
);

export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 7.5 8.84 9 9 0 0 0 1.5-.17 9 9 0 0 0 8.84-7.5 9 9 0 0 0-.17-1.5A9 9 0 0 0 12 3z"/>
        <circle cx="12" cy="12" r="3"/>
        <circle cx="16" cy="7" r="1"/>
        <circle cx="7" cy="16" r="1"/>
        <circle cx="8" cy="8" r="1"/>
    </SVGIcon>
);

export const KeyboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
        <line x1="7" y1="9" x2="7.01" y2="9"/>
        <line x1="11" y1="9" x2="11.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
        <line x1="7" y1="13" x2="7.01" y2="13"/>
        <line x1="11" y1="13" x2="11.01" y2="13"/>
        <line x1="15" y1="13" x2="15.01" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
    </SVGIcon>
);

export const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <SVGIcon className={className}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </SVGIcon>
);