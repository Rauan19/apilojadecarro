import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="square" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19 19 15.2 15.2" />
    </svg>
  );
}

function ClearGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="square" aria-hidden>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

export function SearchInput({ value, onChange, containerClassName, className, placeholder, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-sm", containerClassName)}>
      <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Buscar..."}
        className={cn("pl-9 pr-8", className)}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Limpar busca"
        >
          <ClearGlyph className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
