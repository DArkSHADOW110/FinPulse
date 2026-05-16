import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-light text-black font-semibold shadow-[0_0_20px_var(--primary-glow)] hover:shadow-[0_0_30px_var(--primary-glow)] hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-[var(--input-bg)] text-text-primary border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)]",
        ghost: "text-text-secondary hover:bg-[var(--item-hover)] hover:text-text-primary",
        outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--item-hover)] hover:border-[var(--border-hover)] text-text-primary",
        destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-[0_0_20px_rgba(255,77,106,0.3)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
