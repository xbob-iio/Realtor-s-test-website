'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useDictionary } from '@/i18n/client';
import { OPTIONAL_CATEGORIES } from '@/lib/consent';

import { useConsent } from './consent-provider';

type Choice = Record<(typeof OPTIONAL_CATEGORIES)[number], boolean>;

export function CookiePreferencesDialog() {
  const t = useDictionary();
  const { consent, preferencesOpen, setPreferencesOpen, save, acceptAll } = useConsent();

  return (
    <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
      <DialogContent className="sm:max-w-lg">
        {/* key сбрасывает черновик выбора при каждом открытии */}
        {preferencesOpen && (
          <PreferencesForm
            key={String(consent?.timestamp ?? 'new')}
            initial={{
              functional: consent?.functional ?? false,
              analytics: consent?.analytics ?? false,
              marketing: consent?.marketing ?? false,
            }}
            onSave={(choice) => {
              save(choice);
              toast.success(t.cookies.saved);
            }}
            onAcceptAll={() => {
              acceptAll();
              toast.success(t.cookies.saved);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PreferencesForm({
  initial,
  onSave,
  onAcceptAll,
}: {
  initial: Choice;
  onSave: (choice: Choice) => void;
  onAcceptAll: () => void;
}) {
  const t = useDictionary();
  const [choice, setChoice] = useState<Choice>(initial);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.cookies.preferencesTitle}</DialogTitle>
        <DialogDescription>{t.cookies.preferencesText}</DialogDescription>
      </DialogHeader>

      <ul className="divide-y rounded-2xl border">
        <li className="flex items-start justify-between gap-4 p-4">
          <div className="space-y-1">
            <p className="font-semibold">{t.cookies.categories.necessary.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.cookies.categories.necessary.text}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {t.cookies.alwaysOn}
          </span>
        </li>
        {OPTIONAL_CATEGORIES.map((category) => {
          const id = `cookie-${category}`;
          return (
            <li key={category} className="flex items-start justify-between gap-4 p-4">
              <label htmlFor={id} className="space-y-1">
                <span className="block font-semibold">{t.cookies.categories[category].title}</span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  {t.cookies.categories[category].text}
                </span>
              </label>
              <Switch
                id={id}
                checked={choice[category]}
                onCheckedChange={(checked) => setChoice((current) => ({ ...current, [category]: checked }))}
                className="mt-0.5"
              />
            </li>
          );
        })}
      </ul>

      <DialogFooter>
        <Button variant="outline" onClick={() => onSave(choice)}>
          {t.cookies.save}
        </Button>
        <Button onClick={onAcceptAll}>{t.cookies.acceptAll}</Button>
      </DialogFooter>
    </>
  );
}
