"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { cn } from "@/lib/utils";

export function MobileChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-primary to-primary-light text-black",
          "shadow-[0_0_30px_var(--primary-glow)]",
          "active:scale-95 transition-all duration-300",
          "hover:shadow-[0_0_40px_var(--primary-glow)] hover:scale-105",
          "md:hidden",
          open && "hidden"
        )}
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* Full Screen Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden" 
            onClick={() => setOpen(false)} 
          />
          
          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col h-[85vh] bg-gradient-to-b from-[var(--ai-panel-bg)] to-[var(--background)] rounded-t-3xl border-t border-[var(--card-border)] shadow-[0_-8px_40px_rgba(0,0,0,0.4)] md:hidden animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex h-12 items-center justify-between px-5 border-b border-[var(--border)]">
              <p className="font-semibold text-text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary drop-shadow-[0_0_8px_var(--primary-glow)]" /> 
                AI Assistant
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-text-tertiary hover:bg-[var(--item-hover)] hover:text-text-primary transition-all active:scale-95"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        </>
      )}
    </>
  );
}
