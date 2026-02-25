import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNotesStore } from '../../store/notesStore';
import {
  Loader2, CloudCog, FileText, Plus, Edit2, Eye, Copy, Check,
  Minus, Plus as PlusIcon, Bold, Italic, Strikethrough, Heading,
  List, ListOrdered, Code, CodeSquare, Link, SeparatorHorizontal,
  Maximize2, Minimize2, Quote, Image, Table, ListChecks, Highlighter,
  Undo2, Redo2
} from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { SkeuoButton } from '../ui/SkeuoButton';
import { useUndoRedo } from '../../hooks/useUndoRedo';

const InlineCode = ({ children, ...props }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="relative inline-flex items-center group/inline">
      <code className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
      <button
        onClick={handleCopy}
        className="inline-flex items-center ml-0.5 opacity-0 group-hover/inline:opacity-70 hover:opacity-100! transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
        title="Copy code"
      >
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </span>
  );
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group rounded-md overflow-hidden bg-black/5 dark:bg-white/5 my-4 border border-[var(--border-color)]">
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/10 dark:bg-white/10 text-xs font-mono opacity-70">
          <span>{match[1]}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors flex items-center gap-1"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-4 overflow-x-auto">
          <SyntaxHighlighter
            language={match[1]}
            style={vs2015}
            customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return <InlineCode {...props}>{children}</InlineCode>;
};

interface EditorProps {
  zenMode?: boolean;
  onToggleZen?: () => void;
}

