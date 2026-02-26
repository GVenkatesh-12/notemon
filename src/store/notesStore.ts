import { create } from 'zustand';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';

export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notes: Note[];
  openTabs: Note[];
  activeTabId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotes: () => Promise<void>;
  createNote: () => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  // UI Actions
  openTab: (note: Note) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateLocalTabContent: (id: string, content: string) => void;
  updateLocalTabTitle: (id: string, title: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

const tempToRealId = new Map<string, string>();

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  openTabs: [],
  activeTabId: null,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<Note[]>('/notes');
      set({ notes: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createNote: async () => {
    // Create a local temporary note instead of hitting the API immediately
    const tempId = `temp-${Date.now()}`;
    const tempNote: Note = {
      _id: tempId,
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    set((state) => ({ 
      notes: [tempNote, ...state.notes],
      openTabs: [...state.openTabs, tempNote],
      activeTabId: tempId
    }));
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    try {
      let data: Note;
      const resolvedId = id.startsWith('temp-') ? (tempToRealId.get(id) ?? id) : id;
      
      if (resolvedId.startsWith('temp-')) {
        const state = get();
        const currentTempNote = state.notes.find(n => n._id === resolvedId);
        
        const titleToSave = updates.title ?? currentTempNote?.title ?? '';
        const contentToSave = updates.content ?? currentTempNote?.content ?? '';
        
        if (!titleToSave.trim() && !contentToSave.trim()) {
          return;
        }

        const response = await apiClient.post<Note>('/notes', {
          title: titleToSave || 'Untitled Note',
          content: contentToSave
        });
        data = response.data;
        tempToRealId.set(id, data._id);
        
        const { title: _t, content: _c, ...tempMeta } = data;
        set((state) => {
          const newActiveTabId = state.activeTabId === id ? data._id : state.activeTabId;
          
          return {
            notes: state.notes.map((n) => (n._id === id ? data : n)),
            openTabs: state.openTabs.map((t) => (t._id === id ? { ...t, ...tempMeta, _id: data._id } : t)),
            activeTabId: newActiveTabId
          };
        });
      } else {
        const response = await apiClient.patch<Note>(`/notes/${resolvedId}`, updates);
        data = response.data;
        
        const { title: _t, content: _c, ...metadata } = data;
        set((state) => ({
          notes: state.notes.map((n) => (n._id === resolvedId ? data : n)),
          openTabs: state.openTabs.map((t) => (t._id === resolvedId ? { ...t, ...metadata } : t)),
        }));
      }
    } catch (err: any) {
      console.error('[updateNote]', {
        id, resolvedId: id.startsWith('temp-') ? (tempToRealId.get(id) ?? id) : id,
        status: err?.response?.status,
        responseData: err?.response?.data,
        message: err?.message,
        updates: { ...updates, content: updates.content ? `(${updates.content.length} chars)` : undefined },
      });
      set({ error: err.message });
      throw err;
    }
  },

  deleteNote: async (id: string) => {
    try {
      if (!id.startsWith('temp-')) {
        await apiClient.delete(`/notes/${id}`);
        toast.success('Note deleted');
      }
      
      set((state) => {
        const remainingTabs = state.openTabs.filter(t => t._id !== id);
        return {
          notes: state.notes.filter(n => n._id !== id),
          openTabs: remainingTabs,
          activeTabId: state.activeTabId === id 
            ? (remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1]._id : null)
            : state.activeTabId
        };
      });
    } catch (err: any) {
      set({ error: err.message });
      toast.error('Failed to delete note');
    }
  },

  openTab: (note: Note) => {
    const state = get();
    if (!state.openTabs.find(t => t._id === note._id)) {
      set({ openTabs: [...state.openTabs, note] });
    }
    set({ activeTabId: note._id });
  },

  closeTab: (id: string) => {
    const state = get();
    const remainingTabs = state.openTabs.filter(t => t._id !== id);
    
    // If it's a temp note and has no title and no content, just delete it entirely
    if (id.startsWith('temp-')) {
      const tempNote = state.notes.find(n => n._id === id);
      if (tempNote && !tempNote.title.trim() && !tempNote.content.trim()) {
        set({
          notes: state.notes.filter(n => n._id !== id),
          openTabs: remainingTabs,
          activeTabId: state.activeTabId === id 
            ? (remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1]._id : null)
            : state.activeTabId
        });
        return;
      }
    }

    set({
      openTabs: remainingTabs,
      activeTabId: state.activeTabId === id 
        ? (remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1]._id : null)
        : state.activeTabId
    });
  },

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateLocalTabContent: (id: string, content: string) => {
    set((state) => ({
      openTabs: state.openTabs.map((t) => (t._id === id ? { ...t, content } : t))
    }));
  },

  updateLocalTabTitle: (id: string, title: string) => {
    set((state) => ({
      openTabs: state.openTabs.map((t) => (t._id === id ? { ...t, title } : t)),
      notes: state.notes.map((n) => (n._id === id ? { ...n, title } : n))
    }));
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const tabs = [...state.openTabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { openTabs: tabs };
    });
  }
}));
