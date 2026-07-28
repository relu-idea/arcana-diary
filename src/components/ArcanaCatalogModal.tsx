import React, { useState } from 'react';
import { ArcanaCard } from '../types';
import { MAJOR_ARCANA_CARDS } from '../data/arcanaData';
import { ArcanaCardDisplay } from './ArcanaCardDisplay';
import { X, Search, Filter, Sparkles, Check } from 'lucide-react';

interface ArcanaCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCard: ArcanaCard | null;
  onSelectCard: (card: ArcanaCard) => void;
}

export const ArcanaCatalogModal: React.FC<ArcanaCatalogModalProps> = ({
  isOpen,
  onClose,
  selectedCard,
  onSelectCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [elementFilter, setElementFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredCards = MAJOR_ARCANA_CARDS.filter((card) => {
    const matchesSearch =
      card.name_kr.includes(searchQuery) ||
      card.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.keywords_positive.includes(searchQuery) ||
      card.keywords_negative.includes(searchQuery) ||
      card.core_line.includes(searchQuery);

    const matchesElement =
      elementFilter === 'all' || card.element === elementFilter;

    return matchesSearch && matchesElement;
  });

  const handleCardClick = (card: ArcanaCard) => {
    onSelectCard(card);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">
                22 메이저 아르카나 도감
              </h3>
              <p className="text-xs text-slate-400">
                원하는 아르카나 카드를 직접 탐색하고 선택할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Element Filter Controls */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="카드명 또는 키워드 검색 (예: 바보, 자유, 직관)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs sm:text-sm w-full sm:w-auto">
            {['all', '공기', '물', '불', '흙'].map((elem) => (
              <button
                key={elem}
                onClick={() => setElementFilter(elem)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  elementFilter === elem
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {elem === 'all' ? '전체' : elem}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid List */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-950/30">
          {filteredCards.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              검색 조건과 일치하는 아르카나 카드가 없습니다.
            </div>
          ) : (
            filteredCards.map((card) => {
              const isSelected = selectedCard?.id === card.id;
              return (
                <div key={card.id} className="relative space-y-2">
                  <ArcanaCardDisplay
                    card={card}
                    isSelected={isSelected}
                    onSelect={() => handleCardClick(card)}
                  />
                  <button
                    onClick={() => handleCardClick(card)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                        : 'bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-slate-800'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>선택된 아르카나</span>
                      </>
                    ) : (
                      <span>이 카드로 선택하기</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
