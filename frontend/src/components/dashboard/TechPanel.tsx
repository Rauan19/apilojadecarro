import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Painel do dashboard com corte técnico no canto (mesmo grafismo do PrimaryGauge) —
 * usado no lugar do <Card> arredondado padrão nas telas do painel-instrumento. */
export function TechPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden border border-border bg-card", className)}>
      <span className="pointer-events-none absolute right-0 top-0 h-7 w-7 border-b border-l border-border/70" />
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                {title}
              </h3>
            )}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
