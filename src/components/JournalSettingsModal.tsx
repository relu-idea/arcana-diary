import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Lock,
  Unlock,
  Download,
  Upload,
  KeyRound,
  Trash2,
  AlertTriangle,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { JournalLockConfig } from '../types';
import { sendRecoveryEmail, getEmailUsageInfo } from '../utils/emailService';

interface JournalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSessionLocked: boolean; // True if locked by password
  lockConfig: JournalLockConfig | null;
  onSaveLockConfig: (config: JournalLockConfig | null) => void;
  onUnlockSession: (password: string) => boolean;
  onExportBackup: () => void;
  onTriggerImportFile: () => void;
  onClearAll: () => void;
  entriesCount: number;
}

export const JournalSettingsModal: React.FC<JournalSettingsModalProps> = ({
  isOpen,
  onClose,
  isSessionLocked,
  lockConfig,
  onSaveLockConfig,
  onUnlockSession,
  onExportBackup,
  onTriggerImportFile,
  onClearAll,
  entriesCount,
}) => {
  if (!isOpen) return null;

  // Session unlock input
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockErrorMsg, setUnlockErrorMsg] = useState('');

  // Lock Config form states
  const [lockEnabled, setLockEnabled] = useState<boolean>(!!lockConfig?.enabled);
  const [isEditingLock, setIsEditingLock] = useState<boolean>(!lockConfig?.enabled);
  const [password, setPassword] = useState<string>(lockConfig?.password || '');
  const [confirmPassword, setConfirmPassword] = useState<string>(lockConfig?.password || '');
  const [email, setEmail] = useState<string>(lockConfig?.email || '');
  const [lockSaveMessage, setLockSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / prompt state for verifying password before turning off lock
  const [showDisablePrompt, setShowDisablePrompt] = useState<boolean>(false);
  const [disablePasswordInput, setDisablePasswordInput] = useState<string>('');
  const [disablePasswordError, setDisablePasswordError] = useState<string>('');

  // Reset verification prompt state (when journal lock is enabled)
  const [showResetPrompt, setShowResetPrompt] = useState<boolean>(false);
  const [resetPasswordInput, setResetPasswordInput] = useState<string>('');
  const [resetEmailInput, setResetEmailInput] = useState<string>('');
  const [resetPromptError, setResetPromptError] = useState<string>('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');

  // Helper for masking email address
  const maskEmail = (emailStr: string): string => {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const [user, domain] = emailStr.split('@');
    if (user.length <= 2) {
      return `${user[0]}*@${domain}`;
    }
    const visibleStart = user.slice(0, 2);
    const maskedUser = visibleStart + '*'.repeat(Math.max(3, user.length - 2));
    return `${maskedUser}@${domain}`;
  };

  // Recovery - Password recovery form
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailUsage, setEmailUsage] = useState(() => getEmailUsageInfo());

  // Refresh email usage on modal open
  useEffect(() => {
    if (isOpen) {
      setEmailUsage(getEmailUsageInfo());
    }
  }, [isOpen]);

  // Sync state when lockConfig prop changes
  useEffect(() => {
    const isSaved = !!lockConfig?.enabled;
    setLockEnabled(isSaved);
    setIsEditingLock(!isSaved);
    setPassword(lockConfig?.password || '');
    setConfirmPassword(lockConfig?.password || '');
    setEmail(lockConfig?.email || '');
  }, [lockConfig]);

  // Handle Session Unlock inside settings modal
  const handleAttemptUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPasswordInput.trim()) {
      setUnlockErrorMsg('암호를 입력해주세요.');
      return;
    }

    const success = onUnlockSession(unlockPasswordInput);
    if (success) {
      setUnlockPasswordInput('');
      setUnlockErrorMsg('');
    } else {
      setUnlockErrorMsg('암호가 올바르지 않습니다.');
    }
  };

  // Handle Save Lock Settings
  const handleSaveLock = (e: React.FormEvent) => {
    e.preventDefault();
    setLockSaveMessage(null);

    if (lockEnabled) {
      if (!password || password.trim().length < 4) {
        setLockSaveMessage({
          type: 'error',
          text: '비밀번호는 최소 4자리 이상 입력해주세요.',
        });
        return;
      }
      if (password !== confirmPassword) {
        setLockSaveMessage({
          type: 'error',
          text: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        });
        return;
      }
      if (!email || !email.includes('@')) {
        setLockSaveMessage({
          type: 'error',
          text: '복구용 이메일 주소를 올바르게 입력해주세요.',
        });
        return;
      }

      onSaveLockConfig({
        enabled: true,
        password: password.trim(),
        email: email.trim(),
      });

      setIsEditingLock(false);
      setLockSaveMessage({
        type: 'success',
        text: '잠금 설정이 저장되었습니다.',
      });
    } else {
      // Disable Lock & reset form state
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setRecoveryEmail('');
      setRecoveryResult(null);
      setIsEditingLock(false);
      onSaveLockConfig(null);
      setLockSaveMessage({
        type: 'success',
        text: '잠금 기능이 해제되었습니다.',
      });
    }
  };

  // Handle Password Recovery check
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryResult(null);

    if (!lockConfig || !lockConfig.enabled) {
      setRecoveryResult({
        type: 'error',
        text: '현재 설정된 잠금이 없습니다.',
      });
      return;
    }

    if (!recoveryEmail.trim()) {
      setRecoveryResult({
        type: 'error',
        text: '이메일 주소를 입력해주세요.',
      });
      return;
    }

    if (recoveryEmail.trim().toLowerCase() !== lockConfig.email?.toLowerCase()) {
      setRecoveryResult({
        type: 'error',
        text: '등록된 이메일 주소와 일치하지 않습니다.',
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendRecoveryEmail(recoveryEmail.trim(), lockConfig.password);
      setEmailUsage(getEmailUsageInfo());
      if (res.success) {
        setRecoveryResult({
          type: 'success',
          text: res.message,
        });
      } else {
        setRecoveryResult({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err: any) {
      setRecoveryResult({
        type: 'error',
        text: '이메일 발송 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Clear All / Reset Journal Click
  const handleResetClick = () => {
    setResetPromptError('');
    setResetSuccessMsg('');
    if (lockConfig?.enabled) {
      setShowResetPrompt(true);
      setResetPasswordInput('');
      setResetEmailInput('');
    } else {
      if (window.confirm('정말 기록장의 모든 일기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        onClearAll();
        setResetSuccessMsg('기록장이 초기화되었습니다.');
      }
    }
  };

  // Execute Reset with password & email verification
  const handleExecuteResetWithAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setResetPromptError('');

    if (!resetPasswordInput) {
      setResetPromptError('비밀번호를 입력해주세요.');
      return;
    }
    if (!resetEmailInput) {
      setResetPromptError('등록된 이메일을 입력해주세요.');
      return;
    }

    const isPasswordMatch = resetPasswordInput === lockConfig?.password;
    const isEmailMatch = resetEmailInput.trim().toLowerCase() === lockConfig?.email?.toLowerCase();

    if (!isPasswordMatch || !isEmailMatch) {
      setResetPromptError('비밀번호 또는 이메일 정보가 일치하지 않습니다.');
      return;
    }

    onClearAll();
    setShowResetPrompt(false);
    setResetPasswordInput('');
    setResetEmailInput('');
    setResetPromptError('');
    setResetSuccessMsg('비밀번호 및 이메일 검증 완료: 기록장이 성공적으로 초기화되었습니다.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-start py-8 sm:py-12 px-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-[612px] w-full space-y-5 shadow-xl relative my-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-300" />
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              기록장 설정
              {isSessionLocked && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-normal flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-400" /> 잠김
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOCKED SESSION UNLOCK BOX */}
        {isSessionLocked && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                현재 세션이 잠겨 있습니다. 일반 기능(다운로드, 불러오기, 잠금 변경)을 이용하려면 암호를 입력하여 잠금을 해제해주세요.
              </div>
            </div>

            <form onSubmit={handleAttemptUnlock} className="flex gap-2">
              <input
                id="unlock-password-input"
                name="unlockPassword"
                type="password"
                autoComplete="current-password"
                value={unlockPasswordInput}
                onChange={(e) => setUnlockPasswordInput(e.target.value)}
                placeholder="암호 입력"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-100 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>해제</span>
              </button>
            </form>
            {unlockErrorMsg && <p className="text-xs text-rose-400">{unlockErrorMsg}</p>}
          </div>
        )}

        {/* SINGLE COLUMN SETTINGS MENU */}
        <div className="space-y-5 text-xs">
          {/* 1) 일기 다운로드 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-slate-400" />
                <span>1) 일기 다운로드</span>
              </div>
              <span className="text-[11px] text-slate-500">{entriesCount}개 저장됨</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              저장된 전체 일기를 암호화된 세이브 파일(.arcana)로 내보냅니다.
            </p>
            <button
              onClick={onExportBackup}
              disabled={isSessionLocked || !!lockConfig?.enabled || entriesCount === 0}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>일기 파일 내보내기</span>
            </button>
            {lockConfig?.enabled && (
              <p className="text-[11px] text-amber-400/90 font-medium">
                * 기록장 잠금이 설정되어 있어 일기 다운로드가 비활성화됩니다.
              </p>
            )}
          </div>

          {/* 2) 일기 불러오기 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>2) 일기 불러오기</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              다운로드한 .arcana 암호화 백업 파일을 읽어옵니다.
            </p>
            <button
              onClick={onTriggerImportFile}
              disabled={isSessionLocked || !!lockConfig?.enabled}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>파일 선택 및 불러오기</span>
            </button>
            {lockConfig?.enabled && (
              <p className="text-[11px] text-amber-400/90 font-medium">
                * 기록장 잠금이 설정되어 있어 일기 불러오기가 비활성화됩니다.
              </p>
            )}
          </div>

          {/* 3) 기록장 잠그기 ON/OFF */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>3) 기록장 잠그기</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isSessionLocked}
                  checked={lockEnabled}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    if (!isChecked && lockConfig?.enabled) {
                      // Require password to disable lock
                      setShowDisablePrompt(true);
                      setDisablePasswordInput('');
                      setDisablePasswordError('');
                      // Keep lockEnabled as true until password is validated
                      setLockEnabled(true);
                      return;
                    }

                    setLockEnabled(isChecked);
                    if (isChecked) {
                      if (!lockConfig?.enabled) {
                        setIsEditingLock(true);
                      }
                    } else {
                      setPassword('');
                      setConfirmPassword('');
                      setEmail('');
                      setRecoveryEmail('');
                      setRecoveryResult(null);
                      setIsEditingLock(false);
                      onSaveLockConfig(null);
                      setLockSaveMessage({
                        type: 'success',
                        text: '잠금 기능이 해제되었으며 설정 정보가 삭제되었습니다.',
                      });
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs text-slate-300 font-medium">
                  {lockEnabled ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>

            {/* Prompt for password to turn off lock */}
            {showDisablePrompt && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 space-y-2.5">
                <div className="text-xs text-rose-200 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>잠금 해제를 위해 현재 비밀번호를 입력해주세요.</span>
                </div>
                <div className="flex gap-2">
                  <input
                    id="disable-password-input"
                    name="disablePassword"
                    type="password"
                    autoComplete="current-password"
                    value={disablePasswordInput}
                    onChange={(e) => {
                      setDisablePasswordInput(e.target.value);
                      setDisablePasswordError('');
                    }}
                    placeholder="현재 비밀번호 입력"
                    className="flex-1 bg-slate-900 border border-rose-900/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!disablePasswordInput) {
                        setDisablePasswordError('비밀번호를 입력해주세요.');
                        return;
                      }
                      if (disablePasswordInput === lockConfig?.password) {
                        onSaveLockConfig(null);
                        setLockEnabled(false);
                        setShowDisablePrompt(false);
                        setPassword('');
                        setConfirmPassword('');
                        setEmail('');
                        setRecoveryEmail('');
                        setRecoveryResult(null);
                        setIsEditingLock(false);
                        setLockSaveMessage({
                          type: 'success',
                          text: '잠금 기능이 해제되었으며 설정 정보가 삭제되었습니다.',
                        });
                      } else {
                        setDisablePasswordError('비밀번호가 일치하지 않습니다.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisablePrompt(false);
                      setDisablePasswordInput('');
                      setDisablePasswordError('');
                      setLockEnabled(true);
                      setIsEditingLock(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                </div>
                {disablePasswordError && (
                  <p className="text-[11px] text-rose-400 font-medium">{disablePasswordError}</p>
                )}
              </div>
            )}

            <form
              onSubmit={handleSaveLock}
              className={`space-y-3 ${isSessionLocked ? 'opacity-40 pointer-events-none' : ''}`}
            >
              {lockEnabled ? (
                lockConfig?.enabled ? (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>기록장 잠금이 활성화되어 있습니다</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      등록 이메일: <span className="text-slate-200">{maskEmail(lockConfig.email)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Warning Messages */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px] space-y-1">
                      <p className="text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        잠금 설정 주의사항
                      </p>
                      <p>&bull; 일기장은 로컬에만 저장됩니다.</p>
                      <p>&bull; 암호 분실을 대비하여 암호안내/초기화를 위한 복구용 이메일을 작성해주세요.</p>
                      <p>&bull; 암호 설정 시, 브라우저를 끄면 세션이 초기화됩니다.</p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <label htmlFor="lock-password-input" className="text-[11px] text-slate-400 mb-0.5 block">암호 설정 (4자리 이상)</label>
                        <input
                          id="lock-password-input"
                          name="lockPassword"
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="암호 입력"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="confirm-password-input" className="text-[11px] text-slate-400 mb-0.5 block">암호 확인</label>
                        <input
                          id="confirm-password-input"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="암호 확인 재입력"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="lock-email-input" className="text-[11px] text-slate-400 mb-0.5 block flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>복구용 이메일</span>
                        </label>
                        <input
                          id="lock-email-input"
                          name="lockEmail"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="이메일 주소 입력"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSessionLocked}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-100 text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                    >
                      잠금 설정 저장
                    </button>
                  </>
                )
              ) : (
                <p className="text-slate-500 italic text-[11px]">
                  잠금 기능이 꺼져 있습니다. 소중한 일기를 보호하려면 ON으로 변경하세요.
                </p>
              )}

              {lockSaveMessage && (
                <div
                  className={`p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                    lockSaveMessage.type === 'success'
                      ? 'bg-slate-900 text-emerald-400 border border-emerald-900/50'
                      : 'bg-slate-900 text-rose-400 border border-rose-900/50'
                  }`}
                >
                  {lockSaveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span>{lockSaveMessage.text}</span>
                </div>
              )}
            </form>
          </div>

          {/* 4) 복구하기 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>4) 복구하기</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                잠금 상태 가능
              </span>
            </div>

            {/* 4-1) 암호받기 */}
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <div className="text-slate-300 text-[11px] space-y-1 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <p>&bull; 기록장 잠그기가 설정된 경우, 등록한 이메일 주소를 입력하면 비밀번호를 안내해 드립니다.</p>
                <p>&bull; 받은 편지함으로 메일이 도착하지 않을 경우, 스팸메일함으로 분류되었는지 확인해주세요.</p>
                <p className="text-amber-300 font-medium pt-0.5">
                  &bull; 이메일 전송 가능횟수 : <span className="font-mono text-amber-200">{emailUsage.count}</span>/{emailUsage.max}건 (월 기준)
                </p>
              </div>
              <form onSubmit={handleRecoverPassword} className="flex gap-2 pt-1">
                <input
                  id="recovery-email-input"
                  name="recoveryEmail"
                  type="email"
                  autoComplete="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="등록된 이메일 입력"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>발송 중...</span>
                    </>
                  ) : (
                    <span>암호 확인</span>
                  )}
                </button>
              </form>

              {recoveryResult && (
                <div
                  className={`p-2 rounded-lg text-[11px] font-medium leading-relaxed ${
                    recoveryResult.type === 'success'
                      ? 'bg-slate-900 text-emerald-400 border border-emerald-900/50'
                      : 'bg-slate-900 text-rose-400 border border-rose-900/50'
                  }`}
                >
                  {recoveryResult.text}
                </div>
              )}
            </div>

            {/* 4-2) 기록장 초기화 */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleResetClick}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>기록장 초기화</span>
              </button>

              {showResetPrompt && (
                <form onSubmit={handleExecuteResetWithAuth} className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 space-y-2.5">
                  <div className="text-xs text-rose-200 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>기록장을 초기화하려면 비밀번호와 등록 이메일을 입력하세요.</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      id="reset-password-input"
                      name="resetPassword"
                      type="password"
                      autoComplete="current-password"
                      value={resetPasswordInput}
                      onChange={(e) => {
                        setResetPasswordInput(e.target.value);
                        setResetPromptError('');
                      }}
                      placeholder="비밀번호 입력"
                      className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                    <input
                      id="reset-email-input"
                      name="resetEmail"
                      type="email"
                      autoComplete="email"
                      value={resetEmailInput}
                      onChange={(e) => {
                        setResetEmailInput(e.target.value);
                        setResetPromptError('');
                      }}
                      placeholder="등록된 이메일 주소 입력"
                      className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      초기화 실행
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPrompt(false);
                        setResetPasswordInput('');
                        setResetEmailInput('');
                        setResetPromptError('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                  {resetPromptError && (
                    <p className="text-[11px] text-rose-400 font-medium">{resetPromptError}</p>
                  )}
                </form>
              )}

              {resetSuccessMsg && (
                <div className="p-2 rounded-lg text-[11px] font-medium bg-slate-900 text-emerald-400 border border-emerald-900/50 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

