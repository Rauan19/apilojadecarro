export type SocialNetwork = "instagram" | "facebook" | "youtube" | "tiktok";

/** Monta URL pública a partir de @usuario, username ou link completo. */
export function buildSocialUrl(network: SocialNetwork, raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (/^https?:\/\//i.test(value)) return value;

  const handle = value.replace(/^@/, "").replace(/\/+$/, "");
  if (!handle) return null;

  switch (network) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "youtube":
      return handle.startsWith("channel/") || handle.startsWith("@") || handle.startsWith("c/")
        ? `https://youtube.com/${handle}`
        : `https://youtube.com/@${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle.replace(/^@/, "")}`;
    default:
      return null;
  }
}

export interface StoreSocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export function getActiveSocialLinks(social?: StoreSocialLinks | null) {
  if (!social) return [];
  return (["instagram", "facebook", "youtube", "tiktok"] as SocialNetwork[])
    .map((network) => {
      const url = buildSocialUrl(network, social[network]);
      if (!url) return null;
      return { network, url, label: social[network]!.trim() };
    })
    .filter(Boolean) as { network: SocialNetwork; url: string; label: string }[];
}
