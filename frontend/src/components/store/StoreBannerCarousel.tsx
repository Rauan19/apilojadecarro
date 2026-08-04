import * as React from "react";
import { StoreChevronLeftIcon, StoreChevronRightIcon } from "@/components/store/StoreIcons";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import type { StoreBanner } from "@/utils/storeBanners";

interface StoreBannerCarouselProps {
  banners: StoreBanner[];
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

export function StoreBannerCarousel({
  banners,
  fallbackTitle,
  fallbackSubtitle,
}: StoreBannerCarouselProps) {
  const [index, setIndex] = React.useState(0);
  const hasBanners = banners.length > 0;
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    setIndex(0);
  }, [banners]);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const goPrev = () => setIndex((i) => (i === 0 ? banners.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i + 1) % banners.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || banners.length <= 1) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goPrev();
    else goNext();
  };

  if (!hasBanners) {
    return (
      <section className="border-b border-[#e6e6e6] bg-[#2e2e2e] text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
          <h1 className="font-display text-lg font-bold tracking-tight sm:text-2xl">
            {fallbackTitle ?? "Estoque da loja"}
          </h1>
          {fallbackSubtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-snug text-white/75 sm:text-base">{fallbackSubtitle}</p>
          )}
        </div>
      </section>
    );
  }

  const current = banners[index];
  const content = (
    <>
      <img
        src={resolveMediaUrl(current.imageUrl)}
        alt={current.title || "Banner da loja"}
        className="h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent sm:bg-gradient-to-r sm:from-black/65 sm:via-black/30 sm:to-transparent" />
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-7xl px-4 pb-7 pt-6 sm:px-6 sm:pb-8">
          {(current.title || fallbackTitle) && (
            <h1 className="font-display max-w-2xl text-lg font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
              {current.title || fallbackTitle}
            </h1>
          )}
          {(current.subtitle || fallbackSubtitle) && (
            <p className="mt-1 max-w-xl text-xs leading-snug text-white/85 sm:text-sm md:text-base">
              {current.subtitle || fallbackSubtitle}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <section className="relative overflow-hidden bg-[#111]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative h-[140px] w-full sm:h-[180px] md:h-[210px] lg:h-[230px]">
        {current.linkUrl ? (
          <a
            href={current.linkUrl}
            className="absolute inset-0 block"
            target={current.linkUrl.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
          >
            {content}
          </a>
        ) : (
          <div className="absolute inset-0">{content}</div>
        )}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Banner anterior"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white sm:left-3 sm:flex sm:h-9 sm:w-9"
            >
              <StoreChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo banner"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white sm:right-3 sm:flex sm:h-9 sm:w-9"
            >
              <StoreChevronRightIcon className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Ir para banner ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-white sm:w-5" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
