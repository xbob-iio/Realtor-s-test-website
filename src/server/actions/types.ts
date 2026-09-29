/** Единый формат ответа server actions для форм */
export interface ActionState {
  status: 'idle' | 'success' | 'error';
  /** Ключ сообщения из словаря или готовый текст */
  message?: string;
  /** Поле → ключ ошибки из словаря */
  fieldErrors?: Record<string, string>;
}

export const IDLE: ActionState = { status: 'idle' };

/** Ответ простых действий (кнопки, меню) */
export interface ActionResult {
  ok: boolean;
  message?: string;
}
