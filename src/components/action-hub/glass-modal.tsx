"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GlassModal({ open, onClose, title, icon, children, className }: GlassModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md animate-in fade-in duration-300 dark:bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "relative mx-4 w-full max-w-md scale-100 transform overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl backdrop-blur-[var(--glass-blur)] transition-all duration-300 animate-in zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glass-modal-title"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

        <div className="relative z-10 flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            {icon}
            <h2 id="glass-modal-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
          </div>
          <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-[var(--item-hover)] hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 max-h-[min(70vh,600px)] overflow-y-auto px-6 py-5">{children}</div>
        </div>
      </div>,
    document.body
  );
}
