import { API_URL } from "@/services/api";

/** Resolve URL de imagem (logo, veículo, banner) para o browser. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = API_URL.replace(/\/api\/?$/, "");
  return `${origin}/${url.replace(/^\//, "")}`;
}
