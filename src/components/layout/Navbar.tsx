import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  BookOpen,
  HelpCircle,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  Layers,
  Plus,
  FolderPlus,
  ChevronDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { ThemeMode } from '../../hooks/useTheme';

interface NavbarProps {
  onOpenSearch: () => void;
  activeView: string;
  onNavigate: (view: string, id?: string) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenNewTopic: () => void;
  onOpenNewSubject: () => void;
  onOpenNewSection: () => void;
  isUnlocked?: boolean;
  onOpenUnlockModal?: () => void;
  onLock?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  activeView,
  onNavigate,
  theme,
  onThemeChange,
  isSidebarOpen,
  onToggleSidebar,
  onOpenNewTopic,
  onOpenNewSubject,
  onOpenNewSection,
  isUnlocked = false,
  onOpenUnlockModal,
  onLock,
}) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs transition-colors">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 max-w-7xl mx-auto">
        {/* Left: Sidebar toggle & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs group-hover:bg-indigo-700 transition-colors shrink-0">
              ⚡
            </div>
            <div className="truncate max-w-[120px] sm:max-w-none">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-xs sm:text-base leading-none block truncate">
                Engineering Hub
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none hidden sm:block mt-0.5">
                KNOWLEDGE & INTERVIEW PREP
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search Bar Trigger (Ctrl + K) - Desktop */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search knowledge base, code, Q&A...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg md:hidden cursor-pointer"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* LOCK / UNLOCK TOGGLE BUTTON */}
          <button
            onClick={isUnlocked ? onLock : onOpenUnlockModal}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isUnlocked
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                : 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
            title={
              isUnlocked
                ? 'Platform Unlocked in Editor Mode (Click to Lock)'
                : 'Platform Locked in Read-Only Mode (Click to Unlock with password)'
            }
          >
            {isUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline text-[11px] font-bold">Unlocked</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="hidden sm:inline text-[11px] font-bold">Locked</span>
              </>
            )}
          </button>

          {/* "+ Create" Dropdown Action - ONLY VISIBLE WHEN UNLOCKED */}
          {isUnlocked && (
            <div className="relative" ref={createMenuRef}>
              <button
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {isCreateMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      onOpenNewTopic();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>New Topic</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      onOpenNewSection();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <FolderPlus className="w-4 h-4 text-emerald-500" />
                    <span>New Section</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      onOpenNewSubject();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left border-t border-slate-100 dark:border-slate-800 mt-1 pt-1.5"
                  >
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>New Subject</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Interview Mode Link */}
          <button
            onClick={() => onNavigate('interview')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'interview'
                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Interview Mode"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden lg:inline">Interview Mode</span>
          </button>

          {/* Theme Selector Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800/80">
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 text-indigo-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('system')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="System Theme"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
