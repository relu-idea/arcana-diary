import React from 'react';
import { Sparkles, BookOpen, Layers, History, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: 'write' | 'cards' | 'history';
  setActiveTab: (tab: 'write' | 'cards' | 'history') => void;
  historyCount: number;
  onOpenCatalogModal?: () => void;
  onOpenSettings?: () => void;
  isSessionLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  onOpenCatalogModal,
  onOpenSettings,
  isSessionLocked,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-indigo-950/60 px-4 py-3.5 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('write')}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-900 via-purple-900 to-amber-700 flex items-center justify-center shadow-lg shadow-indigo-950/50 border border-indigo-500/30">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-200 via-indigo-100 to-purple-300 bg-clip-text text-transparent tracking-tight">
                Arcana Diary
              </h1>
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 tracking-wider">
                AI Journaling Engine
              </span>
            </div>
            <p className="text-sm text-slate-300 font-light mt-0.5">
              오늘의 나를 아르카나의 시선으로 바라보는 성찰의 저널
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
          <button
            id="nav-write-btn"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'write'
                ? 'bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md shadow-indigo-900/40 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="leading-none">일기 쓰기</span>
          </button>

          <button
            id="nav-cards-btn"
            onClick={() => {
              if (onOpenCatalogModal) {
                onOpenCatalogModal();
              } else {
                setActiveTab('cards');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md shadow-indigo-900/40 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="leading-none">22 아르카나 도감</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md shadow-indigo-900/40 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="leading-none">기록장</span>
            {historyCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-400 text-slate-950 font-extrabold leading-none flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            id="nav-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all cursor-pointer relative flex items-center justify-center shrink-0"
            title="기록장 및 개발자 설정"
            aria-label="기록장 및 개발자 설정"
          >
            <Settings className="w-4 h-4 text-slate-300 shrink-0" />
            {isSessionLocked && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
