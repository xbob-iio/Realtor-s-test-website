'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, LoaderCircle, Pencil, Star, Trash, TriangleAlert, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminDictionary } from '@/i18n/admin-client';
import { fill } from '@/i18n/format';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_TYPES,
  bytesToMegabytes,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_APARTMENT,
} from '@/lib/images';
import { cn } from '@/lib/utils';
import {
  deleteImageAction,
  reorderImagesAction,
  setPrimaryImageAction,
  updateImageAltAction,
} from '@/server/actions/images';

import { ConfirmDialog } from './confirm-dialog';

export interface ManagedImage {
  id: string;
  url: string;
  alt: string | null;
  width: number;
  height: number;
  blurDataUrl: string | null;
}

interface UploadItem {
  key: string;
  name: string;
  preview: string;
  progress: number;
  error?: string;
}

const UPLOAD_CONCURRENCY = 2;

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ status: number; body: { image?: ManagedImage; error?: string } | null }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.response });
    xhr.onerror = () => resolve({ status: 0, body: null });
    const data = new FormData();
    data.append('file', file);
    xhr.send(data);
  });
}

export function ImageManager({
  apartmentId,
  initialImages,
}: {
  apartmentId: string;
  initialImages: ManagedImage[];
}) {
  const ta = useAdminDictionary();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ManagedImage | null>(null);
  const [altTarget, setAltTarget] = useState<ManagedImage | null>(null);

  // Новые данные с сервера (после router.refresh) — синхронизируем список
  const serverKey = initialImages.map((image) => `${image.id}:${image.alt ?? ''}`).join('|');
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (serverKey !== syncedKey) {
    setSyncedKey(serverKey);
    setImages(initialImages);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const uploading = uploads.some((item) => !item.error);
  const slotsLeft = MAX_PHOTOS_PER_APARTMENT - images.length - uploads.filter((item) => !item.error).length;

  function actionError(message?: string) {
    if (message === 'rateLimited') return ta.common.rateLimited;
    if (message === 'lastPhoto') return ta.images.errors.lastPhoto;
    return ta.images.toasts.error;
  }

  function uploadErrorText(code: string | undefined, name: string) {
    switch (code) {
      case 'type':
        return fill(ta.images.errors.type, { name });
      case 'dimensions':
        return fill(ta.images.errors.dimensions, { name });
      case 'corrupt':
        return fill(ta.images.errors.corrupt, { name });
      case 'too_large':
        return fill(ta.images.errors.size, { name, size: bytesToMegabytes(MAX_PHOTO_BYTES) });
      case 'too_many':
        return fill(ta.images.errors.count, { count: MAX_PHOTOS_PER_APARTMENT });
      case 'rate_limited':
        return ta.common.rateLimited;
      case 'unauthorized':
        return ta.common.unauthorized;
      default:
        return fill(ta.images.errors.failed, { name });
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    const accepted: File[] = [];
    for (const file of files) {
      if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        toast.error(fill(ta.images.errors.type, { name: file.name }));
      } else if (file.size > MAX_PHOTO_BYTES) {
        toast.error(
          fill(ta.images.errors.size, { name: file.name, size: bytesToMegabytes(MAX_PHOTO_BYTES) }),
        );
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length > slotsLeft) {
      toast.error(fill(ta.images.errors.count, { count: MAX_PHOTOS_PER_APARTMENT }));
      accepted.splice(Math.max(0, slotsLeft));
    }
    if (!accepted.length) return;

    const items = accepted.map((file) => ({
      file,
      item: {
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        preview: URL.createObjectURL(file),
        progress: 0,
      } satisfies UploadItem,
    }));
    setUploads((current) => [...current, ...items.map(({ item }) => item)]);

    let succeeded = 0;
    const queue = [...items];
    const worker = async () => {
      while (queue.length) {
        const next = queue.shift();
        if (!next) break;
        const { file, item } = next;
        const result = await uploadWithProgress(
          `/api/admin/apartments/${apartmentId}/images`,
          file,
          (progress) =>
            setUploads((current) =>
              current.map((entry) => (entry.key === item.key ? { ...entry, progress } : entry)),
            ),
        );
        if (result.status === 201 && result.body?.image) {
          const image = result.body.image;
          succeeded++;
          setImages((current) => [...current, image]);
          setUploads((current) => current.filter((entry) => entry.key !== item.key));
          URL.revokeObjectURL(item.preview);
        } else {
          const message = uploadErrorText(result.body?.error, file.name);
          setUploads((current) =>
            current.map((entry) => (entry.key === item.key ? { ...entry, error: message } : entry)),
          );
          toast.error(message);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, items.length) }, worker));

    if (succeeded > 0) {
      toast.success(ta.images.uploaded);
      router.refresh();
    }
  }

  function dismissUpload(key: string) {
    setUploads((current) => {
      const item = current.find((entry) => entry.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return current.filter((entry) => entry.key !== key);
    });
  }

  function persistOrder(next: ManagedImage[], previous: ManagedImage[], successMessage: string) {
    setImages(next);
    startTransition(async () => {
      const result = await reorderImagesAction(
        apartmentId,
        next.map((image) => image.id),
      );
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        setImages(previous);
        toast.error(actionError(result.message));
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = images.findIndex((image) => image.id === active.id);
    const to = images.findIndex((image) => image.id === over.id);
    if (from < 0 || to < 0) return;
    const wasFirst = images[0]?.id;
    const next = arrayMove(images, from, to);
    persistOrder(
      next,
      images,
      next[0]?.id !== wasFirst ? ta.images.toasts.primary : ta.images.toasts.reordered,
    );
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    persistOrder(arrayMove(images, index, target), images, ta.images.toasts.reordered);
  }

  function makePrimary(image: ManagedImage) {
    const previous = images;
    setImages([image, ...images.filter((item) => item.id !== image.id)]);
    startTransition(async () => {
      const result = await setPrimaryImageAction(apartmentId, image.id);
      if (result.ok) {
        toast.success(ta.images.toasts.primary);
        router.refresh();
      } else {
        setImages(previous);
        toast.error(actionError(result.message));
      }
    });
  }

  async function confirmDelete(): Promise<boolean> {
    if (!deleteTarget) return true;
    const result = await deleteImageAction(apartmentId, deleteTarget.id);
    if (result.ok) {
      setImages((current) => current.filter((image) => image.id !== deleteTarget.id));
      toast.success(ta.images.toasts.deleted);
      router.refresh();
    } else {
      toast.error(actionError(result.message));
    }
    return result.ok;
  }

  const announcements = ta.images.announcements;
  const indexOf = (id: string | number) => images.findIndex((image) => image.id === id) + 1;

  return (
    <div className="space-y-5">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200',
          dragOver ? 'border-brand bg-brand-soft' : 'border-input bg-surface hover:border-foreground/25',
          slotsLeft <= 0 && 'pointer-events-none opacity-60',
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-background text-brand shadow-soft">
          <ImagePlus className="size-6" />
        </span>
        <div>
          <p className="font-semibold">{dragOver ? ta.images.dropActive : ta.images.dropTitle}</p>
          <p className="text-sm text-muted-foreground">{ta.images.dropSubtitle}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {fill(ta.images.hint, { size: bytesToMegabytes(MAX_PHOTO_BYTES), count: MAX_PHOTOS_PER_APARTMENT })}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-3xl"
          aria-label={`${ta.images.dropTitle} — ${ta.images.dropSubtitle}`}
          disabled={slotsLeft <= 0}
        />
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={`${ACCEPTED_IMAGE_TYPES.join(',')},${ACCEPTED_IMAGE_EXTENSIONS}`}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{fill(ta.images.count, { count: images.length, max: MAX_PHOTOS_PER_APARTMENT })}</span>
        {(pending || uploading) && (
          <span className="flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            {ta.common.loading}
          </span>
        )}
      </div>

      {images.length === 0 && uploads.length === 0 ? (
        <p className="rounded-2xl bg-surface p-6 text-center text-muted-foreground">{ta.images.empty}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            screenReaderInstructions: { draggable: announcements.instructions },
            announcements: {
              onDragStart: ({ active }) => fill(announcements.start, { index: indexOf(active.id) }),
              onDragOver: ({ over }) =>
                over ? fill(announcements.over, { index: indexOf(over.id) }) : undefined,
              onDragEnd: ({ over }) =>
                over ? fill(announcements.end, { index: indexOf(over.id) }) : undefined,
              onDragCancel: () => announcements.cancel,
            },
          }}
        >
          <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  index={index}
                  total={images.length}
                  disabled={pending}
                  onPrimary={() => makePrimary(image)}
                  onDelete={() => setDeleteTarget(image)}
                  onAlt={() => setAltTarget(image)}
                  onMove={(delta) => move(index, delta)}
                />
              ))}
              {uploads.map((upload) => (
                <li
                  key={upload.key}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- локальное превью blob: до загрузки */}
                  <img src={upload.preview} alt="" className="size-full object-cover opacity-60" />
                  {upload.error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/75 p-3 text-center text-xs font-semibold text-white">
                      <TriangleAlert className="size-5" />
                      <span className="line-clamp-3">{upload.error}</span>
                      <button
                        type="button"
                        onClick={() => dismissUpload(upload.key)}
                        className="absolute top-2 right-2 rounded-full bg-black/30 p-1"
                        aria-label={ta.common.close}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-x-3 bottom-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
                        <div
                          className="h-full rounded-full bg-brand transition-[width] duration-200"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={ta.images.deleteConfirmTitle}
        description={ta.images.deleteConfirmText}
        confirmLabel={ta.images.delete}
        destructive
        onConfirm={confirmDelete}
      />

      <AltDialog
        image={altTarget}
        onClose={() => setAltTarget(null)}
        onSave={async (alt) => {
          if (!altTarget) return true;
          const result = await updateImageAltAction(apartmentId, altTarget.id, alt);
          if (result.ok) {
            setImages((current) =>
              current.map((image) => (image.id === altTarget.id ? { ...image, alt } : image)),
            );
            toast.success(ta.images.toasts.altSaved);
            router.refresh();
          } else {
            toast.error(actionError(result.message));
          }
          return result.ok;
        }}
      />
    </div>
  );
}

function SortableImage({
  image,
  index,
  total,
  disabled,
  onPrimary,
  onDelete,
  onAlt,
  onMove,
}: {
  image: ManagedImage;
  index: number;
  total: number;
  disabled: boolean;
  onPrimary: () => void;
  onDelete: () => void;
  onAlt: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const ta = useAdminDictionary();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: image.id,
      disabled,
    });
  const primary = index === 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted',
        isDragging && 'z-10 scale-[1.03] shadow-elevated ring-2 ring-brand',
        primary && 'ring-2 ring-foreground',
      )}
    >
      <Image
        src={image.url}
        alt={image.alt ?? ''}
        fill
        sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 45vw"
        placeholder={image.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={image.blurDataUrl ?? undefined}
        className="pointer-events-none object-cover select-none"
      />

      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-bold shadow-soft',
            primary ? 'bg-foreground text-background' : 'bg-white/90 text-foreground',
          )}
        >
          {primary ? ta.images.primary : index + 1}
        </span>
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={ta.images.dragHandle}
          className="flex size-9 cursor-grab touch-none items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <div className="flex gap-1.5">
          <IconAction
            label={ta.images.moveLeft}
            onClick={() => onMove(-1)}
            disabled={disabled || index === 0}
          >
            <span aria-hidden>←</span>
          </IconAction>
          <IconAction
            label={ta.images.moveRight}
            onClick={() => onMove(1)}
            disabled={disabled || index === total - 1}
          >
            <span aria-hidden>→</span>
          </IconAction>
        </div>
        <div className="flex gap-1.5">
          {!primary && (
            <IconAction label={ta.images.makePrimary} onClick={onPrimary} disabled={disabled}>
              <Star className="size-4" />
            </IconAction>
          )}
          <IconAction label={ta.images.editAlt} onClick={onAlt} disabled={disabled}>
            <Pencil className="size-4" />
          </IconAction>
          <IconAction label={ta.images.delete} onClick={onDelete} disabled={disabled} destructive>
            <Trash className="size-4" />
          </IconAction>
        </div>
      </div>
    </li>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-white/95 text-sm font-bold shadow-soft transition-colors disabled:opacity-40',
        destructive
          ? 'text-destructive hover:bg-destructive hover:text-white'
          : 'text-foreground hover:bg-foreground hover:text-background',
      )}
    >
      {children}
    </button>
  );
}

function AltDialog({
  image,
  onClose,
  onSave,
}: {
  image: ManagedImage | null;
  onClose: () => void;
  onSave: (alt: string) => Promise<boolean>;
}) {
  const ta = useAdminDictionary();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={image !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {image && (
          <form
            key={image.id}
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              const alt = String(new FormData(event.currentTarget).get('alt') ?? '');
              startTransition(async () => {
                if (await onSave(alt)) onClose();
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>{ta.images.editAlt}</DialogTitle>
              <DialogDescription>{ta.images.altLabel}</DialogDescription>
            </DialogHeader>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
              <Image src={image.url} alt="" fill sizes="480px" className="object-cover" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-alt">{ta.images.editAlt}</Label>
              <Input
                id="image-alt"
                name="alt"
                defaultValue={image.alt ?? ''}
                placeholder={ta.images.altPlaceholder}
                maxLength={200}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {ta.common.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <LoaderCircle className="animate-spin" />}
                {ta.common.save}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
