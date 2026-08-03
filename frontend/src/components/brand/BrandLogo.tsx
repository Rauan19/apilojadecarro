import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
  inverted?: boolean;
}

export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  subtitle,
  inverted = false,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center",
          markClassName
        )}
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
          <rect width="40" height="40" fill={inverted ? "#0B1220" : "#0B3D3A"} />
          <path
            d="M8 26.5h24l-2.2-6.2c-.3-.9-1.1-1.5-2-1.5H12.2c-.9 0-1.7.6-2 1.5L8 26.5Z"
            fill="#F4F7F6"
          />
          <path d="M13 19h14l-1.6-4.2c-.2-.6-.8-1-1.4-1H16c-.6 0-1.2.4-1.4 1L13 19Z" fill="#C5D5D2" />
          <circle cx="14" cy="26.5" r="2.4" fill="#0B3D3A" stroke="#F4F7F6" strokeWidth="1.2" />
          <circle cx="26" cy="26.5" r="2.4" fill="#0B3D3A" stroke="#F4F7F6" strokeWidth="1.2" />
          <path d="M8 28.5h24" stroke="#D97706" strokeWidth="1.5" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "font-display text-[1.05rem] font-semibold uppercase tracking-[0.04em]",
              inverted ? "text-white" : "text-foreground"
            )}
          >
            LojaDeCarro
          </span>
          {subtitle ? (
            <span
              className={cn(
                "mt-1 text-[11px] font-medium tracking-wide",
                inverted ? "text-white/65" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
