import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

const START_ANGLE = 135;
const SWEEP = 270;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export type GaugeTone = "primary" | "success" | "warning" | "accent" | "neutral";

const toneColor: Record<GaugeTone, string> = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  accent: "hsl(var(--accent))",
  neutral: "hsl(var(--foreground))",
};

const toneText: Record<GaugeTone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-[hsl(var(--warning))]",
  accent: "text-accent",
  neutral: "text-foreground",
};

function TrendMark({ value, positive }: { value: number; positive?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums",
        positive ? "text-success" : "text-destructive"
      )}
    >
      <svg viewBox="0 0 10 10" width={8} height={8} aria-hidden>
        <path
          d={positive ? "M1 8 L5 2 L9 8" : "M1 2 L5 8 L9 2"}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      {Math.abs(value)}%
    </span>
  );
}

/** Mostrador principal (grande) do painel-instrumento — arco + ponteiro + escala,
 * pro punhado de métricas que realmente carregam uma proporção (ex.: estoque
 * disponível, leads em aberto). Reservado pras 1-2 métricas mais importantes
 * da tela; o resto vira ReadoutRow. */
export function PrimaryGauge({
  label,
  value,
  sublabel,
  percent,
  tone = "primary",
  icon: Icon,
  size = 148,
}: {
  label: string;
  value: string;
  sublabel?: string;
  percent: number;
  tone?: GaugeTone;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  size?: number;
}) {
  const cx = 60;
  const cy = 60;
  const r = 46;
  const trackPath = arcPath(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP);
  const clamped = Math.min(100, Math.max(0, percent));
  const valueEnd = START_ANGLE + (clamped / 100) * SWEEP;
  const valuePath = arcPath(cx, cy, r, START_ANGLE, valueEnd);
  const needle = polarToCartesian(cx, cy, r - 14, valueEnd);

  const ticks = Array.from({ length: 21 }, (_, i) => {
    const angle = START_ANGLE + (i / 20) * SWEEP;
    const major = i % 5 === 0;
    const outer = polarToCartesian(cx, cy, r + 3, angle);
    const inner = polarToCartesian(cx, cy, r - (major ? 5 : 2.5), angle);
    return { key: i, outer, inner, major };
  });

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" width={size} height={size} className="shrink-0" aria-hidden>
        <path d={trackPath} fill="none" stroke="hsl(var(--border))" strokeWidth={6} strokeLinecap="butt" />
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.inner.x}
            y1={t.inner.y}
            x2={t.outer.x}
            y2={t.outer.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={t.major ? 1.8 : 1}
            opacity={t.major ? 0.7 : 0.35}
          />
        ))}
        <path d={valuePath} fill="none" stroke={toneColor[tone]} strokeWidth={6} strokeLinecap="butt" />
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={toneColor[tone]} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={5} fill="hsl(var(--card))" stroke={toneColor[tone]} strokeWidth={2.5} />
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          className="font-display"
          style={{ fontSize: 22, fontWeight: 800, fill: "hsl(var(--foreground))" }}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className={cn("h-4 w-4 shrink-0", toneText[tone])} />
          <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
        </div>
        <p className="mt-1.5 font-display text-3xl font-extrabold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {sublabel && <p className="mt-1.5 text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}

/** Leitura digital compacta — pro grosso das métricas (contagens, dinheiro)
 * que não têm uma proporção natural pra virar mostrador. Fica em linha,
 * como o display de bordo de um painel real, não como card repetido. */
export function ReadoutRow({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: GaugeTone;
  trend?: { value: number; positive?: boolean };
}) {
  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <Icon className={cn("h-4 w-4 shrink-0", toneText[tone])} />
      <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
      {trend && <TrendMark value={trend.value} positive={trend.positive} />}
      <p className="shrink-0 font-display text-base font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
