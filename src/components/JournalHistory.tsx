import React, { useState, useRef, useEffect } from 'react';
import { SavedJournalEntry, getMoodOption, JournalLockConfig } from '../types';
import {
  History,
  Trash2,
  Calendar,
  BookOpen,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  X,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Settings,
} from 'lucide-react';
import { exportEncryptedBackup, importEncryptedBackup } from '../utils/crypto';
import { JournalSettingsModal } from './JournalSettingsModal';

interface JournalHistoryProps {
  entries: SavedJournalEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onSelectEntry: (entry: SavedJournalEntry) => void;
  onImportEntries: (importedEntries: SavedJournalEntry[], mode: 'merge' | 'overwrite') => void;
  onOpenSettings?: () => void;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  entries,
  onDeleteEntry,
  onClearAll,
  onSelectEntry,
  onImportEntries,
  onOpenSettings,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Lock Config & Session Unlock state
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

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Inline unlock password
  const [inlineUnlockPassword, setInlineUnlockPassword] = useState('');
  const [inlineUnlockError, setInlineUnlockError] = useState('');

  // Backup file import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportEntries, setPendingImportEntries] = useState<SavedJournalEntry[] | null>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<{ dateStr: string; entries: SavedJournalEntry[] } | null>(null);

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
      setInlineUnlockError('');
      setInlineUnlockPassword('');
      return true;
    }
    return false;
  };

  // Handle Encrypted Backup Export
  const handleExportBackup = async () => {
    if (entries.length === 0) {
      alert('백업할 일기 기록이 없습니다.');
      return;
    }

    try {
      const encryptedData = await exportEncryptedBackup(entries);
      const blob = new Blob([encryptedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      const link = document.createElement('a');
      link.href = url;
      link.download = `Arcana_Journal_Backup_${dateStr}.arcana`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatusMessage({
        type: 'success',
        text: `총 ${entries.length}개의 저널이 AES-256 암호화 세이브파일(.arcana)로 성공적으로 백업되었습니다.`,
      });
    } catch (err: any) {
      setImportStatusMessage({
        type: 'error',
        text: `백업 생성 중 오류가 발생했습니다: ${err.message}`,
      });
    }
  };

  // Handle File Selection for Encrypted Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const decrypted = await importEncryptedBackup(text);

      if (!decrypted || decrypted.length === 0) {
        throw new Error('백업 파일 내에 유효한 저널 데이터가 존재하지 않습니다.');
      }

      setPendingImportEntries(decrypted as SavedJournalEntry[]);
      setImportStatusMessage(null);
    } catch (err: any) {
      setImportStatusMessage({
        type: 'error',
        text: err.message || '파일 불러오기에 실패했습니다. 올바른 아르카나 암호화 백업 파일인지 확인해주세요.',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Execute Import confirmation
  const handleConfirmImport = (mode: 'merge' | 'overwrite') => {
    if (!pendingImportEntries) return;

    onImportEntries(pendingImportEntries, mode);
    setImportStatusMessage({
      type: 'success',
      text: `${pendingImportEntries.length}개의 저널을 성공적으로 ${mode === 'merge' ? '병합' : '복원'}하였습니다.`,
    });
    setPendingImportEntries(null);
  };

  // Helper to normalize date string to YYYY-MM-DD
  const parseDateToYYYYMMDD = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, '0');
      const d = match[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.diary_content.includes(searchQuery) ||
      e.selected_arcana.name_kr.includes(searchQuery) ||
      e.feedback.includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedEntries = filteredEntries.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Calendar calculation helpers
  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth(); // 0-indexed

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0: Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentCalendarDate(new Date());
  };

  // Map entries by date key "YYYY-MM-DD"
  const entriesByDateMap = React.useMemo(() => {
    const map: Record<string, SavedJournalEntry[]> = {};
    entries.forEach((entry) => {
      const dateKey = parseDateToYYYYMMDD(entry.date);
      if (dateKey) {
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(entry);
      }
    });
    return map;
  }, [entries]);

  // Auto switch calendar month to latest entry when calendar view opens and current month has no entries
  React.useEffect(() => {
    if (viewMode === 'calendar' && entries.length > 0) {
      const latestEntryDate = parseDateToYYYYMMDD(entries[0].date);
      if (latestEntryDate) {
        const [y, m] = latestEntryDate.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) {
          const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
          const hasEntriesInCurrentMonth = Object.keys(entriesByDateMap).some(
            (k) => k.startsWith(currentMonthKey) && entriesByDateMap[k].length > 0
          );

          if (!hasEntriesInCurrentMonth) {
            setCurrentCalendarDate(new Date(y, m - 1, 1));
          }
        }
      }
    }
  }, [viewMode, entries]);

  // Helper to render individual journal entry card (reused in both list view and modal)
  const renderEntryCard = (entry: SavedJournalEntry) => {
    const moodInfo = getMoodOption(entry.mood);
    return (
      <div
        key={entry.id}
        className="bg-slate-950/90 rounded-2xl p-6 sm:p-7 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-5 group relative shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3.5 gap-2 min-h-[44px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date */}
            <span className="text-base sm:text-lg font-extrabold text-slate-200 font-mono flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              {entry.date}
            </span>

            {/* Mood Stamp Badge - Enlarged */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-dashed ${moodInfo.stampBg} ${moodInfo.stampBorder} ${moodInfo.stampText} text-xs sm:text-base font-black tracking-wider shadow-md transform -rotate-1 select-none`}
              title={`오늘의 감정: ${moodInfo.label}`}
            >
              <span className="text-base sm:text-xl">{moodInfo.emoji}</span>
              <span>{moodInfo.shortLabel}</span>
              <span className="text-[9px] sm:text-[10px] font-mono opacity-80 border-l border-current pl-1 ml-0.5">STAMP</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedDayEntries(null);
                onSelectEntry(entry);
              }}
              className="text-xs sm:text-sm text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 bg-indigo-950/80 px-3.5 py-1.5 rounded-xl border border-indigo-800/60 font-semibold transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>상세보기</span>
            </button>

            <button
              onClick={() => {
                onDeleteEntry(entry.id);
                // If in modal, update current selected day entries
                if (selectedDayEntries) {
                  const updated = selectedDayEntries.entries.filter(e => e.id !== entry.id);
                  if (updated.length === 0) {
                    setSelectedDayEntries(null);
                  } else {
                    setSelectedDayEntries({ ...selectedDayEntries, entries: updated });
                  }
                }
              }}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="기록 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diary snippet - soft text with 0.9 opacity for high legibility & distinction */}
        <div className="text-base sm:text-lg text-slate-300/90 opacity-90 italic bg-slate-900/70 p-4 rounded-xl border border-slate-800/70 leading-relaxed">
          "{entry.diary_content}"
        </div>

        {/* Feedback section - 1/5 : 4/5 Grid ratio layout with generous padding */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 bg-indigo-950/40 p-5 sm:p-6 rounded-2xl border border-indigo-900/50 items-center my-2">
          {/* Left 1/5 Column: Arcana Artwork Circle Token & Feedback Title */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-indigo-800/40 pb-4 md:pb-0 md:pr-4 flex flex-col items-center justify-center text-center space-y-5">
            {/* Arcana Circular Image / Emblem */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-400/40 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-black/60 group/symbol overflow-hidden my-1">
              {/* Inner Glowing Orbit Ring */}
              <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-spin-slow pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

              {/* Roman numeral overlay badge if available */}
              {entry.selected_arcana.roman && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-300/90 px-1.5 py-0.5 rounded-full bg-slate-950/80 border border-amber-500/30 leading-none z-10">
                  {entry.selected_arcana.roman}
                </span>
              )}

              <span className="transform transition-transform duration-300 group-hover/symbol:scale-110 drop-shadow-md z-0 mt-1">
                {entry.selected_arcana.symbol_emoji}
              </span>
            </div>

            <span className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono leading-tight pt-2.5">
              [{entry.selected_arcana.roman || '0'}] [{entry.selected_arcana.name_kr}]
            </span>
          </div>

          {/* Right 4/5 Column: Feedback content */}
          <div className="md:col-span-4 text-sm sm:text-base text-amber-50/95 leading-relaxed sm:leading-loose font-serif pl-0 md:pl-2">
            {entry.feedback}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-amber-300" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            나의 아르카나 저널 보관소 ({entries.length}개)
          </h2>

          {/* View Mode Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-amber-300 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
            }`}
            title={viewMode === 'list' ? '월간 달력 보기로 전환' : '리스트 보기로 전환'}
          >
            {viewMode === 'list' ? (
              <>
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">달력 보기</span>
              </>
            ) : (
              <>
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">목록 보기</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Items per page selector (List view only, unlocked) */}
          {viewMode === 'list' && !isSessionLocked && (
            <div className="flex items-center gap-1.5">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 text-slate-300 text-xs rounded-xl border border-slate-700/80 px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value={1} className="bg-slate-900 text-slate-100">1개씩 보기</option>
                <option value={3} className="bg-slate-900 text-slate-100">3개씩 보기</option>
                <option value={5} className="bg-slate-900 text-slate-100">5개씩 보기</option>
              </select>
            </div>
          )}

          {entries.length > 0 && !isSessionLocked && (
            <button
              onClick={() => {
                if (confirm('모든 기록을 삭제하시겠습니까?')) {
                  onClearAll();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors font-medium bg-rose-950/30 px-2.5 py-1.5 rounded-xl border border-rose-900/40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">전체 삭제</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept=".arcana,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Backup Status Alert Notification */}
      {importStatusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-fade-in ${
            importStatusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {importStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold block mb-0.5">
                {importStatusMessage.type === 'success' ? '보안 백업 처리 완료' : '세이브파일 검증 및 복호화 실패'}
              </span>
              {importStatusMessage.text}
            </div>
          </div>
          <button
            onClick={() => setImportStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SESSION LOCKED SCREEN */}
      {isSessionLocked ? (
        <div className="py-12 px-4 text-center bg-slate-950/80 rounded-2xl border border-amber-500/30 max-w-md mx-auto space-y-5 my-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-100">기록장이 잠겨 있습니다</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              설정된 암호를 입력하여 잠금을 해제해주세요.<br />
              브라우저를 끄면 세션이 닫혀 자동으로 다시 잠깁니다.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!handleUnlockSession(inlineUnlockPassword)) {
                setInlineUnlockError('암호가 올바르지 않습니다.');
              }
            }}
            className="space-y-3 pt-2"
          >
            <div className="relative">
              <input
                type="password"
                value={inlineUnlockPassword}
                onChange={(e) => setInlineUnlockPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-4 py-2.5 text-sm text-center font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            {inlineUnlockError && <p className="text-xs text-rose-400 font-medium">{inlineUnlockError}</p>}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                잠금 해제
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenSettings) {
                    onOpenSettings();
                  } else {
                    setIsSettingsOpen(true);
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                title="복구 및 설정 열기"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>설정 / 복구</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <React.Fragment>


          {/* Search Input */}
          {entries.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="저널 내용, 아르카나 카드명, 피드백 검색..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}

          {/* Entry List */}
          {entries.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 text-base font-light">
                아직 보관된 저널 기록이 없습니다.
              </p>
              <p className="text-xs sm:text-sm text-slate-400">
                오늘 일기를 작성하고 아르카나 카드의 따뜻한 피드백을 보관함에 담아보세요.
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <p className="py-8 text-center text-xs sm:text-sm text-slate-400">
              검색어와 일치하는 기록이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {paginatedEntries.map((entry) => renderEntryCard(entry))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredEntries.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                총 {filteredEntries.length}개 중 {(validCurrentPage - 1) * itemsPerPage + 1}-
                {Math.min(validCurrentPage * itemsPerPage, filteredEntries.length)}개 표시 중
              </p>

              <div className="flex items-center gap-2 mx-auto sm:mx-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="이전 페이지"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        validCurrentPage === pageNum
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="다음 페이지"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

      {/* VIEW MODE 2: MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Controls / Month Navigation */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30 transition-colors cursor-pointer"
                title="이전 달"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h3 className="text-lg sm:text-xl font-black text-amber-300 font-mono tracking-wide">
                {currentYear}년 {currentMonth + 1}월
              </h3>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30 transition-colors cursor-pointer"
                title="다음 달"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="text-xs sm:text-sm font-semibold bg-indigo-950/80 text-amber-300 px-3.5 py-2 rounded-xl border border-indigo-800/60 hover:bg-indigo-900/80 transition-colors cursor-pointer"
            >
              오늘로 이동
            </button>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-3 sm:p-5 overflow-x-auto">
            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-bold font-mono min-w-[320px]">
              <div className="text-rose-400 py-1">일</div>
              <div className="text-slate-400 py-1">월</div>
              <div className="text-slate-400 py-1">화</div>
              <div className="text-slate-400 py-1">수</div>
              <div className="text-slate-400 py-1">목</div>
              <div className="text-slate-400 py-1">금</div>
              <div className="text-sky-400 py-1">토</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 min-w-[320px]">
              {/* Blank cells before month start */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[100px] sm:min-h-[120px] rounded-xl bg-slate-950/40 border border-slate-900/60 opacity-30"
                />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                const dayString = String(dayNum).padStart(2, '0');
                const monthString = String(currentMonth + 1).padStart(2, '0');
                const dateKey = `${currentYear}-${monthString}-${dayString}`;

                const dayEntries = entriesByDateMap[dateKey] || [];
                const hasEntries = dayEntries.length > 0;
                const lastEntry = hasEntries ? dayEntries[dayEntries.length - 1] : null;

                const isToday =
                  new Date().getFullYear() === currentYear &&
                  new Date().getMonth() === currentMonth &&
                  new Date().getDate() === dayNum;

                const dayOfWeekIndex = new Date(currentYear, currentMonth, dayNum).getDay();
                const isSunday = dayOfWeekIndex === 0;
                const isSaturday = dayOfWeekIndex === 6;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (hasEntries) {
                        setSelectedDayEntries({ dateStr: dateKey, entries: dayEntries });
                      }
                    }}
                    className={`min-h-[110px] sm:min-h-[140px] rounded-xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between relative group ${
                      hasEntries
                        ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer'
                        : 'bg-slate-950/60 border-slate-900/80'
                    } ${isToday ? 'ring-2 ring-amber-400/80 ring-offset-1 ring-offset-slate-950' : ''}`}
                  >
                    {/* Absolute Layered Top Controls: Date Number (Top-Left) & (+N) Badge (Top-Right) */}
                    <span
                      className={`absolute top-1.5 left-1.5 z-20 text-xs font-mono font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-sm ${
                        isToday
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : isSunday
                          ? 'text-rose-400 bg-slate-950/80 border border-rose-900/40'
                          : isSaturday
                          ? 'text-sky-400 bg-slate-950/80 border border-sky-900/40'
                          : 'text-slate-300 bg-slate-950/80 border border-slate-800/80'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Multiple entries badge e.g. (+2) */}
                    {dayEntries.length > 1 && (
                      <span className="absolute top-1.5 right-1.5 z-20 text-[10px] font-mono font-black text-amber-300 bg-amber-950/95 px-1.5 py-0.5 rounded-full border border-amber-500/60 shadow-lg backdrop-blur-md">
                        +{dayEntries.length - 1}
                      </span>
                    )}

                    {/* Center & Bottom: Maximized Arcana Symbol Token */}
                    {hasEntries && lastEntry && (
                      <div className="flex flex-col items-center justify-center my-auto w-full pt-6 pb-1 space-y-1 relative z-10">
                        {/* Circle Emblem - Maximized Token */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-400/60 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl shadow-black/70 group-hover:scale-110 transition-all duration-300 relative overflow-hidden my-0.5">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
                          <span className="drop-shadow-lg transform transition-transform duration-300 group-hover:scale-105">
                            {lastEntry.selected_arcana.symbol_emoji}
                          </span>
                        </div>

                        {/* Bottom: Card Number & Korean Name e.g. "0. 바보" or "20. 심판" */}
                        <span className="text-[11px] sm:text-xs font-extrabold text-amber-200 font-mono tracking-tight truncate max-w-[98%] text-center leading-none pt-1">
                          {lastEntry.selected_arcana.number !== undefined ? lastEntry.selected_arcana.number : lastEntry.selected_arcana.roman || '0'}. {lastEntry.selected_arcana.name_kr}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
        </React.Fragment>
      )}




      {/* DAY JOURNAL MODAL (When clicking a day on Calendar view) */}
      {selectedDayEntries && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedDayEntries(null)}
        >
          <div
            className="bg-slate-900/95 border border-indigo-900/60 rounded-3xl p-6 sm:p-8 max-w-7xl w-full max-h-[88vh] overflow-y-auto space-y-6 shadow-2xl relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 pt-1">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-100 font-mono">
                  {selectedDayEntries.dateStr} 의 저널 기록 ({selectedDayEntries.entries.length}개)
                </h3>
              </div>

              <button
                onClick={() => setSelectedDayEntries(null)}
                className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Entries Content (Same card UI as List View) */}
            <div className="space-y-5">
              {selectedDayEntries.entries.map((entry) => renderEntryCard(entry))}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CONFIRMATION MODAL */}
      {pendingImportEntries && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setPendingImportEntries(null)}
        >
          <div
            className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative my-auto text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">
                  암호화 세이브파일 검증 완료
                </h3>
              </div>
              <button
                onClick={() => setPendingImportEntries(null)}
                className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-2">
                <p className="text-xs sm:text-sm text-emerald-200 font-medium leading-relaxed">
                  정식 아르카나 암호화 백업 데이터 검증에 성공했습니다.
                </p>
                <div className="text-xs font-mono text-emerald-400/90 flex items-center justify-between border-t border-emerald-900/60 pt-2">
                  <span>불러올 저널 개수:</span>
                  <span className="font-bold text-sm text-emerald-300">{pendingImportEntries.length}개</span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 space-y-1">
                <p className="font-semibold text-slate-200">복원 방식을 선택해주세요:</p>
                <p className="text-slate-400 text-xs">
                  &bull; <strong className="text-emerald-300">병합(추가):</strong> 기존 저널을 유지하면서 새로 가져온 저널을 합칩니다.
                  <br />
                  &bull; <strong className="text-amber-300">덮어쓰기:</strong> 기존 저널을 지우고 백업 파일의 저널로 교체합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleConfirmImport('merge')}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>기존 기록에 병합</span>
              </button>

              <button
                onClick={() => handleConfirmImport('overwrite')}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-amber-950/60 text-amber-300 border border-slate-700 hover:border-amber-500/50 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>기존 기록 덮어쓰기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOURNAL SETTINGS MODAL */}
      <JournalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSessionLocked={isSessionLocked}
        lockConfig={lockConfig}
        onSaveLockConfig={handleSaveLockConfig}
        onUnlockSession={handleUnlockSession}
        onExportBackup={handleExportBackup}
        onTriggerImportFile={() => {
          setIsSettingsOpen(false);
          fileInputRef.current?.click();
        }}
        onClearAll={() => {
          setIsSettingsOpen(false);
          onClearAll();
        }}
        entriesCount={entries.length}
      />
    </div>
  );
};


