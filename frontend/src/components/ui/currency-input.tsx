import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoneyInput, parseMoneyInput } from "@/lib/masks";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type" | "inputMode"> {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  /** Se true, 0 aparece vazio (bom para opcionais / formulário novo). */
  emptyWhenZero?: boolean;
}

export function CurrencyInput({
  value,
  onValueChange,
  emptyWhenZero = true,
  className,
  ...props
}: CurrencyInputProps) {
  const display =
    value == null || Number.isNaN(Number(value)) || (emptyWhenZero && Number(value) === 0)
      ? ""
      : formatMoneyInput(Number(value));

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        className={cn("pl-10", className)}
        onChange={(e) => onValueChange(parseMoneyInput(e.target.value))}
      />
    </div>
  );
}
