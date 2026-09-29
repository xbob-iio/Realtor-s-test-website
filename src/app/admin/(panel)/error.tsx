'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useAdminDictionary } from '@/i18n/admin-client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ta = useAdminDictionary();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center rounded-3xl border bg-background p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{ta.common.errorTitle}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{ta.common.errorText}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">{error.digest}</p>}
      <Button onClick={reset} className="mt-6">
        <RotateCcw />
        {ta.common.tryAgain}
      </Button>
    </div>
  );
}
