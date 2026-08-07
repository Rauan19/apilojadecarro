import { cn } from "@/lib/utils";

interface StockLotSegment {
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
  neutral: "bg-muted-foreground/40",
};

const toneDot: Record<StockLotSegment["tone"], string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-[hsl(var(--warning))]",
  destructive: "bg-destructive",
  neutral: "bg-muted-foreground",
};

const TOTAL_TILES = 42;

/** Visualização do estoque como um "lote" de blocos — cada bloco é uma fatia
 * proporcional do total, agrupada por status. Não é 1 bloco = 1 veículo
 * (ficaria ilegível com estoques grandes); é uma leitura de composição rápida,
 * no lugar do gráfico de pizza genérico. */
export function StockLot({ segments }: { segments: StockLotSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const withTiles = segments.map((s) => ({
    ...s,
    tiles: total > 0 && s.count > 0 ? Math.max(1, Math.round((s.count / total) * TOTAL_TILES)) : 0,
  }));

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {total === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado ainda.</p>
        )}
        {withTiles.map((segment) =>
          Array.from({ length: segment.tiles }).map((_, i) => (
            <span
              key={`${segment.key}-${i}`}
              className={cn("h-4 w-2.5", toneBg[segment.tone])}
              title={segment.label}
            />
          ))
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0", toneDot[segment.tone])} />
            <span className="truncate text-xs text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-display text-sm font-bold tabular-nums text-foreground">
              {segment.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