export function Editor({ zenMode = false, onToggleZen }: EditorProps) {
  const { 
    openTabs, 
    activeTabId, 
    updateLocalTabContent, 
    updateLocalTabTitle,
    updateNote,
    createNote
  } = useNotesStore();

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isPreview, setIsPreview] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem('editor-font-size');
    return stored ? Number(stored) : 16;
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const history = useUndoRedo();

  const adjustFontSize = useCallback((delta: number) => {
    setFontSize(prev => {
      const next = Math.min(28, Math.max(12, prev + delta));
      localStorage.setItem('editor-font-size', String(next));
      return next;
    });
  }, []);
  const activeTab = openTabs.find(t => t._id === activeTabId);

  useEffect(() => {
    if (activeTab) history.init(activeTab._id, activeTab.content || '');
  }, [activeTab?._id]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ id: string; title?: string; content?: string } | null>(null);

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const pending = pendingUpdatesRef.current;
    if (!pending) return;
    pendingUpdatesRef.current = null;
    setSaveStatus('saving');
    try {
      await updateNote(pending.id, {
        ...(pending.title !== undefined && { title: pending.title }),
        ...(pending.content !== undefined && { content: pending.content }),
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  }, [updateNote]);

  const triggerAutoSave = useCallback((id: string, updates: { title?: string; content?: string }) => {
    const prev = pendingUpdatesRef.current;
    if (prev && prev.id === id) {
      pendingUpdatesRef.current = { ...prev, ...updates };
    } else {
      pendingUpdatesRef.current = { id, ...updates };
    }
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(flushSave, 1500);
  }, [flushSave]);

  useEffect(() => {
    return () => { flushSave(); };
  }, [flushSave]);

  const activeTabId_ = activeTab?._id ?? '';

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTabId_) return;
    const newTitle = e.target.value;
    updateLocalTabTitle(activeTabId_, newTitle);
    triggerAutoSave(activeTabId_, { title: newTitle });
  }, [activeTabId_, updateLocalTabTitle, triggerAutoSave]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeTabId_) return;
    const newContent = e.target.value;
    updateLocalTabContent(activeTabId_, newContent);
    triggerAutoSave(activeTabId_, { content: newContent });
    history.record(activeTabId_, newContent);
  }, [activeTabId_, updateLocalTabContent, triggerAutoSave, history]);

  const insertMarkdown = useCallback((before: string, after: string, placeholder: string) => {
    if (!activeTabId_) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const scrollPos = ta.scrollTop;
    const text = ta.value;

    history.snapshot(activeTabId_, text);

    const selected = text.substring(start, end) || placeholder;
    const replacement = before + selected + after;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    updateLocalTabContent(activeTabId_, newText);
    triggerAutoSave(activeTabId_, { content: newText });
    history.snapshot(activeTabId_, newText);

    requestAnimationFrame(() => {
      ta.focus();
      ta.scrollTop = scrollPos;
      const cursorPos = start + before.length;
      ta.setSelectionRange(cursorPos, cursorPos + selected.length);
    });
  }, [activeTabId_, updateLocalTabContent, triggerAutoSave, history]);

  const performUndo = useCallback(() => {
    if (!activeTabId_) return;
    const content = history.undo(activeTabId_);
    if (content !== null) {
      updateLocalTabContent(activeTabId_, content);
      triggerAutoSave(activeTabId_, { content });
    }
  }, [activeTabId_, history, updateLocalTabContent, triggerAutoSave]);

  const performRedo = useCallback(() => {
    if (!activeTabId_) return;
    const content = history.redo(activeTabId_);
    if (content !== null) {
      updateLocalTabContent(activeTabId_, content);
      triggerAutoSave(activeTabId_, { content });
    }
  }, [activeTabId_, history, updateLocalTabContent, triggerAutoSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      performUndo();
    } else if ((mod && e.key === 'z' && e.shiftKey) || (mod && e.key === 'y')) {
      e.preventDefault();
      performRedo();
    }
  }, [performUndo, performRedo]);

  const toolbarActions = useMemo(() => [
    { icon: Undo2,         title: 'Undo (Ctrl+Z)',   action: performUndo, disabled: !history.canUndo(activeTabId_) },
    { icon: Redo2,         title: 'Redo (Ctrl+Shift+Z)', action: performRedo, disabled: !history.canRedo(activeTabId_) },
    { divider: true } as const,
    { icon: Bold,          title: 'Bold',            action: () => insertMarkdown('**', '**', 'bold text') },
    { icon: Italic,        title: 'Italic',          action: () => insertMarkdown('*', '*', 'italic text') },
    { icon: Strikethrough, title: 'Strikethrough',   action: () => insertMarkdown('~~', '~~', 'strikethrough') },
    { icon: Highlighter,   title: 'Highlight',       action: () => insertMarkdown('==', '==', 'highlighted') },
    { divider: true } as const,
    { icon: Heading,       title: 'Heading',         action: () => insertMarkdown('## ', '', 'heading') },
    { icon: Quote,         title: 'Blockquote',      action: () => insertMarkdown('> ', '', 'quote') },
    { divider: true } as const,
    { icon: List,          title: 'Bullet List',     action: () => insertMarkdown('- ', '', 'list item') },
    { icon: ListOrdered,   title: 'Numbered List',   action: () => insertMarkdown('1. ', '', 'list item') },
    { icon: ListChecks,    title: 'Task List',       action: () => insertMarkdown('- [ ] ', '', 'task') },
    { divider: true } as const,
    { icon: Code,          title: 'Inline Code',     action: () => insertMarkdown('`', '`', 'code') },
    { icon: CodeSquare,    title: 'Code Block',      action: () => insertMarkdown('```\n', '\n```', 'code here') },
    { divider: true } as const,
    { icon: Link,          title: 'Link',            action: () => insertMarkdown('[', '](url)', 'link text') },
    { icon: Image,         title: 'Image',           action: () => insertMarkdown('![', '](url)', 'alt text') },
    { icon: Table,         title: 'Table',           action: () => insertMarkdown('\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| ', ' | cell | cell |\n', 'cell') },
    { icon: SeparatorHorizontal, title: 'Horizontal Rule', action: () => insertMarkdown('\n---\n', '', '') },
  ] as const, [insertMarkdown, performUndo, performRedo, history, activeTabId_]);

  const { words, chars } = useMemo(() => {
    const content = activeTab?.content || '';
    const trimmed = content.trim();
    return {
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      chars: content.length,
    };
  }, [activeTab?.content]);

  if (!activeTab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-color)] p-6">
        <div className="text-center opacity-70 flex flex-col items-center max-w-sm">
          <div className="w-24 h-24 mb-6 rounded-full bg-[var(--border-color)] flex items-center justify-center shadow-inner">
            <FileText size={40} className="opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Note Selected</h2>
          <p className="mb-8 opacity-70">Choose a note from the sidebar or create a new one to start writing.</p>
          <SkeuoButton onClick={createNote} className="flex items-center gap-2">
            <Plus size={18} />
            <span>Create New Note</span>
          </SkeuoButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-color)] overflow-hidden relative">
      {/* Editor Header */}
      {!zenMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-[var(--border-color)] skeuo-panel gap-2 sm:gap-3">
          <input
            value={activeTab.title}
            onChange={handleTitleChange}
            className="text-xl sm:text-2xl font-bold bg-transparent outline-none border-none placeholder:opacity-50 text-[var(--text-color)] w-full max-w-xl font-excali"
            placeholder="Note Title..."
          />
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsPreview(p => !p)}
              className="p-1.5 sm:p-2 rounded-lg skeuo-btn opacity-70 hover:opacity-100 transition-opacity"
              title={isPreview ? 'Switch to Edit' : 'Switch to Preview'}
            >
              {isPreview ? <Edit2 size={16} /> : <Eye size={16} />}
            </button>

            <div className="hidden sm:flex items-center bg-[var(--border-color)] rounded-lg skeuo-inset">
              <button
                onClick={() => adjustFontSize(-2)}
                disabled={fontSize <= 12}
                className="px-2 py-1.5 text-sm opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
                title="Decrease font size"
              >
                <Minus size={14} />
              </button>
              <span className="text-xs font-medium tabular-nums w-8 text-center opacity-70">{fontSize}</span>
              <button
                onClick={() => adjustFontSize(2)}
                disabled={fontSize >= 28}
                className="px-2 py-1.5 text-sm opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
                title="Increase font size"
              >
                <PlusIcon size={14} />
              </button>
            </div>

            {onToggleZen && (
              <button
                onClick={onToggleZen}
                className="hidden sm:block p-2 rounded-lg skeuo-btn opacity-70 hover:opacity-100 transition-opacity"
                title="Zen Mode"
              >
                <Maximize2 size={16} />
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs font-medium opacity-70 bg-black/5 dark:bg-white/5 px-2 sm:px-3 py-1.5 rounded-full justify-center">
              {saveStatus === 'unsaved' && (
                <span className="opacity-50">Unsaved</span>
              )}
              {saveStatus === 'saving' && (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CloudCog size={14} className="text-green-500" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zen Mode Floating Header */}
      {zenMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-medium opacity-70 bg-black/5 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {saveStatus === 'unsaved' && <span className="opacity-50">Unsaved</span>}
            {saveStatus === 'saving' && (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CloudCog size={14} className="text-green-500" />
                <span>Saved</span>
              </>
            )}
          </div>
          <button
            onClick={onToggleZen}
            className="p-2 rounded-lg skeuo-btn opacity-50 hover:opacity-100 transition-opacity"
            title="Exit Zen Mode (Esc)"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      )}

      {/* Formatting Toolbar */}
      {!isPreview && (
        <div className={`flex items-center flex-nowrap gap-0.5 px-2 sm:px-4 py-1.5 border-b border-[var(--border-color)] bg-[var(--panel-color)]/50 overflow-x-auto no-scrollbar ${zenMode ? 'justify-center' : ''}`}>
          {toolbarActions.map((item, i) =>
            'divider' in item ? (
              <div key={i} className="w-px h-4 bg-[var(--border-color)] mx-1.5" />
            ) : (
              <button
                key={i}
                onClick={item.action}
                disabled={'disabled' in item ? item.disabled : false}
                className="p-1.5 rounded-md opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={item.title}
              >
                <item.icon size={15} />
              </button>
            )
          )}
        </div>
      )}

      {/* Editor Body */}
      <div className={`flex-1 min-h-0 overflow-hidden flex flex-col ${zenMode ? 'p-4 md:p-8' : 'p-2 sm:p-6'}`}>
        <div className="skeuo-inset flex-1 min-h-0 rounded-xl overflow-hidden" style={{ fontSize }}>
          {isPreview ? (
            <div className="max-w-none w-full h-full p-4 md:p-8 overflow-y-auto text-[var(--text-color)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  code: CodeBlock as any,
                  mark: ({ children }) => (
                    <mark className="bg-yellow-200 dark:bg-yellow-500/30 text-[var(--text-color)] px-1 rounded-sm">{children}</mark>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-black/5 dark:bg-white/5">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="border border-[var(--border-color)] px-3 py-2 text-left font-medium">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-[var(--border-color)] px-3 py-2">{children}</td>
                  ),
                  input: ({ type, checked, ...props }) => {
                    if (type === 'checkbox') {
                      return <input type="checkbox" checked={checked} readOnly className="mr-2 accent-blue-500 scale-110" />;
                    }
                    return <input type={type} {...props} />;
                  },
                  li: ({ children, className, ...props }) => (
                    <li className={`${className?.includes('task-list-item') ? 'list-none ml-0' : ''} mb-1`} {...props}>{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 my-4 opacity-80 italic">{children}</blockquote>
                  ),
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-3 pb-2 border-b border-[var(--border-color)]">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-5 mb-2 pb-1 border-b border-[var(--border-color)]">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-lg font-semibold mt-3 mb-1">{children}</h4>,
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children, className }) => (
                    <ul className={`${className?.includes('contains-task-list') ? 'pl-0' : 'pl-6 list-disc'} mb-3`}>{children}</ul>
                  ),
                  ol: ({ children }) => <ol className="pl-6 list-decimal mb-3">{children}</ol>,
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">{children}</a>
                  ),
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt} className="rounded-lg max-w-full my-4 border border-[var(--border-color)]" />
                  ),
                  hr: () => <hr className="my-6 border-[var(--border-color)]" />,
                  del: ({ children }) => <del className="opacity-60">{children}</del>,
                }}
              >
                {(activeTab.content || '*No content yet...*').replace(/==(.*?)==/g, '<mark>$1</mark>')}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={activeTab.content || ''}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full resize-none bg-transparent outline-none text-[var(--text-color)] leading-relaxed font-excali p-4 md:p-8"
              placeholder="Start typing your note here... (Markdown supported)"
              spellCheck="false"
            />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs opacity-50 px-2 font-mono">
          <span>{words} words &middot; {chars} chars</span>
          <span>
            {activeTab.updatedAt ? format(new Date(activeTab.updatedAt), 'MMM d, yyyy h:mm a') : 'Just now'}
          </span>
        </div>
      </div>
    </div>
  );
}
