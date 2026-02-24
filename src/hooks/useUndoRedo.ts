import { useRef, useCallback, useSyncExternalStore } from 'react';

const MAX_HISTORY = 50;

interface HistoryEntry {
  past: string[];
  future: string[];
  /** The last content value we recorded — used to detect duplicates. */
  present: string;
}

function emptyEntry(initial: string): HistoryEntry {
  return { past: [], future: [], present: initial };
}

/**
 * Per-tab undo/redo manager.
 *
 * Stores history stacks in a plain Map (stable across renders via ref).
 * Uses `useSyncExternalStore` so React re-renders only when canUndo/canRedo
 * actually change, keeping the editor fast.
 */
export function useUndoRedo() {
  const historyMap = useRef(new Map<string, HistoryEntry>());
  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Revision counter — bumped whenever any stack changes so subscribers re-render.
  const revision = useRef(0);
  const listeners = useRef(new Set<() => void>());

  const subscribe = useCallback((cb: () => void) => {
    listeners.current.add(cb);
    return () => { listeners.current.delete(cb); };
  }, []);

  const notify = useCallback(() => {
    revision.current += 1;
    listeners.current.forEach(l => l());
  }, []);

  const getSnapshot = useCallback(() => revision.current, []);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const getEntry = useCallback((tabId: string, fallback = ''): HistoryEntry => {
    let entry = historyMap.current.get(tabId);
    if (!entry) {
      entry = emptyEntry(fallback);
      historyMap.current.set(tabId, entry);
    }
    return entry;
  }, []);

  /**
   * Immediately snapshot the current content into the past stack.
   * Called before programmatic insertions (toolbar actions) so the
   * pre-insertion state is always recoverable.
   */
  const snapshot = useCallback((tabId: string, currentContent: string) => {
    const timer = debounceTimers.current.get(tabId);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.current.delete(tabId);
    }

    const entry = getEntry(tabId, currentContent);
    if (entry.present === currentContent) return;
    entry.past.push(entry.present);
    if (entry.past.length > MAX_HISTORY) entry.past.shift();
    entry.future = [];
    entry.present = currentContent;
    notify();
  }, [getEntry, notify]);

  /**
   * Debounced record — groups rapid keystrokes into a single undo step.
   * Call this on every keystroke (onChange).
   */
  const record = useCallback((tabId: string, content: string) => {
    const entry = getEntry(tabId, content);

    const existingTimer = debounceTimers.current.get(tabId);
    if (existingTimer) clearTimeout(existingTimer);

    debounceTimers.current.set(tabId, setTimeout(() => {
      debounceTimers.current.delete(tabId);
      if (entry.present === content) return;
      entry.past.push(entry.present);
      if (entry.past.length > MAX_HISTORY) entry.past.shift();
      entry.future = [];
      entry.present = content;
      notify();
    }, 300));
  }, [getEntry, notify]);

  const undo = useCallback((tabId: string): string | null => {
    const entry = getEntry(tabId);
    if (entry.past.length === 0) return null;

    // Flush any pending debounce so the latest typed content is saved
    const timer = debounceTimers.current.get(tabId);
    if (timer) clearTimeout(timer);
    debounceTimers.current.delete(tabId);

    entry.future.push(entry.present);
    entry.present = entry.past.pop()!;
    notify();
    return entry.present;
  }, [getEntry, notify]);

  const redo = useCallback((tabId: string): string | null => {
    const entry = getEntry(tabId);
    if (entry.future.length === 0) return null;

    entry.past.push(entry.present);
    entry.present = entry.future.pop()!;
    notify();
    return entry.present;
  }, [getEntry, notify]);

  const canUndo = useCallback((tabId: string): boolean => {
    return (historyMap.current.get(tabId)?.past.length ?? 0) > 0;
  }, []);

  const canRedo = useCallback((tabId: string): boolean => {
    return (historyMap.current.get(tabId)?.future.length ?? 0) > 0;
  }, []);

  const clearHistory = useCallback((tabId: string) => {
    historyMap.current.delete(tabId);
    const timer = debounceTimers.current.get(tabId);
    if (timer) clearTimeout(timer);
    debounceTimers.current.delete(tabId);
    notify();
  }, [notify]);

  /**
   * Initialize/sync the "present" pointer without creating an undo entry.
   * Call when a tab is first opened or switched to.
   */
  const init = useCallback((tabId: string, content: string) => {
    const entry = getEntry(tabId, content);
    entry.present = content;
  }, [getEntry]);

  return { record, snapshot, undo, redo, canUndo, canRedo, clearHistory, init };
}
