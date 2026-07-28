import React, { useState } from 'react';
import { ArcanaCard, getMoodOption } from '../types';
import { Sparkles, Volume2, VolumeX, Copy, Check, BookmarkPlus, Share2, MessageSquareHeart } from 'lucide-react';

interface FeedbackCardProps {
  feedback: string;
  arcana: ArcanaCard;
  diaryContent: string;
  analyzedAt: string;
  selectedMood?: string;
  onSaveToHistory?: () => void;
  isSaved?: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  arcana,
  diaryContent,
  analyzedAt,
  selectedMood,
  onSaveToHistory,
  isSaved = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  const moodInfo = getMoodOption(selectedMood);

  // Copy feedback text
  const handleCopy = () => {
    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text-to-speech reading in Korean warm voice
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('사용 중인 브라우저가 음성 재생(TTS)을 지원하지 않습니다.');
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    window.speechSynthesis.cancel(); // clear queue
    const utterance = new SpeechSynthesisUtterance(feedback);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // gentle warm pace
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingSpeech(true);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-6 animate-fadeIn relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/60 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
            {arcana.symbol_emoji}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
              [{arcana.roman}] [{arcana.name_kr}] 카드가 건네는 아르카나의 깊은 지혜
            </h3>
          </div>
        </div>

        {/* Enlarged Mood Stamp */}
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          {selectedMood && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border-2 sm:border-3 border-dashed ${moodInfo.stampBg} ${moodInfo.stampBorder} ${moodInfo.stampText} text-sm sm:text-base font-black tracking-wider shadow-xl transform -rotate-2 hover:rotate-0 transition-transform select-none`}
              title={`오늘의 감정 도장: ${moodInfo.label}`}
            >
              <span className="text-xl sm:text-2xl drop-shadow-sm">{moodInfo.emoji}</span>
              <span className="text-sm sm:text-base font-black">{moodInfo.shortLabel}</span>
              <span className="text-[10px] sm:text-xs font-mono opacity-80 border-l-2 border-current pl-1.5 ml-1 tracking-widest">STAMP</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Feedback Speech Box */}
      <div className="relative bg-slate-950/90 rounded-2xl p-6 border border-amber-500/30 shadow-inner space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-amber-300 font-medium border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageSquareHeart className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="font-bold text-sm sm:text-base text-amber-200/95 italic truncate">
              "{arcana.core_line}"
            </span>
          </div>

          {/* Audio TTS Button */}
          <button
            onClick={handleToggleSpeech}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isPlayingSpeech
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-200 hover:text-amber-200 border border-slate-700'
            }`}
          >
            {isPlayingSpeech ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            <span>{isPlayingSpeech ? '재생 멈춤' : '음성으로 듣기'}</span>
          </button>
        </div>

        {/* Feedback Text Body - Enlarged for Reading Comfort */}
        <p className="text-base sm:text-lg text-slate-100 font-serif leading-relaxed tracking-wide whitespace-pre-line py-2">
          {feedback}
        </p>

        <div className="text-right text-xs text-slate-400 font-mono pt-1">
          분석 시각: {new Date(analyzedAt).toLocaleString('ko-KR')}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? '복사됨!' : '피드백 복사'}</span>
          </button>

          {onSaveToHistory && (
            <button
              onClick={onSaveToHistory}
              disabled={isSaved}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isSaved
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 cursor-default'
                  : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40'
              }`}
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{isSaved ? '기록장에 보관됨' : '기록장에 보관하기'}</span>
            </button>
          )}
        </div>

        <span className="text-xs sm:text-sm text-amber-400/90 font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> 오늘의 성찰 완료
        </span>
      </div>
    </div>
  );
};
