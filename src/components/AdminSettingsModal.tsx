import React, { useState, useEffect } from 'react';
import { ArcanaCard } from '../types';
import { X, Lock, ShieldCheck, Mail, KeyRound, Terminal, Cpu, Code2, Copy, Check, AlertTriangle, LogOut, Clock, Loader2, Send } from 'lucide-react';
import { getEmailJSConfig, setEmailJSConfig, getEmailUsageInfo, EmailJSConfig } from '../utils/emailService';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaryContent: string;
  selectedCard: ArcanaCard | null;
  lastApiResponse: any | null;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  diaryContent,
  selectedCard,
  lastApiResponse,
}) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('arcana_admin_auth') === 'true';
  });
  
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0); // Seconds remaining
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'prompt' | 'emailjs'>('request');
  const [copied, setCopied] = useState<boolean>(false);

  // EmailJS Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailJSConfig>(() => getEmailJSConfig());
  const [emailConfigSaveMsg, setEmailConfigSaveMsg] = useState<string | null>(null);
  const [emailUsage, setEmailUsage] = useState(() => getEmailUsageInfo());

  // Refresh config on open
  useEffect(() => {
    if (isOpen) {
      setEmailConfig(getEmailJSConfig());
      setEmailUsage(getEmailUsageInfo());
    }
  }, [isOpen]);

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailJSConfig(emailConfig);
    setEmailConfigSaveMsg('EmailJS 설정 정보가 저장되었습니다.');
    setTimeout(() => setEmailConfigSaveMsg(null), 3000);
  };

  // Timer interval for 3-minute countdown
  useEffect(() => {
    let timer: any = null;
    if (isCodeSent && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isCodeSent) {
      setAuthError('인증 시간이 만료되었습니다(3분 초과). 인증 이메일을 다시 발송해주세요.');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCodeSent, timeLeft]);

  if (!isOpen) return null;

  // Step 1: Send Verification Email
  const handleSendEmail = async () => {
    setIsSending(true);
    setAuthError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/admin/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '인증 이메일 발송에 실패했습니다.');
      }

      setIsCodeSent(true);
      setTimeLeft(180); // 3 minutes
      setInfoMessage(data.message || '인증 이메일이 발송되었습니다. (3분 이내 입력)');
      if (data.demoCode) {
        setDemoCodeHint(data.demoCode);
      }
    } catch (err: any) {
      setAuthError(err.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (timeLeft <= 0) {
      setAuthError('인증 시간이 만료되었습니다. 인증 이메일을 다시 발송해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '인증번호가 일치하지 않습니다.');
      }

      setIsAdminAuthenticated(true);
      localStorage.setItem('arcana_admin_auth', 'true');
    } catch (err: any) {
      setAuthError(err.message || '인증 확인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('arcana_admin_auth');
    setIsCodeSent(false);
    setVerificationCode('');
    setTimeLeft(0);
    setInfoMessage(null);
    setAuthError(null);
    setDemoCodeHint(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const requestPayload = {
    diary_content: diaryContent || "유저 일기 텍스트...",
    selected_arcana: selectedCard ? {
      id: selectedCard.id,
      name_kr: selectedCard.name_kr,
      core_line: selectedCard.core_line,
      keywords_positive: selectedCard.keywords_positive,
      keywords_negative: selectedCard.keywords_negative,
      interpretation_positive: selectedCard.interpretation_positive,
      interpretation_negative: selectedCard.interpretation_negative
    } : null
  };

  const systemPromptText = `
너는 사용자의 하루를 기록한 일기를 분석하고, 지정된 타로 메이저 아르카나 카드의 고유한 성격과 시선으로 따뜻하고 통찰력 있는 피드백을 제공하는 'Arcana Diary'의 생성형 AI 저널링 엔진이다.
이 서비스는 미래를 점치는 '타로 점'이 아니라, '오늘의 나를 특정 아르카나의 시선으로 바라보는 치유와 성찰의 저널링 서비스'이다. 유저를 다정하게 보듬어주는 초등학교 담임선생님 같은 따뜻함과, 삶을 꿰뚫어 보는 타로 카드의 깊은 지혜를 동시에 갖춘 어투를 유지하라.

# 기본 출력 규칙 (Output Constraints)
1. 글자 수 및 문장 제한: 반드시 3~5문장 이내로 명확하고 군더더기 없이 작성하라.
2. 톤앤매너: 공감과 위로를 바탕으로 하되, 카드가 가진 코어 가치를 깨달을 수 있는 조언을 포함하라.
3. 금지 사항: 전문적인 의학적/정신과적 진단이나 조언을 절대 하지 말 것.

# AI 분석 및 생성 시퀀스 (Logical Scaffolding)
1. 문맥 및 감정 파악: 유저의 diary_content에서 오늘의 핵심 사건과 느껴지는 감정 상태를 파악한다.
2. 아르카나 렌즈 매핑: 선택된 카드의 코어 지혜와 키워드를 대조하여, 유저의 현재 상황이 카드의 긍정/부정적 발현 중 어디에 가까운지 진단한다.
3. 메시지 융합: 진단 결과를 바탕으로, 해당 카드가 유저에게 건네는 페르소나 독백 형태로 답변을 생성한다.
`;

  const getCopyText = () => {
    if (activeTab === 'request') return JSON.stringify(requestPayload, null, 2);
    if (activeTab === 'response') return JSON.stringify(lastApiResponse || { message: "API 호출 내역 없음" }, null, 2);
    return systemPromptText;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-extrabold text-slate-100">
              Arcana Diary 관리자 보안 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Locked View - Requires Email Code Authentication */}
        {!isAdminAuthenticated ? (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-100">
                관리자 2단계 이메일 인증
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                관리자 승인 이메일로 발송되는 6자리 보안 인증번호를 입력하여 접근할 수 있습니다.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-5">
              {/* Step 1: Send Verification Email Button */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">관리자 인증 이메일 요청</span>
                </div>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>발송 중...</span>
                    </>
                  ) : (
                    <>
                      <span>{isCodeSent ? '이메일 재발송' : '인증 이메일 발송'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status / Success Banner */}
              {infoMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{infoMessage}</span>
                  </span>
                  {timeLeft > 0 && (
                    <span className="font-mono font-bold text-amber-300 flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {formatTime(timeLeft)}
                    </span>
                  )}
                </div>
              )}

              {/* Demo / Test Hint Banner if present */}
              {demoCodeHint && isCodeSent && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300/90 text-[11px] flex items-center justify-between font-mono">
                  <span>[시뮬레이션 발송번호]</span>
                  <span className="font-bold text-amber-200 tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-amber-500/30">
                    {demoCodeHint}
                  </span>
                </div>
              )}

              {/* Step 2: Verification Code Input Form */}
              {isCodeSent && (
                <form onSubmit={handleVerifyCode} className="space-y-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>6자리 인증번호</span>
                      </label>
                      <span className="text-[11px] text-amber-400 font-mono">
                        3분 제한시간 ({formatTime(timeLeft)})
                      </span>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6자리 인증번호 입력..."
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={timeLeft <= 0}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center tracking-widest text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                      required
                    />
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={timeLeft <= 0 || !verificationCode.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-950/40 disabled:opacity-50"
                  >
                    확인
                  </button>
                </form>
              )}

              {!isCodeSent && authError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Authenticated Admin View */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/50">
                  <Check className="w-3 h-3" /> 관리자 인증 완료
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-300 flex items-center gap-1 text-[11px] transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>로그아웃</span>
              </button>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-slate-950/40 text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('request')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'request'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Payload Structure</span>
                </button>

                <button
                  onClick={() => setActiveTab('response')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'response'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>API Response Log</span>
                </button>

                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'prompt'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>System Prompt</span>
                </button>

                <button
                  onClick={() => setActiveTab('emailjs')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'emailjs'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>EmailJS 설정</span>
                </button>
              </div>

              {activeTab !== 'emailjs' && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              )}
            </div>

            {/* Code / Content Body */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-emerald-300 bg-slate-950 leading-relaxed">
              {activeTab === 'request' && (
                <pre className="whitespace-pre-wrap">{JSON.stringify(requestPayload, null, 2)}</pre>
              )}

              {activeTab === 'response' && (
                <pre className="whitespace-pre-wrap">
                  {lastApiResponse
                    ? JSON.stringify(lastApiResponse, null, 2)
                    : '// 최근 실행된 API 응답 로그가 없습니다.'}
                </pre>
              )}

              {activeTab === 'prompt' && (
                <div className="text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {systemPromptText}
                </div>
              )}

              {activeTab === 'emailjs' && (
                <div className="font-sans text-slate-200 space-y-5">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                      <Mail className="w-4 h-4" />
                      EmailJS 연동 및 한도 현황
                    </h5>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      무료 템플릿 서비스 EmailJS 키(Service ID, Template ID, Public Key)를 등록하면 사용자의 비밀번호 복구 및 관리자 이메일 발송이 실제 전송됩니다.
                    </p>
                    <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-amber-300 flex items-center justify-between">
                      <span>이번 달 이메일 발송량:</span>
                      <span className="font-bold">{emailUsage.count} / {emailUsage.max}건 (월 기준)</span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveEmailConfig} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Service ID</label>
                      <input
                        type="text"
                        value={emailConfig.serviceId}
                        onChange={(e) => setEmailConfig({ ...emailConfig, serviceId: e.target.value })}
                        placeholder="service_xxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Template ID</label>
                      <input
                        type="text"
                        value={emailConfig.templateId}
                        onChange={(e) => setEmailConfig({ ...emailConfig, templateId: e.target.value })}
                        placeholder="template_xxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Public Key (User ID)</label>
                      <input
                        type="text"
                        value={emailConfig.publicKey}
                        onChange={(e) => setEmailConfig({ ...emailConfig, publicKey: e.target.value })}
                        placeholder="user_xxxxx / public_key"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {emailConfigSaveMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{emailConfigSaveMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>EmailJS 설정 저장</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-[10px] text-slate-500 text-center font-mono">
          Arcana Diary Admin Core &bull; Restricted Profile Access
        </div>
      </div>
    </div>
  );
};
