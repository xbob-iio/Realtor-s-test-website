'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useDictionary } from '@/i18n/client';

export function ShareButton({ title }: { title: string }) {
  const t = useDictionary();

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.copied);
    } catch {
      toast.error(url);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share}>
      <Share2 />
      {t.common.share}
    </Button>
  );
}
