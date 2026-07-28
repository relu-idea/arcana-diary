import React, { useState } from 'react';
import { ArcanaCard } from '../types';
import { Sparkles, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';

interface ArcanaCardDisplayProps {
  card: ArcanaCard;
  isSelected?: boolean;
  onSelect?: () => void;
  showDetails?: boolean;
  isFlippedDefault?: boolean;
}

export const ArcanaCardDisplay: React.FC<ArcanaCardDisplayProps> = ({
  card,
  isSelected = false,
  onSelect,
  showDetails = false,
  isFlippedDefault = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(isFlippedDefault);
  const [activeTab, setActiveTab] = useState<'pos' | 'neg'>('pos');

  return (
    <div
      className={`group relative rounded-2xl transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-amber-400/80 shadow-xl shadow-amber-500/10 scale-[1.01]'
          : 'hover:border-indigo-500/40'
      }`}
    >
      {/* Front Face of Card */}
      <div
        onClick={onSelect}
        className={`cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/80 border p-5 flex flex-col justify-between min-h-[360px] relative shadow-lg ${
          card.card_color
        }`}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/30">
            {card.roman}
          </span>
          <span className="text-xs font-semibold text-slate-200 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
            {card.element}
          </span>
        </div>

        {/* Card Artwork / Symbol Center */}
        <div className="my-5 flex flex-col items-center justify-center text-center z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-400/30 flex items-center justify-center text-5xl sm:text-6xl shadow-inner shadow-black/60 group-hover:scale-105 transition-transform duration-300 relative">
            <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-spin-slow pointer-events-none" />
            {card.symbol_emoji}
          </div>
          <h3 className="mt-4 text-xl sm:text-2xl font-extrabold text-slate-100 tracking-wide">
            {card.name_kr}
          </h3>
          <p className="text-xs sm:text-sm text-indigo-300/80 font-mono tracking-widest uppercase mt-0.5">
            {card.name_en}
          </p>
        </div>

        {/* Core Line Quote */}
        <div className="z-10 bg-slate-900/90 rounded-xl p-3.5 border border-indigo-900/50 text-center shadow-sm">
          <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed italic">
            "{card.core_line}"
          </p>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md animate-bounce-once">
            ✓
          </div>
        )}
      </div>

      {/* Expanded Details Section */}
      {showDetails && (
        <div className="mt-3 bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 text-xs sm:text-sm text-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-bold text-amber-300 text-xs sm:text-sm uppercase tracking-wider">
              관점별 핵심 가치
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'pos'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                긍정적 발현
              </button>
              <button
                onClick={() => setActiveTab('neg')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'neg'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                부정적/불안 상태
              </button>
            </div>
          </div>

          {activeTab === 'pos' ? (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-bold text-slate-100">
                  {card.keywords_positive}
                </span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {card.interpretation_positive}
              </p>
            </div>
          ) : (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2 text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-bold text-slate-100">
                  {card.keywords_negative}
                </span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {card.interpretation_negative}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
