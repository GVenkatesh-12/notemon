import { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '../ui/SkeuoButton';
import { FileText, Plus, Trash2, Menu, Search, Inbox, ArrowUpDown, EllipsisVertical, KeyRound, LogOut } from 'lucide-react';
import { useNotesStore } from '../../store/notesStore';
import { SkeuoButton } from '../ui/SkeuoButton';
import { useAuthStore } from '../../store/authStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ChangePasswordDialog } from '../ui/ChangePasswordDialog';

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 px-3 py-3 rounded-lg bg-[var(--border-color)] opacity-50">
          <div className="w-4 h-4 bg-[var(--text-color)] opacity-20 rounded"></div>
          <div className="flex-1 h-3 bg-[var(--text-color)] opacity-20 rounded"></div>
        </div>
      ))}
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { notes, createNote, openTab, deleteNote, activeTabId, isLoading } = useNotesStore();
  const logout = useAuthStore(state => state.logout);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  type SortOption = 'updatedAt' | 'createdAt' | 'title';
  const sortLabels: Record<SortOption, string> = { updatedAt: 'Modified', createdAt: 'Created', title: 'Title' };
  const sortCycle: SortOption[] = ['updatedAt', 'createdAt', 'title'];

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const stored = localStorage.getItem('sidebar-sort') as SortOption | null;
    return stored && sortCycle.includes(stored) ? stored : 'updatedAt';
  });

  const cycleSortBy = () => {
    setSortBy(prev => {
      const next = sortCycle[(sortCycle.indexOf(prev) + 1) % sortCycle.length];
      localStorage.setItem('sidebar-sort', next);
      return next;
    });
  };

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
    });
  }, [notes, searchQuery, sortBy]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={cn(
          "fixed md:static inset-y-0 left-0 z-30 w-72 skeuo-panel flex flex-col transition-transform duration-300 ease-in-out border-r border-t-0 border-b-0 border-l-0",
          !isOpen && "-translate-x-full md:translate-x-0 md:w-72" // On md screen, it's always visible but we can tweak if user wants full collapse
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Menu className="md:hidden cursor-pointer" onClick={() => setIsOpen(false)} />
            <span>My Notes</span>
          </div>
          <SkeuoButton variant="icon" className="w-8 h-8" onClick={createNote} title="New Note">
            <Plus size={16} />
          </SkeuoButton>
        </div>

        <div className="p-3 border-b border-[var(--border-color)] flex flex-col gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full skeuo-inset bg-transparent py-2 pl-9 pr-4 rounded-lg outline-none text-sm text-[var(--text-color)] placeholder:opacity-50"
            />
          </div>
          <button
            onClick={cycleSortBy}
            className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity self-start px-1"
            title={`Sort by: ${sortLabels[sortBy]}`}
          >
            <ArrowUpDown size={12} />
            <span>{sortLabels[sortBy]}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {isLoading ? (
            <SidebarSkeleton />
          ) : notes.length === 0 ? (
            <div className="text-center opacity-70 text-sm mt-12 p-4 flex flex-col items-center">
              <Inbox size={48} className="mb-4 opacity-50" />
              <p className="font-medium mb-4">No notes yet</p>
              <SkeuoButton onClick={createNote} className="text-sm">Create your first note</SkeuoButton>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center opacity-50 text-sm mt-8 p-4">
              No notes match your search.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note._id}
                onClick={() => {
                  openTab(note);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between group px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  activeTabId === note._id 
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium" 
                    : "hover:bg-[var(--border-color)] opacity-80 hover:opacity-100"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={16} className="shrink-0" />
                  <span className="truncate text-sm">{note.title || 'Untitled Note'}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoteToDelete(note._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-color)] flex items-center gap-2">
          <SkeuoButton onClick={logout} className="flex-1 py-2 text-sm text-red-500 hover:text-red-600 font-medium flex items-center justify-center gap-2">
            <LogOut size={14} />
            Sign Out
          </SkeuoButton>

          <div className="relative" ref={menuRef}>
            <SkeuoButton
              variant="icon"
              className="w-9 h-9"
              onClick={() => setShowMenu(prev => !prev)}
              title="More options"
            >
              <EllipsisVertical size={16} />
            </SkeuoButton>

            {showMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 skeuo-panel rounded-lg overflow-hidden shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <KeyRound size={14} className="opacity-70" />
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!noteToDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={() => {
          if (noteToDelete) deleteNote(noteToDelete);
          setNoteToDelete(null);
        }}
        onCancel={() => setNoteToDelete(null)}
      />

      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  );
}
