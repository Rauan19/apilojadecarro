import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="square" aria-hidden>
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

interface SelectContextValue {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  labels: Record<string, string>;
  registerLabel: (value: string, label: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Componentes de Select devem estar dentro de <Select>");
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const handleChange = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  const registerLabel = React.useCallback((val: string, label: string) => {
    setLabels((prev) => (prev[val] === label ? prev : { ...prev, [val]: label }));
  }, []);

  return (
    <SelectContext.Provider
      value={{ value: current, onValueChange: handleChange, open, setOpen, triggerRef, labels, registerLabel }}
    >
      {children}
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, disabled, onClick, ...props }, forwardedRef) => {
    const ctx = useSelectContext();
    return (
      <button
        type="button"
        ref={(node) => {
          ctx.triggerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          ctx.setOpen(!ctx.open);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", ctx.open && "rotate-180")} />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useSelectContext();
  const label = ctx.value ? ctx.labels[ctx.value] : undefined;
  return (
    <span className={cn(!label && "text-muted-foreground")}>{label ?? placeholder ?? "Selecione..."}</span>
  );
}

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, forwardedRef) => {
    const ctx = useSelectContext();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

    React.useLayoutEffect(() => {
      if (!ctx.open || !ctx.triggerRef.current) return;
      const rect = ctx.triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }, [ctx.open, ctx.triggerRef]);

    React.useEffect(() => {
      if (!ctx.open) return;
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Node;
        if (contentRef.current?.contains(target)) return;
        if (ctx.triggerRef.current?.contains(target)) return;
        ctx.setOpen(false);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          ctx.setOpen(false);
        }
      };
      const onScroll = (e: Event) => {
        if (contentRef.current?.contains(e.target as Node)) return;
        ctx.setOpen(false);
      };
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onScroll);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onScroll);
      };
    }, [ctx.open, ctx.setOpen, ctx.triggerRef]);

    return createPortal(
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        style={{
          position: "fixed",
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          width: pos?.width,
          display: ctx.open ? "block" : "none",
          pointerEvents: ctx.open ? "auto" : "none",
        }}
        className={cn(
          "z-[100] max-h-64 overflow-auto border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-fade-in",
          className
        )}
        onPointerDown={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen, registerLabel } = useSelectContext();
    const selected = selectedValue === value;
    const labelText = getNodeText(children);

    React.useEffect(() => {
      if (labelText) registerLabel(value, labelText);
    }, [value, labelText, registerLabel]);

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={selected}
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onValueChange(value);
          setOpen(false);
        }}
        className={cn(
          "relative flex cursor-pointer select-none items-center justify-between gap-2 px-2 py-1.5 text-sm outline-none transition-colors hover:bg-secondary focus:bg-secondary",
          selected && "font-medium",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        {children}
        {selected && <Check className="h-4 w-4 text-primary" />}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
