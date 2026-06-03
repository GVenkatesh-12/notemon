import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TabBar } from '../components/layout/TabBar';
import { Editor } from '../components/editor/Editor';
import { useNotesStore } from '../store/notesStore';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [editorPreviewMode, setEditorPreviewMode] = useState(false);
  const fetchNotes = useNotesStore(state => state.fetchNotes);
  
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const toggleZen = useCallback(() => setZenMode(z => !z), []);

  const requestEditorMode = useCallback((mode: 'edit' | 'preview') => {
    setEditorPreviewMode(mode === 'preview');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';

      if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      } else if (
        e.key.toLowerCase() === 'f' &&
        editorPreviewMode &&
        !isEditableTarget &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setZenMode(z => !z);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editorPreviewMode, zenMode]);

  if (zenMode) {
    return (
      <div className="fixed inset-0 flex overflow-hidden bg-[var(--bg-color)]">
        <Editor
          zenMode
          onToggleZen={toggleZen}
          previewMode={editorPreviewMode}
          onPreviewModeChange={setEditorPreviewMode}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[var(--bg-color)]">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onRequestEditorMode={requestEditorMode}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--panel-color)] p-1 sm:p-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <button 
              className="md:hidden p-1.5 sm:p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="min-w-0 flex-1 overflow-hidden">
              <TabBar />
            </div>
          </div>
          <div className="px-1 sm:px-2 shrink-0">
            <ThemeToggle />
          </div>
        </div>
        
        <Editor
          onToggleZen={toggleZen}
          previewMode={editorPreviewMode}
          onPreviewModeChange={setEditorPreviewMode}
        />
      </div>
    </div>
  );
}
