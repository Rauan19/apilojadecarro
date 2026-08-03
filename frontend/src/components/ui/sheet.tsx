import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;
}

function useSheetContext() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Componentes de Sheet devem estar dentro de <Sheet>");
  return ctx;
}

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-card border-border shadow-2xl transition-transform duration-300 ease-out",
  {
    variants: {
      side: {
        left: "inset-y-0 left-0 h-full w-3/4 max-w-xs border-r p-6",
        right: "inset-y-0 right-0 h-full w-3/4 max-w-xs border-l p-6",
        top: "inset-x-0 top-0 w-full border-b p-6",
        bottom: "inset-x-0 bottom-0 w-full border-t p-6",
      },
    },
    defaultVariants: {
      side: "left",
    },
  }
);

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {
  closeClassName?: string;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "left", children, closeClassName, ...props }, ref) => {
    const ctx = useSheetContext();

    React.useEffect(() => {
      if (!ctx.open) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") ctx.onOpenChange(false);
      };
      document.addEventListener("keydown", onKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }, [ctx.open, ctx]);

    if (!ctx.open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => ctx.onOpenChange(false)}
          aria-hidden
        />
        <div ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
          <button
            onClick={() => ctx.onOpenChange(false)}
            className={cn(
              "absolute right-4 top-4 rounded-sm opacity-60 transition-opacity hover:opacity-100",
              closeClassName
            )}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 text-left", className)} {...props} />;
}

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("font-display text-lg font-semibold", className)} {...props} />
  )
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
SheetDescription.displayName = "SheetDescription";

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription };
