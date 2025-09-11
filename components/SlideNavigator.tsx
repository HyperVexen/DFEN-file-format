import React, { useState, useRef } from 'react';
import type { Novel, Slide } from '../types';
import Tooltip from './Tooltip';
import { AddIcon, ChevronRightIcon } from './icons';

interface SlideNavigatorProps {
  novel: Novel;
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: (parentId?: string) => void;
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  isOpen: boolean;
  onContextMenu: (event: React.MouseEvent, slideId: string | null) => void;
}

const StatusIndicator: React.FC<{ status: Slide['status'] }> = ({ status }) => {
    const statusColor = {
        draft: 'bg-yellow-500',
        complete: 'bg-green-500',
        'needs review': 'bg-blue-500',
    };
    return (
      <Tooltip content={status.charAt(0).toUpperCase() + status.slice(1)}>
        <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${statusColor[status]}`}></span>
      </Tooltip>
    );
};


const SlideItem: React.FC<{
    slide: Slide;
    level: number;
    activeSlideId: string | null;
    onSelectSlide: (id: string) => void;
    onContextMenu: (event: React.MouseEvent, slideId: string) => void;
    setDraggedId: (id: string | null) => void;
    handleDragOver: (e: React.DragEvent, targetId: string) => void;
    handleDrop: (e: React.DragEvent, targetId: string) => void;
    draggedId: string | null;
    dragOverId: string | null;
    dropPosition: 'before' | 'after' | 'inside' | null;
}> = ({ slide, level, activeSlideId, onSelectSlide, onContextMenu, setDraggedId, handleDragOver, handleDrop, draggedId, dragOverId, dropPosition }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isChapter = level === 0;

    const isActive = activeSlideId === slide.id;
    const isBeingDragged = draggedId === slide.id;

    const dropTargetClass = (pos: 'before' | 'after' | 'inside') => 
        dragOverId === slide.id && dropPosition === pos ? 'bg-blue-500/50' : '';

    return (
        <div>
            <div
                className={`
                    w-full text-left flex items-center group text-sm relative
                    ${isBeingDragged ? 'opacity-50' : ''}
                `}
                style={{ paddingLeft: `${level * 1.5}rem` }}
                draggable
                onDragStart={() => setDraggedId(slide.id)}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(e) => handleDragOver(e, slide.id)}
                onDrop={(e) => handleDrop(e, slide.id)}
                onContextMenu={(e) => onContextMenu(e, slide.id)}
            >
                {/* Drop indicators */}
                <div className={`absolute left-0 top-0 h-[3px] w-full ${dropTargetClass('before')}`}></div>
                <div className={`absolute left-0 bottom-0 h-[3px] w-full ${dropTargetClass('after')}`}></div>

                {isChapter && slide.extracts && slide.extracts.length > 0 && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-0.5 rounded-full hover:bg-white/10 mr-1 flex-shrink-0">
                        <ChevronRightIcon open={isExpanded} className="w-4 h-4" />
                    </button>
                )}
                 {!isChapter && <div className="w-4 h-4 mr-1 flex-shrink-0"></div>}
                
                <button
                    onClick={() => onSelectSlide(slide.id)}
                    className={`
                        flex-1 py-1 px-2 rounded-md truncate text-left flex items-center space-x-2
                        ${isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}
                        ${dropTargetClass('inside')}
                    `}
                >
                    <StatusIndicator status={slide.status} />
                    <span className="truncate">{slide.title || (isChapter ? "Untitled Chapter" : "Untitled Extract")}</span>
                </button>
            </div>
            {isChapter && isExpanded && slide.extracts && (
                <div>
                    {slide.extracts.map(extract => (
                        <SlideItem
                            key={extract.id}
                            slide={extract}
                            level={level + 1}
                            activeSlideId={activeSlideId}
                            onSelectSlide={onSelectSlide}
                            onContextMenu={onContextMenu}
                            setDraggedId={setDraggedId}
                            handleDragOver={handleDragOver}
                            handleDrop={handleDrop}
                            draggedId={draggedId}
                            dragOverId={dragOverId}
                            dropPosition={dropPosition}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const SlideNavigator: React.FC<SlideNavigatorProps> = ({ novel, activeSlideId, onSelectSlide, onAddSlide, onReorder, isOpen, onContextMenu }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
    const navRef = useRef<HTMLElement>(null);

    const findSlideType = (slideId: string): 'chapter' | 'extract' => {
        for (const chapter of novel.slides) {
            if (chapter.id === slideId) return 'chapter';
            if (chapter.extracts?.some(e => e.id === slideId)) return 'extract';
        }
        return 'chapter'; // Fallback
    };
    
    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) {
            setDropPosition(null);
            setDragOverId(targetId);
            return;
        };

        const targetEl = (e.target as HTMLElement).closest('[draggable]');
        if (!targetEl) return;

        const rect = targetEl.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        let newPos: 'before' | 'after' | 'inside' = 'after';

        const draggedType = findSlideType(draggedId);
        const targetType = findSlideType(targetId);

        if (draggedType === 'extract' && targetType === 'chapter') {
            if (y < height * 0.25) newPos = 'before';
            else if (y > height * 0.75) newPos = 'after';
            else newPos = 'inside';
        } else {
             if (y < height * 0.5) newPos = 'before';
             else newPos = 'after';
        }
        
        if (draggedType === 'chapter' && newPos === 'inside') {
            newPos = 'after';
        }

        if (targetType === 'extract' && newPos === 'inside') {
            newPos = 'after';
        }

        setDragOverId(targetId);
        setDropPosition(newPos);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (draggedId && dropPosition && draggedId !== targetId) {
            onReorder(draggedId, targetId, dropPosition);
        }
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
        if (navRef.current && !navRef.current.contains(e.relatedTarget as Node)) {
             setDragOverId(null);
             setDropPosition(null);
        }
    };

    return (
        <aside
            ref={navRef}
            className={`
                bg-black shrink-0 text-white
                transition-all duration-300 ease-in-out
                ${isOpen ? 'w-72 p-2 border-r border-white/20' : 'w-0 p-0 border-r-0 overflow-hidden'}
            `}
            onDragLeave={handleDragLeave}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, null) }}
            aria-hidden={!isOpen}
        >
          <div className="flex justify-between items-center mb-2 w-64 overflow-hidden">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">Navigator</h2>
              <Tooltip content="Add Chapter">
                  <button onClick={() => onAddSlide()} className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-md">
                      <AddIcon className="w-5 h-5" />
                  </button>
              </Tooltip>
          </div>
          <div 
            className="flex flex-col space-y-1 overflow-hidden"
            onDrop={(e) => handleDrop(e, novel.slides[novel.slides.length-1].id)}
            onDragOver={(e) => e.preventDefault()}
          >
              {novel.slides.map(chapter => (
                  <SlideItem
                      key={chapter.id}
                      slide={chapter}
                      level={0}
                      activeSlideId={activeSlideId}
                      onSelectSlide={onSelectSlide}
                      onContextMenu={onContextMenu}
                      setDraggedId={setDraggedId}
                      handleDragOver={handleDragOver}
                      handleDrop={handleDrop}
                      draggedId={draggedId}
                      dragOverId={dragOverId}
                      dropPosition={dropPosition}
                  />
              ))}
          </div>
        </aside>
    );
};

export default SlideNavigator;