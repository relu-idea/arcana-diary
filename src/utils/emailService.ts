import emailjs from '@emailjs/browser';

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

const CONFIG_KEY = 'arcana_emailjs_config';
const USAGE_COUNT_KEY = 'arcana_email_usage_count';
const USAGE_MONTH_KEY = 'arcana_email_usage_month';

// Default / stored config
export const getEmailJSConfig = (): EmailJSConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse EmailJS config from localStorage:', e);
  }
  return {
    serviceId: '',
    templateId: '',
    publicKey: '',
  };
};

export const setEmailJSConfig = (config: EmailJSConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

// Monthly usage counter (0/200건 월기준)
export const getEmailUsageInfo = (): { count: number; max: number; currentMonth: string } => {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const storedMonth = localStorage.getItem(USAGE_MONTH_KEY);

  if (storedMonth !== currentMonth) {
    // Reset for new month
    localStorage.setItem(USAGE_MONTH_KEY, currentMonth);
    localStorage.setItem(USAGE_COUNT_KEY, '0');
    return { count: 0, max: 200, currentMonth };
  }

  const count = parseInt(localStorage.getItem(USAGE_COUNT_KEY) || '0', 10);
  return { count: isNaN(count) ? 0 : count, max: 200, currentMonth };
};

export const incrementEmailUsage = (): number => {
  const info = getEmailUsageInfo();
  const newCount = info.count + 1;
  localStorage.setItem(USAGE_COUNT_KEY, newCount.toString());
  return newCount;
};

// Send recovery email via EmailJS
export const sendRecoveryEmail = async (
  toEmail: string,
  password: string
): Promise<{ success: boolean; message: string; count: number }> => {
  const usage = getEmailUsageInfo();
  if (usage.count >= usage.max) {
    return {
      success: false,
      message: `이번 달 이메일 발송 한도(${usage.max}건)를 초과하였습니다.`,
      count: usage.count,
    };
  }

  const config = getEmailJSConfig();

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    // If EmailJS config is not set, simulate/return success with screen notification
    const newCount = incrementEmailUsage();
    return {
      success: true,
      message: `비밀번호: [ ${password} ] (EmailJS 설정이 완료되면 메일로도 자동 발송됩니다)`,
      count: newCount,
    };
  }

  try {
    await emailjs.send(
      config.serviceId,
      config.templateId,
      {
        to_email: toEmail,
        email: toEmail,
        user_email: toEmail,
        reply_to: toEmail,
        to_name: toEmail,
        recipient: toEmail,
        message: `아르카나 기록장 비밀번호는 [ ${password} ] 입니다.`,
        password: password,
      },
      config.publicKey
    );

    const newCount = incrementEmailUsage();
    return {
      success: true,
      message: `등록된 이메일(${toEmail})로 비밀번호가 발송되었습니다. 메일이 보이지 않는 경우 [스팸메일함]을 먼저 확인하시고, 여전히 없다면 EmailJS 대시보드의 Email Templates ⚙️ Settings에서 'To Email' 항목이 {{to_email}} 로 지정되어 있는지 확인해주세요.`,
      count: newCount,
    };
  } catch (err: any) {
    console.error('EmailJS Send error:', err);
    const errDetail = err?.text || err?.message || JSON.stringify(err);
    return {
      success: false,
      message: `이메일 발송 실패: ${errDetail} (EmailJS 대시보드의 템플릿 To Email 설정에 {{to_email}} 또는 {{email}} 이 설정되어 있는지 확인해주세요.)`,
      count: usage.count,
    };
  }
};
