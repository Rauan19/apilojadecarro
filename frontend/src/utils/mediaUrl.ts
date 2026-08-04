import { API_URL } from "@/services/api";

function apiOrigin(): string {
  return API_URL.replace(/\/api\/?$/, "");
}

/**
 * Resolve URL de imagem (logo, veículo, banner) para o browser.
 * Reescreve URLs absolutas antigas (ex. localhost) que apontam para `/uploads/...`
 * usando a origem atual da API — assim fotos salvas com APP_URL errado ainda aparecem.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url;

  const origin = apiOrigin();
  const uploadsMatch = url.match(/\/uploads\/[^?#]+/);
  if (uploadsMatch) {
    return `${origin}${uploadsMatch[0]}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${origin}/${url.replace(/^\//, "")}`;
}
