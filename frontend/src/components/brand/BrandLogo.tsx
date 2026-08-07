import { cn } from "@/lib/utils";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/lib/brand";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
  inverted?: boolean;
  /** Se true, loja logada mostra a logo/nome dela no lugar da marca do sistema. */
  preferStoreBrand?: boolean;
  /** Marca do sistema em tamanho hero (tela de login). */
  size?: "default" | "lg";
}

function SystemLogo({
  markClassName,
  size = "default",
}: {
  markClassName?: string;
  size?: "default" | "lg";
}) {
  const isLg = size === "lg";
  return (
    <img
      src={BRAND.logoUrl}
      alt={BRAND.name}
      className={cn(
        "shrink-0 bg-transparent object-contain",
        isLg ? "h-16 w-auto max-w-[220px]" : "h-11 w-auto max-w-[160px]",
        markClassName
      )}
    />
  );
}

export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  subtitle,
  inverted = false,
  preferStoreBrand = false,
  size = "default",
}: BrandLogoProps) {
  const { user } = useAuth();
  const { companyLogo, companyName } = useCompany();
  const showStore =
    preferStoreBrand &&
    !!user?.companyId &&
    user.role !== "SUPER_ADMIN" &&
    (!!companyLogo || !!companyName);

  const title = showStore ? companyName || "Minha loja" : BRAND.name;
  const line = showStore ? subtitle ?? "Painel da loja" : subtitle;
  const isLg = size === "lg";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", isLg && "gap-4", className)}>
      {showStore && companyLogo ? (
        <div
          className={cn(
            "relative flex h-12 w-auto max-w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-white sm:h-14 sm:max-w-[220px]",
            markClassName
          )}
        >
          <img
            src={companyLogo}
            alt={title}
            className="h-12 w-auto max-w-[180px] object-contain sm:h-14 sm:max-w-[220px]"
          />
        </div>
      ) : showStore ? (
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground sm:h-14 sm:w-14",
            markClassName
          )}
        >
          {title.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <SystemLogo size={size} markClassName={markClassName} />
      )}

      {/* Nome ao lado só quando não há logo de verdade (fallback de iniciais) —
          quando a loja já tem logo enviada, a imagem já carrega a identidade. */}
      {showWordmark && showStore && !companyLogo && (
        <div className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "truncate font-display font-bold tracking-tight",
              isLg ? "text-2xl sm:text-3xl" : "text-[1.05rem]",
              inverted ? "text-white" : "text-foreground"
            )}
          >
            {title}
          </span>
          {line ? (
            <span
              className={cn(
                "mt-1 truncate font-medium tracking-wide",
                isLg ? "text-xs" : "text-[11px]",
                inverted ? "text-white/65" : "text-muted-foreground"
              )}
            >
              {line}
            </span>
          ) : null}
        </div>
      )}

      {showWordmark && !showStore && line ? (
        <span
          className={cn(
            "truncate text-[11px] font-medium tracking-wide",
            inverted ? "text-white/65" : "text-muted-foreground"
          )}
        >
          {line}
        </span>
      ) : null}
    </div>
  );
}
