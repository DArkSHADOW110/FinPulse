"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoginThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-[60px] rounded-full glass-card" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-8 w-[60px] rounded-full p-1 transition-all duration-300",
        "bg-gradient-to-r border",
        isDark 
          ? "from-slate-800 to-slate-900 border-[var(--border-hover)]" 
          : "from-white/80 to-slate-100/80 border-slate-300/30 backdrop-blur-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun 
          className={cn(
            "h-3.5 w-3.5 transition-all duration-300",
            isDark ? "text-slate-500 opacity-50" : "text-amber-500 opacity-0"
          )} 
        />
        <Moon 
          className={cn(
            "h-3.5 w-3.5 transition-all duration-300",
            isDark ? "text-cyan-400 opacity-0" : "text-slate-400 opacity-50"
          )} 
        />
      </div>
      
      {/* Sliding thumb */}
      <div
        className={cn(
          "relative h-6 w-6 rounded-full transition-all duration-300",
          "flex items-center justify-center",
          "shadow-[0_2px_8px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)]",
          isDark 
            ? "translate-x-[28px] bg-gradient-to-br from-slate-700 to-slate-800" 
            : "translate-x-0 bg-gradient-to-br from-white to-slate-50",
          "active:scale-95"
        )}
        style={{
          transition: "transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), background 0.3s ease"
        }}
      >
        {isDark ? (
          <Moon 
            className="h-3.5 w-3.5 text-cyan-400 transition-all duration-300"
            style={{ animation: "icon-rotate 0.4s ease-out" }}
          />
        ) : (
          <Sun 
            className="h-3.5 w-3.5 text-amber-500 transition-all duration-300"
            style={{ animation: "icon-rotate 0.4s ease-out" }}
          />
        )}
      </div>
    </button>
  );
}
