import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Hash, BookOpen, HelpCircle, Layers, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { SearchResult } from '../../types';
import { storageService } from '../../services/storageService';
import { SubjectIcon } from '../common/SubjectIcon';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const results = useSearch(query);

  const dynamicSuggestions = useMemo(() => {
    const store = storageService.getStore();
    const list: string[] = store.subjects.map((s) => s.name);
    store.topics.slice(0, 5).forEach((t) => {
      if (!list.includes(t.title)) list.push(t.title);
    });
    return list;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0
        );
      } else if (e.key === 'Enter') {
        if (results.length > 0 && results[selectedIndex]) {
          e.preventDefault();
          onSelectResult(results[selectedIndex]);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelectResult]);

  if (!isOpen) return null;

  const getResultIcon = (item: SearchResult) => {
    switch (item.type) {
      case 'subject':
        return <SubjectIcon name={item.title} className="w-4 h-4" />;
      case 'topic':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'interview_question':
        return <HelpCircle className="w-4 h-4 text-amber-500" />;
      case 'tag':
        return <Hash className="w-4 h-4 text-emerald-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, topics, interview questions, tags... (e.g. .NET, GO, SQL)"
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {query.trim().length < 2 ? (
            <div className="py-12 px-6 text-center text-slate-400 text-sm">
              <p className="font-medium text-slate-600 dark:text-slate-300">
                Search the Knowledge Base
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Type at least 2 characters to search across topics, code snippets, notes, and interview prep.
              </p>
              {dynamicSuggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-2">
                    Quick search:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {dynamicSuggestions.map((sample) => (
                      <button
                        key={sample}
                        onClick={() => setQuery(sample)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                      >
                        <SubjectIcon name={sample} className="w-3.5 h-3.5" />
                        <span>{sample}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No results found for &ldquo;<span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>&rdquo;
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{getResultIcon(item)}</span>
                      <span className="font-semibold text-sm truncate">{item.title}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.matchedField}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-400 truncate">
                    {item.breadcrumb}
                  </div>

                  {item.snippet && (
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {item.snippet}
                    </div>
                  )}

                  {item.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <CornerDownLeft className="w-3 h-3 inline" />
              </kbd>
              <span>select</span>
            </span>
          </div>
          <div>{results.length} matches</div>
        </div>
      </div>
    </div>
  );
};
