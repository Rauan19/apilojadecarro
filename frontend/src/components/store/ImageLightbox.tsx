import * as React from "react";
import { createPortal } from "react-dom";
import {
  StoreChevronLeftIcon,
  StoreChevronRightIcon,
  StoreCloseIcon,
} from "@/components/store/StoreIcons";
import { resolveMediaUrl } from "@/utils/mediaUrl";

interface ImageLightboxProps {
  images: { id: string; url: string }[];
  index: number;
  open: boolean;
  alt?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageLightbox({
  images,
  index,
  open,
  alt,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        onIndexChange(index === 0 ? images.length - 1 : index - 1);
      }
      if (e.key === "ArrowRight") {
        onIndexChange(index === images.length - 1 ? 0 : index + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || images.length === 0 || typeof document === "undefined") return null;

  const current = images[index] ?? images[0];
  const hasMany = images.length > 1;

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange(index === 0 ? images.length - 1 : index - 1);
  };

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange(index === images.length - 1 ? 0 : index + 1);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto em tela cheia"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div className="safe-pt flex shrink-0 items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <p className="text-sm font-medium text-white/80">
          {index + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <StoreCloseIcon className="h-4 w-4" />
          Fechar
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-10"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null || !hasMany) return;
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) < 50) return;
          if (delta > 0) goPrev();
          else goNext();
        }}
      >
        <img
          src={resolveMediaUrl(current.url)}
          alt={alt ?? "Foto do veículo"}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex"
              aria-label="Foto anterior"
            >
              <StoreChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex"
              aria-label="Próxima foto"
            >
              <StoreChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {hasMany && (
        <div
          className="safe-pb flex shrink-0 justify-center gap-1.5 overflow-x-auto px-3 pb-3"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`h-12 w-14 shrink-0 overflow-hidden rounded border-2 ${
                i === index ? "border-white" : "border-transparent opacity-55"
              }`}
            >
              <img src={resolveMediaUrl(image.url)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
