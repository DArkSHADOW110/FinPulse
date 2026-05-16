"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowBorder?: boolean;
  hoverEffect?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  glowBorder = false,
  hoverEffect = true 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl backdrop-blur-[24px]",
        "bg-[var(--card)]",
        "border border-[var(--card-border)]",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.3)]",
        "transition-all duration-300",
        hoverEffect && "hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)]",
        glowBorder && "shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.3),0_0_40px_var(--cyber-cyan-glow)]",
        className
      )}
    >
      {/* Gradient border overlay for glow effect */}
      {glowBorder && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, var(--cyber-cyan-glow) 0%, transparent 50%, var(--cyber-cyan-glow) 100%)",
            opacity: 0.3,
            padding: "1px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      )}
      {children}
    </div>
  );
}
