import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MaskFn = (value: string) => string;

interface MaskedInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string;
  mask: MaskFn;
  onValueChange: (value: string) => void;
}

export function MaskedInput({
  value = "",
  mask,
  onValueChange,
  className,
  ...props
}: MaskedInputProps) {
  return (
    <Input
      {...props}
      value={value}
      className={cn(className)}
      onChange={(e) => onValueChange(mask(e.target.value))}
    />
  );
}
