/**
 * Параметры cookie сессии. Модуль без зависимостей от БД — его импортирует и proxy.
 *
 * На HTTPS используется префикс __Host-: браузер примет cookie только с флагом
 * Secure, без Domain и с Path=/ — её нельзя подменить с поддомена.
 */
export function isSecureContextUrl(): boolean {
  return (process.env.SITE_URL ?? '').startsWith('https://');
}

export function getSessionCookieName(): string {
  return isSecureContextUrl() ? '__Host-doma_session' : 'doma_session';
}

/** Неактивная сессия живёт 7 дней, продлевается при использовании */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Продлеваем, когда до истечения осталось меньше половины срока */
export const SESSION_REFRESH_THRESHOLD_MS = SESSION_TTL_MS / 2;
/** Абсолютный максимум жизни сессии — потом нужен повторный вход */
export const SESSION_ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function getSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: isSecureContextUrl(),
    sameSite: 'lax' as const,
    path: '/',
    expires,
  };
}
