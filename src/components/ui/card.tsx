import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-xl backdrop-blur-[24px]",
        "bg-[var(--card)] border border-[var(--card-border)]",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.3)]",
        "transition-all duration-300",
        "hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-text-primary", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-text-tertiary mt-1", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-3", className)} {...props} />;
}

// Hero card variant with glow effect
export function HeroCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-xl backdrop-blur-[24px] overflow-hidden",
        "bg-[var(--card)] border border-[var(--border)]",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_40px_var(--cyber-cyan-glow),0_8px_32px_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    >
      {/* Geometric pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg, transparent 40%, var(--cyber-cyan-glow) 100%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.02) 20px,
              rgba(255,255,255,0.02) 40px
            )
          `
        }}
      />
      {props.children}
    </div>
  );
}
