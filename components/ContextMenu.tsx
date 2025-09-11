import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
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
      className="absolute bg-black border border-white/30 rounded-md shadow-lg py-1 z-50"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            if (!item.disabled) {
              item.action();
              onClose();
            }
          }}
          disabled={item.disabled}
          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;