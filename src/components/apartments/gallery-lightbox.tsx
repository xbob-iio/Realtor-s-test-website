'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { useDictionary } from '@/i18n/client';
import { fill } from '@/i18n/format';
import type { ApartmentImageData } from '@/lib/catalog/types';
import { cn } from '@/lib/utils';

interface LightboxProps {
  images: ApartmentImageData[];
  startIndex: number;
  altFor: (image: ApartmentImageData, index: number) => string;
  onClose: (index: number) => void;
}

/** Полноэкранная галерея: свайп, стрелки клавиатуры, Esc, миниатюры */
export function GalleryLightbox({ images, startIndex, altFor, onClose }: LightboxProps) {
  const t = useDictionary();
  const [viewportRef, api] = useEmblaCarousel({ loop: images.length > 1, startIndex, duration: 20 });
  const [selected, setSelected] = useState(startIndex);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose(selected)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col text-white outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') prev();
            if (event.key === 'ArrowRight') next();
          }}
        >
          <DialogPrimitive.Title className="sr-only">{t.apartment.gallery.label}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {fill(t.apartment.gallery.counter, { current: selected + 1, total: images.length })}
          </DialogPrimitive.Description>

          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 sm:px-6">
            <span className="text-sm font-semibold text-white/80 tabular-nums" aria-live="polite">
              {fill(t.apartment.gallery.counter, { current: selected + 1, total: images.length })}
            </span>
            <DialogPrimitive.Close
              className="flex size-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              aria-label={t.apartment.gallery.closeFullscreen}
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative min-h-0 flex-1">
            <div ref={viewportRef} className="h-full overflow-hidden">
              <div className="flex h-full touch-pan-y">
                {images.map((image, index) => (
                  <div key={image.id} className="relative h-full min-w-0 flex-[0_0_100%] px-2 sm:px-16">
                    <div className="relative h-full w-full">
                      <Image
                        src={image.url}
                        alt={altFor(image, index)}
                        fill
                        sizes="100vw"
                        quality={85}
                        priority={index === startIndex}
                        className="object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label={t.apartment.gallery.previous}
                  className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 sm:flex"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label={t.apartment.gallery.next}
                  className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 sm:flex"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={fill(t.apartment.gallery.goTo, { index: index + 1 })}
                  aria-current={index === selected}
                  className={cn(
                    'relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg transition-opacity sm:w-20',
                    index === selected ? 'opacity-100 ring-2 ring-white' : 'opacity-45 hover:opacity-80',
                  )}
                >
                  <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
