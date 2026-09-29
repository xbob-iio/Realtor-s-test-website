'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Expand, ImageOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { useDictionary } from '@/i18n/client';
import { fill } from '@/i18n/format';
import type { ApartmentImageData } from '@/lib/catalog/types';
import { cn } from '@/lib/utils';

// Полноэкранный просмотр загружается только при открытии
const GalleryLightbox = dynamic(() => import('./gallery-lightbox').then((module) => module.GalleryLightbox), {
  ssr: false,
});

interface GalleryProps {
  images: ApartmentImageData[];
  title: string;
}

export function ApartmentGallery({ images, title }: GalleryProps) {
  const t = useDictionary();
  const [mainRef, mainApi] = useEmblaCarousel({ loop: images.length > 1, duration: 22 });
  const [thumbsRef, thumbsApi] = useEmblaCarousel({ dragFree: true, containScroll: 'keepSnaps' });
  const [selected, setSelected] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!mainApi) return;
    const onSelect = () => {
      const index = mainApi.selectedScrollSnap();
      setSelected(index);
      thumbsApi?.scrollTo(index);
    };
    mainApi.on('select', onSelect).on('reInit', onSelect);
    return () => {
      mainApi.off('select', onSelect).off('reInit', onSelect);
    };
  }, [mainApi, thumbsApi]);

  const scrollPrev = useCallback(() => mainApi?.scrollPrev(), [mainApi]);
  const scrollNext = useCallback(() => mainApi?.scrollNext(), [mainApi]);

  const altFor = (image: ApartmentImageData, index: number) =>
    image.alt || fill(t.apartment.gallery.photoAlt, { title, index: index + 1 });

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-3xl bg-muted text-muted-foreground">
        <ImageOff className="size-10" />
        <p>{t.apartment.gallery.noPhotos}</p>
      </div>
    );
  }

  return (
    <section aria-label={t.apartment.gallery.label} className="space-y-3">
      <div
        className="group/gallery relative overflow-hidden rounded-3xl bg-muted"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            scrollPrev();
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            scrollNext();
          } else if (event.key === 'Enter') {
            setLightboxIndex(selected);
          }
        }}
      >
        <div ref={mainRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {images.map((image, index) => (
              <div
                key={image.id}
                role="group"
                aria-roledescription="slide"
                aria-label={fill(t.apartment.gallery.counter, { current: index + 1, total: images.length })}
                className="relative aspect-[4/3] min-w-0 flex-[0_0_100%] sm:aspect-[16/10] lg:aspect-[16/9]"
              >
                <Image
                  src={image.url}
                  alt={altFor(image, index)}
                  fill
                  sizes="(min-width: 1280px) 1200px, 100vw"
                  priority={index === 0}
                  quality={85}
                  placeholder={image.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={image.blurDataUrl ?? undefined}
                  className="object-cover"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setLightboxIndex(index)}
                  className="absolute inset-0 cursor-zoom-in"
                  aria-label={t.apartment.gallery.openFullscreen}
                />
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label={t.apartment.gallery.previous}
              className="absolute top-1/2 left-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-card backdrop-blur transition-[opacity,transform] duration-300 group-hover/gallery:opacity-100 hover:scale-105 focus-visible:opacity-100 sm:flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label={t.apartment.gallery.next}
              className="absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-card backdrop-blur transition-[opacity,transform] duration-300 group-hover/gallery:opacity-100 hover:scale-105 focus-visible:opacity-100 sm:flex"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between">
          <span className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white tabular-nums backdrop-blur">
            {fill(t.apartment.gallery.counter, { current: selected + 1, total: images.length })}
          </span>
          <button
            type="button"
            onClick={() => setLightboxIndex(selected)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold shadow-card backdrop-blur transition-transform hover:scale-105"
          >
            <Expand className="size-4" />
            <span className="hidden sm:inline">{t.apartment.cta.showAllPhotos}</span>
            <span className="sr-only sm:hidden">{t.apartment.gallery.openFullscreen}</span>
          </button>
        </div>
      </div>

      {images.length > 1 && (
        <div ref={thumbsRef} className="overflow-hidden">
          <div className="flex gap-2.5">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => mainApi?.scrollTo(index)}
                aria-label={fill(t.apartment.gallery.goTo, { index: index + 1 })}
                aria-current={index === selected}
                className={cn(
                  'relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl transition-[opacity,box-shadow] duration-300 sm:w-28',
                  index === selected
                    ? 'ring-2 ring-foreground ring-offset-2'
                    : 'opacity-60 hover:opacity-100',
                )}
              >
                <Image src={image.url} alt="" fill sizes="112px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          startIndex={lightboxIndex}
          altFor={altFor}
          onClose={(index) => {
            setLightboxIndex(null);
            mainApi?.scrollTo(index, true);
          }}
        />
      )}
    </section>
  );
}
