import React from 'react';
import { DIARY_SAMPLE_PRESETS } from '../data/arcanaData';
import { MOOD_OPTIONS } from '../types';
import { PenTool, Sparkles, Wand2, RotateCcw, Calendar, Smile } from 'lucide-react';

interface DiaryEditorProps {
  diaryContent: string;
  setDiaryContent: (content: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedArcanaName?: string;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
}

export const DiaryEditor: React.FC<DiaryEditorProps> = ({
  diaryContent,
  setDiaryContent,
  onSubmit,
  isLoading,
  selectedArcanaName,
  selectedMood,
  setSelectedMood,
}) => {
  const charCount = diaryContent.length;
  const wordCount = diaryContent.trim() ? diaryContent.trim().split(/\s+/).length : 0;

  const handleLoadPreset = (content: string) => {
    setDiaryContent(content);
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-2xl">
      {/* Header & Date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <PenTool className="w-5 h-5 text-amber-300" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            오늘의 일기 쓰기
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
        </div>
      </div>

      {/* Preset Example Buttons */}
      <div className="space-y-2">
        <span className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-1.5">
          <Wand2 className="w-4 h-4 text-indigo-400" /> 예시 일기 불러오기 (샘플 데이터):
        </span>
        <div className="flex flex-wrap gap-2">
          {DIARY_SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset.content)}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-indigo-950/80 text-slate-200 hover:text-amber-200 border border-slate-800 hover:border-indigo-500/50 transition-all font-medium"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Mood Tag Selector */}
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <span className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-1.5 flex-shrink-0">
          <Smile className="w-4 h-4 text-amber-400" /> 오늘의 감정:
        </span>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                selectedMood === mood.id
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className="text-base">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Input - Spacious & High Readability */}
      <div className="relative">
        <textarea
          id="diary-input-textarea"
          value={diaryContent}
          onChange={(e) => setDiaryContent(e.target.value)}
          placeholder="오늘 일어난 사건, 마음속 깊이 번진 감정, 누군가에게 쉽게 털어놓지 못했던 고민들을 솔직하게 기록해보세요..."
          rows={9}
          className="w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 text-base sm:text-lg p-5 sm:p-6 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 leading-relaxed min-h-[240px] resize-y font-sans"
        />

        {/* Counter & Clear */}
        <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span>{charCount}자 ({wordCount} 단어)</span>
          {charCount > 0 && (
            <button
              onClick={() => setDiaryContent('')}
              className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              title="내용 비우기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-400 space-y-1">
          <p>* 오늘 기록한 일기는 당신이 선택한 아르카나 카드의 깊은 지혜를 담아, 다정한 독백 형태로 따뜻하게 분석됩니다.</p>
          <p>* 소중한 일기는 브라우저 내의 로컬 공간에 저장됩니다.</p>
          <p>* 일기를 파일로 내보낼 때는 전체 내용이 암호화 다운로드 되며, 임의로 내용을 볼 수 없습니다.</p>
        </div>

        <button
          id="submit-diary-analysis-btn"
          onClick={onSubmit}
          disabled={isLoading || !diaryContent.trim()}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 25% to-amber-500 text-slate-950 font-extrabold text-sm sm:text-base hover:brightness-110 shadow-xl shadow-amber-500/20 border border-amber-300/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>{selectedArcanaName ? `${selectedArcanaName}의 시선으로 읽는 중...` : '아르카나 분석 중...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
              <span>아르카나 피드백 생성하기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
