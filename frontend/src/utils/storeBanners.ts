export interface StoreBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

export const MAX_STORE_BANNERS = 5;

export function parseStoreBanners(raw: unknown): StoreBanner[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const b = item as Record<string, unknown>;
      const imageUrl = String(b.imageUrl ?? "").trim();
      if (!imageUrl) return null;
      return {
        id: String(b.id ?? crypto.randomUUID()),
        imageUrl,
        title: b.title ? String(b.title) : undefined,
        subtitle: b.subtitle ? String(b.subtitle) : undefined,
        linkUrl: b.linkUrl ? String(b.linkUrl) : undefined,
      } satisfies StoreBanner;
    })
    .filter(Boolean) as StoreBanner[];
}
