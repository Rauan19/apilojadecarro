import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function getDiscountPercent(price: number, originalPrice?: number | null): number | null {
  const current = Number(price);
  const original = originalPrice == null ? NaN : Number(originalPrice);
  if (!Number.isFinite(original) || !Number.isFinite(current) || original <= current || current < 0) {
    return null;
  }
  return Math.round(((original - current) / original) * 100);
}

interface VehiclePriceProps {
  price: number;
  originalPrice?: number | null;
  className?: string;
  priceClassName?: string;
  size?: "sm" | "md" | "lg";
}

/** Preço no estilo WebMotors: valor preto, antigo riscado, % vermelho */
export function VehiclePrice({
  price,
  originalPrice,
  className,
  priceClassName,
  size = "md",
}: VehiclePriceProps) {
  const discount = getDiscountPercent(price, originalPrice);
  const hasPromo = discount !== null && discount > 0;

  const priceSize =
    size === "lg" ? "text-[1.75rem] sm:text-[2rem]" : size === "sm" ? "text-lg sm:text-xl" : "text-xl sm:text-2xl";
  const oldSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className={cn("space-y-0.5", className)}>
      {hasPromo && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium text-[#696969] line-through", oldSize)}>
            {formatCurrency(originalPrice)}
          </span>
          <span className="text-xs font-bold text-[#e81123]">-{discount}%</span>
        </div>
      )}
      <p className={cn("store-price leading-tight", priceSize, priceClassName)}>{formatCurrency(price)}</p>
    </div>
  );
}
