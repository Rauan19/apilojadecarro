import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Spinner desenhado à mão (arco girando) — no lugar do ícone padrão de
 * "carregando" que toda biblioteca de ícone genérica usa. */
function ButtonSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("animate-spin", className)} aria-hidden>
      <path
        d="M12 3.5a8.5 8.5 0 1 1-6.01 2.49"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="square"
      />
    </svg>
  );
}

// Botão com silhueta chanfrada (btn-shape) e aresta 3D na base (btn-3d):
// no clique ele desce e a aresta some, como um botão físico sendo pressionado.
const buttonVariants = cva(
  "btn-shape relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold tracking-tight disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "btn-3d bg-primary text-primary-foreground hover:brightness-110",
        destructive: "btn-3d bg-destructive text-destructive-foreground hover:brightness-110",
        outline: "btn-3d btn-3d-soft border border-input bg-background text-foreground hover:bg-secondary",
        secondary: "btn-3d btn-3d-soft bg-secondary text-secondary-foreground hover:brightness-95",
        ghost: "transition-colors hover:bg-secondary hover:text-secondary-foreground active:translate-y-px",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size, className }), child.props.className),
        ref,
        ...props,
      });
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <ButtonSpinner />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
