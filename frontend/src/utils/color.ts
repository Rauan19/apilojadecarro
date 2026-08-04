import type { CSSProperties } from "react";

/** Converte #RGB / #RRGGBB para componentes HSL no formato do tema (`H S% L%`). */
export function hexToHslComponents(hex: string): string | null {
  const raw = hex.trim().replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return null;
  }

  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Normaliza qualquer entrada de cor para #RRGGBB. */
export function normalizeHexColor(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^#([0-9a-f]{6})$/i.test(raw)) return raw.toLowerCase();
  if (/^#([0-9a-f]{3})$/i.test(raw)) {
    const short = raw.slice(1);
    return `#${short
      .split("")
      .map((c) => c + c)
      .join("")}`.toLowerCase();
  }
  if (/^([0-9a-f]{6})$/i.test(raw)) return `#${raw.toLowerCase()}`;
  if (/^([0-9a-f]{3})$/i.test(raw)) {
    return `#${raw
      .split("")
      .map((c) => c + c)
      .join("")}`.toLowerCase();
  }
  return null;
}

export type BrandThemeStyle = CSSProperties & Record<string, string>;

/** Gera o style com todas as variáveis usadas pelo Tailwind (`bg-primary`, etc.). */
export function buildBrandThemeStyle(hex?: string | null): BrandThemeStyle | undefined {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return undefined;
  const hsl = hexToHslComponents(normalized);
  if (!hsl) return undefined;

  const color = `hsl(${hsl})`;
  return {
    ["--primary"]: hsl,
    ["--accent"]: hsl,
    ["--ring"]: hsl,
    ["--sidebar-primary"]: hsl,
    ["--sidebar-ring"]: hsl,
    ["--chart-1"]: hsl,
    ["--color-primary"]: color,
    ["--color-accent"]: color,
    ["--color-ring"]: color,
    ["--color-sidebar-primary"]: color,
    ["--color-sidebar-ring"]: color,
    ["--color-chart-1"]: color,
  };
}
