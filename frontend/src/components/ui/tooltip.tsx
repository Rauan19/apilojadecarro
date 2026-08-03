import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("Componentes de Tooltip devem estar dentro de <Tooltip>");
  return ctx;
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>{children}</TooltipContext.Provider>
  );
}

function TooltipTrigger({ children, asChild }: { children: React.ReactElement<any>; asChild?: boolean }) {
  const ctx = useTooltipContext();
  void asChild;
  return React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      ctx.triggerRef.current = node;
      const { ref } = children as any;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      ctx.setOpen(true);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      ctx.setOpen(false);
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      ctx.setOpen(true);
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      ctx.setOpen(false);
    },
  });
}

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = useTooltipContext();
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

    React.useLayoutEffect(() => {
      if (!ctx.open || !ctx.triggerRef.current) return;
      const rect = ctx.triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }, [ctx.open, ctx.triggerRef]);

    if (!ctx.open || !pos) return null;

    return createPortal(
      <div
        ref={ref}
        style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
        className={cn(
          "z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md animate-fade-in pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
