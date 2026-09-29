import 'server-only';

import { getEnv } from '@/server/env';

/**
 * Необязательное уведомление о новой заявке в Telegram
 * (LEAD_NOTIFY_TELEGRAM_BOT_TOKEN + LEAD_NOTIFY_TELEGRAM_CHAT_ID).
 * Ошибки не влияют на сохранение заявки.
 */
export async function notifyNewLead(text: string): Promise<void> {
  const env = getEnv();
  const token = env.LEAD_NOTIFY_TELEGRAM_BOT_TOKEN;
  const chatId = env.LEAD_NOTIFY_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) console.error('[notify] telegram responded with', response.status);
  } catch (error) {
    console.error('[notify] telegram request failed', error);
  }
}
