import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label?: string;
  action?: () => void;
  disabled?: boolean;
  isSeparator?: boolean;
  isDestructive?: boolean;
  icon?: React.FC<{ className?: string }>;
}

interface ContextMenuProps {
  x: number;
  y: number;
  show: boolean;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, show, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A global click listener is handled in App.tsx now
    // This component only needs to stop its own clicks from propagating up
    const stopPropagation = (e: MouseEvent) => e.stopPropagation();
    
    const currentMenu = menuRef.current;
    if (show && currentMenu) {
      currentMenu.addEventListener('mousedown', stopPropagation);
    }
    return () => {
      if(currentMenu) {
        currentMenu.removeEventListener('mousedown', stopPropagation);
      }
    };
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute bg-background border border-border-color rounded-md shadow-lg py-1 z-50 min-w-[150px]"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => (
        item.isSeparator ? (
            <div key={`sep-${index}`} className="my-1 h-px bg-border-color" />
        ) : (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`
                flex items-center w-full text-left px-4 py-2 text-sm 
                ${item.isDestructive 
                    ? 'text-red-500 hover:bg-red-500/10' 
                    : 'text-text-primary hover:bg-background-hover'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {item.icon && <item.icon className="w-4 h-4 mr-2" />}
              <span>{item.label}</span>
            </button>
        )
      ))}
    </div>
  );
};

export default ContextMenu;
