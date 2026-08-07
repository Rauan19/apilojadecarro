import { cn } from "@/lib/utils";

export interface StockLotSegment {
  key: string;
  label: string;
  count: number;
  tone: "primary" | "success" | "warning" | "destructive" | "neutral";
}

const toneBg: Record<StockLotSegment["tone"], string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-[hsl(var(--warning))]",
  destructive: "bg-destructive",
  neutral: "bg-muted-foreground/35",
};

const toneText: Record<StockLotSegment["tone"], string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-[hsl(var(--warning))]",
  destructive: "text-destructive",
  neutral: "text-muted-foreground",
};

/** Mapa do pátio: faixa proporcional + contagem tipográfica por status. */
export function StockLot({ segments }: { segments: StockLotSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const active = segments.filter((s) => s.count > 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado ainda.</p>;
  }

  return (
    <div>
      <div className="flex h-12 overflow-hidden rounded-md sm:h-14">
        {active.map((segment, i) => {
          const pct = (segment.count / total) * 100;
          return (
            <div
              key={segment.key}
              className={cn(
                "relative min-w-[0.35rem] transition-[flex-grow] duration-500",
                toneBg[segment.tone],
                i > 0 && "border-l border-white/25",
              )}
              style={{ flexGrow: Math.max(pct, 2.5), flexBasis: 0 }}
              title={`${segment.label}: ${segment.count}`}
            />
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {segments.map((segment) => {
          const pct = total > 0 ? Math.round((segment.count / total) * 100) : 0;
          return (
            <div key={segment.key} className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">{segment.label}</p>
              <p
                className={cn(
                  "mt-1 font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl",
                  segment.count > 0 ? toneText[segment.tone] : "text-muted-foreground/50",
                )}
              >
                {segment.count}
              </p>
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">{pct}% do estoque</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
