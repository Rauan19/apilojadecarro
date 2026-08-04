import { cn } from "@/lib/utils";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
  inverted?: boolean;
  /** Se true, loja logada mostra a logo/nome dela no lugar da marca do sistema. */
  preferStoreBrand?: boolean;
}

const BRAND_RED = "#E31C23";
const BRAND_DARK = "#1A1D23";

function SystemMark({
  inverted,
  markClassName,
}: {
  inverted?: boolean;
  markClassName?: string;
}) {
  return (
    <div className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center", markClassName)}>
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
        <rect width="40" height="40" rx="6" fill={inverted ? BRAND_DARK : BRAND_RED} />
        <path
          d="M8 26.5h24l-2.2-6.2c-.3-.9-1.1-1.5-2-1.5H12.2c-.9 0-1.7.6-2 1.5L8 26.5Z"
          fill="#FFFFFF"
        />
        <path d="M13 19h14l-1.6-4.2c-.2-.6-.8-1-1.4-1H16c-.6 0-1.2.4-1.4 1L13 19Z" fill="#F3C6C8" />
        <circle cx="14" cy="26.5" r="2.4" fill={inverted ? BRAND_DARK : BRAND_RED} stroke="#FFFFFF" strokeWidth="1.2" />
        <circle cx="26" cy="26.5" r="2.4" fill={inverted ? BRAND_DARK : BRAND_RED} stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M8 28.5h24" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.85" />
      </svg>
    </div>
  );
}

export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  subtitle,
  inverted = false,
  preferStoreBrand = false,
}: BrandLogoProps) {
  const { user } = useAuth();
  const { companyLogo, companyName } = useCompany();
  const showStore =
    preferStoreBrand &&
    !!user?.companyId &&
    user.role !== "SUPER_ADMIN" &&
    (!!companyLogo || !!companyName);

  const title = showStore ? companyName || "Minha loja" : "LojaDeCarro";
  const line = showStore ? subtitle ?? "Painel da loja" : subtitle;

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {showStore && companyLogo ? (
        <div
          className={cn(
            "relative flex h-9 w-auto max-w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-white",
            markClassName
          )}
        >
          <img
            src={companyLogo}
            alt={title}
            className="h-9 w-auto max-w-[120px] object-contain"
          />
        </div>
      ) : showStore ? (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground",
            markClassName
          )}
        >
          {title.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <SystemMark inverted={inverted} markClassName={markClassName} />
      )}

      {showWordmark && (
        <div className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "truncate font-display text-[1.05rem] font-bold tracking-tight",
              inverted ? "text-white" : "text-foreground"
            )}
          >
            {title}
          </span>
          {line ? (
            <span
              className={cn(
                "mt-1 truncate text-[11px] font-medium tracking-wide",
                inverted ? "text-white/65" : "text-muted-foreground"
              )}
            >
              {line}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
