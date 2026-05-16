import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl",
        "border border-[var(--input-border)] bg-[var(--input-bg)]",
        "px-4 py-2 text-sm text-text-primary",
        "placeholder:text-text-tertiary",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--primary-glow)]",
        "hover:border-[var(--border-hover)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
