'use client';

import { useEffect } from 'react';

import { useConsent } from './consent-provider';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
    _fbq?: unknown;
  }
}

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/**
 * Скрипты аналитики и рекламы подключаются ТОЛЬКО после согласия
 * на соответствующую категорию cookies. Без согласия — ни одного запроса.
 */
export function ConsentScripts({ gaId, pixelId }: { gaId: string | null; pixelId: string | null }) {
  const { consent } = useConsent();
  const analytics = Boolean(consent?.analytics && gaId);
  const marketing = Boolean(consent?.marketing && pixelId);

  useEffect(() => {
    if (!gaId) return;
    if (analytics) {
      window.dataLayer = window.dataLayer ?? [];
      window.gtag =
        window.gtag ??
        function gtag() {
          // gtag.js ожидает именно объект arguments, а не массив
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer?.push(arguments);
        };
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('js', new Date());
      window.gtag('config', gaId, { anonymize_ip: true });
      injectScript('ga-loader', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
    } else if (window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  }, [analytics, gaId]);

  useEffect(() => {
    if (!pixelId) return;
    if (marketing) {
      if (!window.fbq) {
        const fbq = function (...args: unknown[]) {
          fbq.queue.push(args);
        } as ((...args: unknown[]) => void) & { queue: unknown[]; loaded: boolean; version: string };
        fbq.queue = [];
        fbq.loaded = true;
        fbq.version = '2.0';
        window.fbq = fbq;
        window._fbq = fbq;
      }
      window.fbq('consent', 'grant');
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
      injectScript('fb-pixel-loader', 'https://connect.facebook.net/en_US/fbevents.js');
    } else if (window.fbq) {
      window.fbq('consent', 'revoke');
    }
  }, [marketing, pixelId]);

  return null;
}
