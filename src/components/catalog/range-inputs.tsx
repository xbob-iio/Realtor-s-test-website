'use client';

import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

interface NumberFieldProps {
  id: string;
  label: string;
  value: number | undefined;
  placeholder: string;
  suffix?: string;
  max: number;
  /** Задержка применения, мс (0 — сразу) */
  debounceMs?: number;
  onCommit: (value: number | undefined) => void;
}

function parse(text: string, max: number): number | undefined {
  const digits = text.replace(/\D/g, '');
  if (!digits) return undefined;
  return Math.min(Number.parseInt(digits, 10), max);
}

function display(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

/** Числовое поле фильтра: применяется после паузы в наборе, по Enter или при потере фокуса */
export function NumberField({
  id,
  label,
  value,
  placeholder,
  suffix,
  max,
  debounceMs = 700,
  onCommit,
}: NumberFieldProps) {
  const [text, setText] = useState(display(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Значение изменилось снаружи (сброс фильтров, назад в браузере) — синхронизируем поле
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(display(value));
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function commit(next: string) {
    if (timer.current) clearTimeout(timer.current);
    const parsed = parse(next, max);
    if (parsed !== value) onCommit(parsed);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d]/g, '').slice(0, 9);
          setText(next);
          if (timer.current) clearTimeout(timer.current);
          if (debounceMs === 0) commit(next);
          else timer.current = setTimeout(() => commit(next), debounceMs);
        }}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
        className="h-11 pr-9 text-sm"
      />
      {suffix && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground"
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
