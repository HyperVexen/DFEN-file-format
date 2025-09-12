import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'bottom' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group">
      {children}
      <div
        className={`
          absolute whitespace-nowrap bg-popup-background text-popup-text text-xs rounded py-1 px-2
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50
          ${positionClasses[position]}
        `}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;