'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAdminDictionary } from '@/i18n/admin-client';

/** Уведомление после создания квартиры (параметр ?created=1 убирается из адреса) */
export function CreatedToast() {
  const ta = useAdminDictionary();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (params.get('created') === '1' && !shown.current) {
      shown.current = true;
      toast.success(ta.apartments.toasts.created);
      router.replace(pathname, { scroll: false });
    }
  }, [params, router, pathname, ta]);

  return null;
}
