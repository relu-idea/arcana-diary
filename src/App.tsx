import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DiaryEditor } from './components/DiaryEditor';
import { FeedbackCard } from './components/FeedbackCard';
import { JournalHistory } from './components/JournalHistory';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { ArcanaCatalogModal } from './components/ArcanaCatalogModal';
import { JournalSettingsModal } from './components/JournalSettingsModal';
import { ArcanaCardDisplay } from './components/ArcanaCardDisplay';
import { ArcanaCard, SavedJournalEntry, ApiResponse, JournalLockConfig } from './types';
import { MAJOR_ARCANA_CARDS } from './data/arcanaData';
import { exportEncryptedBackup, importEncryptedBackup } from './utils/crypto';
import { Sparkles, AlertCircle, Layers, History, Lock, Shuffle, RotateCcw, HelpCircle, Check, Grid } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'write' | 'cards' | 'history'>('write');
  const [selectedCard, setSelectedCard] = useState<ArcanaCard | null>(null); // null = Random Arcana state
  const [selectedMood, setSelectedMood] = useState<string>('hopeful');
  const [diaryContent, setDiaryContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackResponse, setFeedbackResponse] = useState<string | null>(null);
  const [lastApiResponse, setLastApiResponse] = useState<ApiResponse | null>(null);
  const [historyEntries, setHistoryEntries] = useState<SavedJournalEntry[]>([]);
  const [isSavedToHistory, setIsSavedToHistory] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Global Lock Config & Session Unlock state
  const [lockConfig, setLockConfig] = useState<JournalLockConfig | null>(() => {
    try {
      const saved = localStorage.getItem('arcana_journal_lock_config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isUnlockedInSession, setIsUnlockedInSession] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('arcana_journal_session_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const isSessionLocked = !!(lockConfig?.enabled && !isUnlockedInSession);
  const [isJournalSettingsOpen, setIsJournalSettingsOpen] = useState<boolean>(false);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Save Lock Config
  const handleSaveLockConfig = (config: JournalLockConfig | null) => {
    setLockConfig(config);
    if (config && config.enabled) {
      localStorage.setItem('arcana_journal_lock_config', JSON.stringify(config));
      sessionStorage.setItem('arcana_journal_session_unlocked', 'true');
      setIsUnlockedInSession(true);
    } else {
      localStorage.removeItem('arcana_journal_lock_config');
      sessionStorage.removeItem('arcana_journal_session_unlocked');
      setIsUnlockedInSession(true);
    }
  };

  // Handle Unlock Session
  const handleUnlockSession = (pwd: string): boolean => {
    if (lockConfig?.enabled && lockConfig.password === pwd.trim()) {
      sessionStorage.setItem('arcana_journal_session_unlocked', 'true');
      setIsUnlockedInSession(true);
      return true;
    }
    return false;
  };

  // Encrypted Backup Export
  const handleExportBackup = async () => {
    if (historyEntries.length === 0) {
      alert('백업할 일기 기록이 없습니다.');
      return;
    }
    try {
      const encryptedData = await exportEncryptedBackup(historyEntries);
      const blob = new Blob([encryptedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `arcana_journal_backup_${dateStr}.arcana`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Backup failed:', e);
      alert('백업 도중 오류가 발생했습니다.');
    }
  };

  // Import Backup File
  const handleGlobalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let imported: SavedJournalEntry[] = [];

      if (file.name.endsWith('.arcana')) {
        imported = await importEncryptedBackup(text);
      } else {
        imported = JSON.parse(text);
      }

      if (Array.isArray(imported)) {
        handleImportHistoryEntries(imported, 'merge');
        alert(`${imported.length}개의 일기를 성공적으로 불러와 병합하였습니다.`);
      } else {
        alert('올바른 백업 파일 형식이 아닙니다.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert('파일을 불러오는 도중 오류가 발생했습니다.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Load saved history on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arcana_diary_history');
      if (saved) {
        setHistoryEntries(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // Shuffle 1 random card
  const handleShuffleCard = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * MAJOR_ARCANA_CARDS.length);
      setSelectedCard(MAJOR_ARCANA_CARDS[randomIndex]);
      setFeedbackResponse(null);
      setIsShuffling(false);
    }, 250);
  };

  // Reset to random status
  const handleResetToRandom = () => {
    setSelectedCard(null);
    setFeedbackResponse(null);
  };

  // Submit diary analysis to server
  const handleAnalyzeDiary = async () => {
    if (!diaryContent.trim()) return;

    // Fallback to random card if not explicitly selected
    let cardToUse = selectedCard;
    if (!cardToUse) {
      const randomIndex = Math.floor(Math.random() * MAJOR_ARCANA_CARDS.length);
      cardToUse = MAJOR_ARCANA_CARDS[randomIndex];
      setSelectedCard(cardToUse);
    }

    setIsLoading(true);
    setError(null);
    setIsSavedToHistory(false);
    setFeedbackResponse(null);

    try {
      const payload = {
        diary_content: diaryContent.trim(),
        selected_arcana: {
          id: cardToUse.id,
          name_kr: cardToUse.name_kr,
          core_line: cardToUse.core_line,
          keywords_positive: cardToUse.keywords_positive,
          keywords_negative: cardToUse.keywords_negative,
          interpretation_positive: cardToUse.interpretation_positive,
          interpretation_negative: cardToUse.interpretation_negative,
        }
      };

      let feedbackText: string | null = null;

      try {
        const res = await fetch('/api/analyze-diary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setLastApiResponse(data);
          if (data.success && data.feedback) {
            feedbackText = data.feedback;
          }
        }
      } catch (serverErr) {
        console.warn('Server API unavailable, checking client Gemini API key fallback...', serverErr);
      }

      // If server API did not return feedback, check client-side Gemini fallback
      if (!feedbackText) {
        const clientApiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || localStorage.getItem('user_gemini_api_key') || '';
        if (clientApiKey) {
          const systemInstruction = `
너는 사용자의 하루를 기록한 일기를 분석하고, 지정된 타로 메이저 아르카나 카드의 고유한 성격과 시선으로 따뜻하고 통찰력 있는 피드백을 제공하는 'Arcana Diary'의 생성형 AI 저널링 엔진이다.
이 서비스는 미래를 점치는 '타로 점'이 아니라, '오늘의 나를 특정 아르카나의 시선으로 바라보는 치유와 성찰의 저널링 서비스'이다. 유저를 다정하게 보듬어주는 초등학교 담임선생님 같은 따뜻함과, 삶을 꿰뚫어 보는 타로 카드의 깊은 지혜를 동시에 갖춘 어투를 유지하라.

# 기본 출력 규칙 (Output Constraints)
1. 글자 수 및 문장 제한: 반드시 3~5문장 이내로 명확하고 군더더기 없이 작성하라.
2. 톤앤매너: 절대 차갑거나 분석적인 보고서 형태를 취하지 말 것. 공감과 위로를 바탕으로 하되, 카드가 가진 코어 가치를 깨달을 수 있는 조언을 포함하라.
3. 금지 사항: 전문적인 의학적/정신과적 진단이나 조언을 절대 하지 말 것. 예언이나 미래의 길흉화복을 단정 짓지 말 것.

# 응답 템플릿 (Response Format)
오직 유저에게 건네는 3~5문장의 따뜻한 피드백 텍스트만 출력하라. 마크다운 태그나 안내 문구는 일절 제외한다.
`.trim();

          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${clientApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: JSON.stringify(payload, null, 2) }] }]
              })
            });

            if (response.ok) {
              const resultData = await response.json();
              const textResult = resultData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              feedbackText = textResult.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
            } else {
              const errJson = await response.json().catch(() => ({}));
              console.error("Gemini Direct Client API Error:", errJson);
              throw new Error(errJson?.error?.message || `Gemini API 응답 오류 (${response.status})`);
            }
          } catch (apiErr: any) {
            console.error("Client API Fetch Error:", apiErr);
            throw new Error(`Gemini API 호출에 실패했습니다: ${apiErr.message || 'API 키를 확인해주세요.'}`);
          }
        }
      }

      if (!feedbackText) {
        throw new Error('AI 피드백을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      }

      setFeedbackResponse(feedbackText);
    } catch (err: any) {
      console.error('Diary Analysis Error:', err);
      setError(err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save current feedback entry to history
  const handleSaveToHistory = () => {
    if (!feedbackResponse || !selectedCard) return;

    const newEntry: SavedJournalEntry = {
      id: `journal_${Date.now()}`,
      date: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      diary_content: diaryContent,
      selected_arcana: selectedCard,
      feedback: feedbackResponse,
      mood: selectedMood,
    };

    const updated = [newEntry, ...historyEntries];
    setHistoryEntries(updated);
    localStorage.setItem('arcana_diary_history', JSON.stringify(updated));
    setIsSavedToHistory(true);
  };

  // Delete history entry
  const handleDeleteHistoryEntry = (id: string) => {
    const updated = historyEntries.filter((e) => e.id !== id);
    setHistoryEntries(updated);
    localStorage.setItem('arcana_diary_history', JSON.stringify(updated));
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistoryEntries([]);
    localStorage.removeItem('arcana_diary_history');
  };

  // Import entries (merge or overwrite)
  const handleImportHistoryEntries = (importedEntries: SavedJournalEntry[], mode: 'merge' | 'overwrite') => {
    let updated: SavedJournalEntry[];
    if (mode === 'overwrite') {
      updated = importedEntries;
    } else {
      // Merge: avoid duplicate IDs
      const existingIds = new Set(historyEntries.map((e) => e.id));
      const newOnly = importedEntries.filter((e) => !existingIds.has(e.id));
      updated = [...newOnly, ...historyEntries];
    }
    
    // Sort entries by date descending if possible
    setHistoryEntries(updated);
    localStorage.setItem('arcana_diary_history', JSON.stringify(updated));
  };

  // Select entry from history to view in main tab
  const handleSelectHistoryEntry = (entry: SavedJournalEntry) => {
    setSelectedCard(entry.selected_arcana);
    setDiaryContent(entry.diary_content);
    setFeedbackResponse(entry.feedback);
    setIsSavedToHistory(true);
    setActiveTab('write');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={historyEntries.length}
        onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
        onOpenSettings={() => setIsJournalSettingsOpen(true)}
        isSessionLocked={isSessionLocked}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-8 space-y-8">
        {/* TAB 1: WRITE JOURNAL */}
        {activeTab === 'write' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Integrated Hero Section Banner (2:1 Ratio Layout) */}
            <div className="relative rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-900/60 p-6 sm:p-8 shadow-2xl overflow-hidden space-y-5">
              {/* Background Ambient Glow */}
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* 2:1 Ratio Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start relative z-10">
                {/* Left 2/3 Column */}
                <div className="md:col-span-2 flex flex-col items-start justify-start space-y-4">
                  {/* Top Left Badge & Mobile Buttons Line */}
                  <div className="w-full flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>오늘의 시선, 내 안의 아르카나</span>
                    </div>

                    {/* Mobile/Tablet Fallback Top Action Buttons */}
                    <div className="flex md:hidden items-center gap-2">
                      <button
                        onClick={handleResetToRandom}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition-all"
                        title="랜덤 상태로 돌림"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span>초기화</span>
                      </button>

                      <button
                        onClick={() => setIsCatalogModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 text-amber-300 border border-indigo-500/40 text-xs font-bold transition-all"
                      >
                        <Grid className="w-3.5 h-3.5 text-amber-300" />
                        <span>22종 전체보기</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-100 leading-tight">
                      타로 아르카나의 깊은 직관으로 읽어내는 저널링
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-light">
                      미래를 점치는 타로 점이 아닙니다.
                      <br />
                      오늘 하루 내 안에서 깨어난 아르카나 카드를 선택하고 일기를 적어보세요.
                      <br />
                      오늘의 나를 다정하게 보듬어줄 아르카나 카드를 셔플해보세요.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleShuffleCard}
                      disabled={isShuffling}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 25% to-amber-500 hover:brightness-110 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-amber-950/50 border border-amber-300/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Shuffle className={`w-5 h-5 text-slate-950 ${isShuffling ? 'animate-spin' : ''}`} />
                      <span>오늘의 아르카나 셔플</span>
                    </button>
                  </div>
                </div>

                {/* Right 1/3 Column */}
                <div className="md:col-span-1 flex flex-col space-y-3.5">
                  {/* Desktop Right Top Actions (Aligned horizontally with Left Top Badge) */}
                  <div className="hidden md:flex items-center justify-end gap-2.5 min-h-[30px]">
                    <button
                      onClick={handleResetToRandom}
                      className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-sm"
                      title="랜덤 상태로 돌림"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>초기화(랜덤상태로 돌림)</span>
                    </button>

                    <button
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-900/90 to-purple-900/90 hover:from-indigo-800 hover:to-purple-800 text-amber-300 border border-indigo-500/40 text-xs sm:text-sm font-bold transition-all shadow-md"
                    >
                      <Grid className="w-3.5 h-3.5 text-amber-300" />
                      <span>22종 전체보기</span>
                    </button>
                  </div>

                  {/* Right Card Box */}
                  <div className="bg-slate-950/80 rounded-2xl p-5 border border-amber-500/30 shadow-xl flex flex-col items-center justify-start text-center relative overflow-hidden group min-h-[220px]">
                    {!selectedCard ? (
                      /* 1. 기본: 랜덤 아르카나 상태 */
                      <div className="space-y-3.5 py-2 my-auto">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 flex items-center justify-center text-amber-300 shadow-inner relative">
                          <div className="absolute inset-0 rounded-2xl border border-amber-400/20 animate-spin-slow pointer-events-none" />
                          <HelpCircle className="w-12 h-12 text-amber-300/80 animate-pulse" />
                        </div>

                        <div>
                          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            랜덤 아르카나 상태
                          </span>
                          <p className="text-xs sm:text-sm text-slate-300/80 mt-2.5 leading-relaxed">
                            오늘의 아르카나 셔플을 하지 않고 일기를 쓰면,
                            <br />
                            <strong className="text-amber-200">22장 중의 랜덤 카드</strong>가 일기 피드백을 드립니다.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* 2. 셔플 시: 1장의 카드 등장 */
                      <div className="space-y-3 w-full animate-fadeIn my-auto">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                            [{selectedCard.roman}]
                          </span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 선택됨
                          </span>
                        </div>

                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-950 to-slate-900 border border-amber-500/40 flex items-center justify-center text-4xl sm:text-5xl shadow-lg relative">
                          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-spin-slow pointer-events-none" />
                          {selectedCard.symbol_emoji}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-extrabold text-slate-100">
                            {selectedCard.name_kr}
                          </h3>
                          <p className="text-xs text-indigo-300/80 font-mono uppercase">
                            {selectedCard.name_en}
                          </p>
                          <p className="text-xs text-amber-200/90 italic font-medium mt-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-indigo-900/50 leading-relaxed">
                            "{selectedCard.core_line}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Full-Width Workspace: Diary Editor & Feedback Card */}
            <div className="w-full space-y-8">
              <DiaryEditor
                diaryContent={diaryContent}
                setDiaryContent={setDiaryContent}
                onSubmit={handleAnalyzeDiary}
                isLoading={isLoading}
                selectedArcanaName={selectedCard?.name_kr}
                selectedMood={selectedMood}
                setSelectedMood={setSelectedMood}
              />

              {/* Error Banner */}
              {error && (
                <div className="bg-rose-950/90 border border-rose-800/80 rounded-2xl p-5 flex items-center justify-between gap-4 text-rose-200 text-sm sm:text-base animate-shake shadow-xl">
                  <div className="flex items-start gap-3.5">
                    <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-rose-300 mb-1 text-base">오류가 발생했습니다</span>
                      <span>{error}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Result Card */}
              {feedbackResponse && selectedCard && (
                <FeedbackCard
                  feedback={feedbackResponse}
                  arcana={selectedCard}
                  diaryContent={diaryContent}
                  analyzedAt={lastApiResponse?.analyzedAt || new Date().toISOString()}
                  selectedMood={selectedMood}
                  onSaveToHistory={handleSaveToHistory}
                  isSaved={isSavedToHistory}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ARCANA CATALOG */}
        {activeTab === 'cards' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-amber-300" />
                  22 메이저 아르카나 도감 (Major Arcana Catalog)
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  각 아르카나 카드가 품고 있는 고유한 코어 가치와 긍정/부정적 발현의 관점을 살펴보세요.
                </p>
              </div>

              <span className="text-sm font-mono font-bold px-3.5 py-1.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300">
                총 22종 완비 (maj_00 ~ maj_21)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MAJOR_ARCANA_CARDS.map((card) => (
                <div key={card.id} className="space-y-2.5">
                  <ArcanaCardDisplay
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                    onSelect={() => {
                      setSelectedCard(card);
                      setActiveTab('write');
                    }}
                    showDetails={true}
                  />
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      setActiveTab('write');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950 text-indigo-200 border border-slate-800 hover:border-indigo-500/50 text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>이 카드로 일기 쓰기</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: JOURNAL HISTORY */}
        {activeTab === 'history' && (
          <div className="animate-fadeIn">
            <JournalHistory
              entries={historyEntries}
              onDeleteEntry={handleDeleteHistoryEntry}
              onClearAll={handleClearHistory}
              onSelectEntry={handleSelectHistoryEntry}
              onImportEntries={handleImportHistoryEntries}
              onOpenSettings={() => setIsJournalSettingsOpen(true)}
            />
          </div>
        )}
      </main>

      {/* 22 Arcana Catalog Modal */}
      <ArcanaCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        selectedCard={selectedCard}
        onSelectCard={(card) => {
          setSelectedCard(card);
          setFeedbackResponse(null);
        }}
      />

      {/* Global Journal Settings Modal */}
      <JournalSettingsModal
        isOpen={isJournalSettingsOpen}
        onClose={() => setIsJournalSettingsOpen(false)}
        isSessionLocked={isSessionLocked}
        lockConfig={lockConfig}
        onSaveLockConfig={handleSaveLockConfig}
        onUnlockSession={handleUnlockSession}
        onExportBackup={handleExportBackup}
        onTriggerImportFile={() => {
          setIsJournalSettingsOpen(false);
          globalFileInputRef.current?.click();
        }}
        onClearAll={() => {
          setIsJournalSettingsOpen(false);
          handleClearHistory();
        }}
        entriesCount={historyEntries.length}
      />

      {/* Hidden File Input for Backup Import */}
      <input
        type="file"
        ref={globalFileInputRef}
        accept=".arcana,.json"
        onChange={handleGlobalFileChange}
        className="hidden"
      />

      {/* Admin Protected Settings Modal */}
      <AdminSettingsModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        diaryContent={diaryContent}
        selectedCard={selectedCard}
        lastApiResponse={lastApiResponse}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 px-4 text-center text-sm text-slate-300 font-light space-y-2.5">
        <p className="font-medium">Arcana Diary — 오늘의 나를 바라보는 치유와 성찰의 생성형 AI 저널링 엔진</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span>Copyright © ReLUmind. All Rights Reserved.</span>
          <span>&bull;</span>
          <span>Powered by Google Gemini 3.6 Flash &bull; Express + React Engine</span>
          <span>&bull;</span>
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold text-slate-400"
            title="관리자 접근 설정"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400 transition-colors" />
            <span>관리자 설정</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
