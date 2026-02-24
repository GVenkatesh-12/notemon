import { useRef, useEffect, useState } from 'react';
import { useNotesStore } from '../../store/notesStore';
import { X } from 'lucide-react';
import { cn } from '../ui/SkeuoButton';

export function TabBar() {
  const { openTabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useNotesStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (activeTabId && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTabId]);

  if (openTabs.length === 0) return null;

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && idx !== draggedIdx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx !== null && draggedIdx !== idx) {
      reorderTabs(draggedIdx, idx);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="flex items-end overflow-x-auto no-scrollbar border-b border-[var(--border-color)] bg-transparent px-2 pt-2 gap-1" ref={scrollRef}>
      {openTabs.map((tab, idx) => {
        const isActive = activeTabId === tab._id;
        const isDragged = draggedIdx === idx;
        const isDragOver = dragOverIdx === idx;
        
        return (
          <div
            key={tab._id}
            data-active={isActive}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            onClick={() => setActiveTab(tab._id)}
            className={cn(
              "group flex items-center gap-2 px-4 py-2 min-w-[120px] max-w-[200px] cursor-pointer select-none rounded-t-lg text-sm transition-all",
              "skeuo-tab",
              isActive && "active font-medium text-blue-600 dark:text-blue-400",
              !isActive && "opacity-70 hover:opacity-100 mt-1",
              isDragged && "opacity-40",
              isDragOver && "ring-2 ring-blue-400/50 ring-inset"
            )}
          >
            <span className="truncate flex-1" title={tab.title}>{tab.title || 'Untitled Note'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab._id);
              }}
              className={cn(
                "p-0.5 rounded-md transition-colors",
                isActive ? "hover:bg-blue-500/20" : "hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100"
              )}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
