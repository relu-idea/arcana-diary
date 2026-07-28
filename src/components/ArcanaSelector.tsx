import React, { useState } from 'react';
import { ArcanaCard } from '../types';
import { MAJOR_ARCANA_CARDS } from '../data/arcanaData';
import { ArcanaCardDisplay } from './ArcanaCardDisplay';
import { Shuffle, Search, Sparkles, Filter, Check } from 'lucide-react';

interface ArcanaSelectorProps {
  selectedCard: ArcanaCard | null;
  onSelectCard: (card: ArcanaCard) => void;
}

export const ArcanaSelector: React.FC<ArcanaSelectorProps> = ({
  selectedCard,
  onSelectCard,
}) => {
  const [selectMode, setSelectMode] = useState<'random' | 'catalog'>('random');
  const [searchQuery, setSearchQuery] = useState('');
  const [elementFilter, setElementFilter] = useState<string>('all');
  
  // Random card draw animation states
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<ArcanaCard[]>([]);

  // Perform random draw of 3 mystery cards
  const handleDrawRandomCards = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const shuffled = [...MAJOR_ARCANA_CARDS].sort(() => 0.5 - Math.random());
      setDrawnCards(shuffled.slice(0, 3));
      setIsShuffling(false);
    }, 600);
  };

  // Filter catalog
  const filteredCards = MAJOR_ARCANA_CARDS.filter((card) => {
    const matchesSearch =
      card.name_kr.includes(searchQuery) ||
      card.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.keywords_positive.includes(searchQuery) ||
      card.keywords_negative.includes(searchQuery);

    const matchesElement =
      elementFilter === 'all' || card.element === elementFilter;

    return matchesSearch && matchesElement;
  });

  return (
    <div className="space-y-5">
      {/* Selector Mode Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            아르카나 카드 선택
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs sm:text-sm">
          <button
            onClick={() => {
              setSelectMode('random');
              if (drawnCards.length === 0) handleDrawRandomCards();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              selectMode === 'random'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>오늘의 뽑기</span>
          </button>

          <button
            onClick={() => setSelectMode('catalog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              selectMode === 'catalog'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>22종 전체 보기</span>
          </button>
        </div>
      </div>

      {/* Selected Card Badge & Highlights */}
      {selectedCard && (
        <div className="bg-gradient-to-r from-amber-950/50 via-indigo-950/50 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <span className="text-4xl p-2 rounded-2xl bg-slate-950/80 border border-amber-500/20 flex-shrink-0">
              {selectedCard.symbol_emoji}
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  [{selectedCard.roman}]
                </span>
                <span className="text-lg font-extrabold text-slate-100">
                  {selectedCard.name_kr}
                </span>
                <span className="text-xs text-indigo-300/80 font-mono">
                  ({selectedCard.name_en})
                </span>
                <span className="text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                  {selectedCard.element}
                </span>
              </div>
              <p className="text-sm text-slate-200 font-medium leading-relaxed italic">
                "{selectedCard.core_line}"
              </p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 self-start sm:self-center flex-shrink-0">
            <Check className="w-4 h-4" /> 선택된 아르카나
          </span>
        </div>
      )}

      {/* Mode 1: Random Draw */}
      {selectMode === 'random' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              오늘 나에게 말을 건네는 세 장의 카드 중 마음이 이끄는 하나를 선택해보세요.
            </p>
            <button
              onClick={handleDrawRandomCards}
              disabled={isShuffling}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold transition-all disabled:opacity-50 self-start sm:self-auto"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>카드 다시 섞기</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {drawnCards.length === 0 ? (
              <div className="col-span-3 py-10 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-3">
                <p className="text-slate-300 text-base font-medium">
                  오늘 나에게 말을 건네는 아르카나 카드를 셔플해보세요.
                </p>
                <button
                  onClick={handleDrawRandomCards}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-sm hover:brightness-110 shadow-lg shadow-amber-950/40"
                >
                  오늘의 아르카나 셔플
                </button>
              </div>
            ) : (
              drawnCards.map((card) => (
                <ArcanaCardDisplay
                  key={card.id}
                  card={card}
                  isSelected={selectedCard?.id === card.id}
                  onSelect={() => onSelectCard(card)}
                  showDetails={selectedCard?.id === card.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Catalog Grid */}
      {selectMode === 'catalog' && (
        <div className="space-y-4">
          {/* Search and Element Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="카드명 또는 키워드 검색 (예: 바보, 자유, 직관)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm w-full sm:w-auto">
              {['all', '공기', '물', '불', '흙'].map((elem) => (
                <button
                  key={elem}
                  onClick={() => setElementFilter(elem)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    elementFilter === elem
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {elem === 'all' ? '전체' : elem}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[520px] overflow-y-auto pr-1">
            {filteredCards.map((card) => (
              <ArcanaCardDisplay
                key={card.id}
                card={card}
                isSelected={selectedCard?.id === card.id}
                onSelect={() => onSelectCard(card)}
                showDetails={selectedCard?.id === card.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
