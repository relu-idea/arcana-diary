export interface ArcanaCard {
  id: string; // "maj_00" ~ "maj_21"
  number: number; // 0 ~ 21
  roman: string; // "0", "I", "II", ... "XXI"
  name_kr: string; // "바보", "여사제", ...
  name_en: string; // "The Fool", "The High Priestess", ...
  core_line: string; // 해석의 중심을 관통하는 핵심 문장
  keywords_positive: string; // 내면/환경의 긍정 키워드
  keywords_negative: string; // 내면/환경의 부정 키워드
  interpretation_positive: string; // 긍정 관점의 기본 해석 문장
  interpretation_negative: string; // 부정 관점의 기본 해석 문장
  symbol_emoji: string;
  element: string; // "air", "water", "fire", "earth"
  card_color: string;
}

export interface DiaryPayload {
  diary_content: string;
  selected_arcana: {
    id: string;
    name_kr: string;
    core_line: string;
    keywords_positive: string;
    keywords_negative: string;
    interpretation_positive: string;
    interpretation_negative: string;
  };
}

export interface ApiResponse {
  success: boolean;
  feedback: string;
  arcana: ArcanaCard | DiaryPayload['selected_arcana'];
  analyzedAt: string;
  error?: string;
  details?: string;
}

export interface SavedJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  diary_content: string;
  selected_arcana: ArcanaCard;
  feedback: string;
  mood?: string;
}

export interface MoodOption {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  stampBg: string;
  stampBorder: string;
  stampText: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'hopeful',
    label: '희망/도전',
    shortLabel: '희망',
    emoji: '🌱',
    stampBg: 'bg-emerald-950/90',
    stampBorder: 'border-emerald-500/80',
    stampText: 'text-emerald-300',
  },
  {
    id: 'grateful',
    label: '감사/뿌듯함',
    shortLabel: '감사',
    emoji: '☀️',
    stampBg: 'bg-amber-950/90',
    stampBorder: 'border-amber-500/80',
    stampText: 'text-amber-300',
  },
  {
    id: 'reflective',
    label: '성찰/고요함',
    shortLabel: '성찰',
    emoji: '🕯️',
    stampBg: 'bg-indigo-950/90',
    stampBorder: 'border-indigo-500/80',
    stampText: 'text-indigo-300',
  },
  {
    id: 'exhausted',
    label: '지침/무력함',
    shortLabel: '지침',
    emoji: '🌧️',
    stampBg: 'bg-sky-950/90',
    stampBorder: 'border-sky-500/80',
    stampText: 'text-sky-300',
  },
  {
    id: 'anxious',
    label: '불안/두려움',
    shortLabel: '불안',
    emoji: '😰',
    stampBg: 'bg-rose-950/90',
    stampBorder: 'border-rose-500/80',
    stampText: 'text-rose-300',
  },
];

export const getMoodOption = (moodKey?: string): MoodOption => {
  if (!moodKey) return MOOD_OPTIONS[0];
  const found = MOOD_OPTIONS.find(
    (m) => m.id === moodKey || m.label === moodKey || m.shortLabel === moodKey
  );
  return found || MOOD_OPTIONS[0];
};

export interface JournalLockConfig {
  enabled: boolean;
  password?: string;
  email?: string;
}
