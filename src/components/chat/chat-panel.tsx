"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ActionHubUiAction,
  useActionHubController,
} from "@/components/action-hub/action-hub-controller";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type PendingChatAction = {
  label: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  successMessage: string;
};

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm your FinPulse assistant. I can help with transfers, bills, mobile top-up, jars, contacts, schedules, and spending insights. What would you like to do?",
};

function notifyDataChanged(detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("finpulse:data-refresh", { detail }));
  window.setTimeout(() => window.dispatchEvent(new CustomEvent("finpulse:data-refresh", { detail })), 300);
}

export function ChatPanel() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { executeAction } = useActionHubController();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingChatAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        const history = (d.messages ?? []) as Message[];
        if (history.length > 0) setMessages(history);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    if (pendingAction && /^(yes|y|confirm|ok|okay|execute|proceed)$/i.test(text)) {
      await executePendingAction(pendingAction);
      return;
    }

    if (pendingAction && /^(no|n|cancel|stop)$/i.test(text)) {
      setPendingAction(null);
      setMessages((m) => [...m, { role: "assistant", content: "Cancelled. I did not execute that action." }]);
      return;
    }

    if (pendingAction) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Please reply "yes" to confirm or "no" to cancel this pending action:\n${pendingAction.label}`,
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      handleToolResults(data.toolResults);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function executePendingAction(action: PendingChatAction) {
    setLoading(true);
    setPendingAction(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(action.path, {
        method: action.method,
        headers: action.body ? { "Content-Type": "application/json" } : undefined,
        body: action.body ? JSON.stringify(action.body) : undefined,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      notifyDataChanged(data);
      setMessages((m) => [...m, { role: "assistant", content: action.successMessage }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error && e.name === "AbortError"
              ? "The action took too long and was cancelled. Please try again."
              : e instanceof Error
                ? e.message
                : "Could not execute the confirmed action.",
        },
      ]);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (loading) return;
    const shouldClear = window.confirm("Clear all AI chat history?");
    if (!shouldClear) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not clear chat history.");
      setPendingAction(null);
      setMessages([WELCOME]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Could not clear chat history.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleToolResults(toolResults: unknown) {
    if (!Array.isArray(toolResults)) return;
    for (const item of toolResults) {
      try {
        const result =
          item && typeof item === "object" && "result" in item
            ? (item as { result?: unknown }).result
            : null;
        if (!result || typeof result !== "object") continue;
        if ("confirmAction" in result) {
          const confirmAction = (result as { confirmAction?: unknown }).confirmAction;
          if (confirmAction && typeof confirmAction === "object") {
            const action = confirmAction as Partial<PendingChatAction>;
            if (
              typeof action.label === "string" &&
              (action.method === "POST" || action.method === "PATCH" || action.method === "DELETE") &&
              typeof action.path === "string" &&
              typeof action.successMessage === "string"
            ) {
              setPendingAction({
                label: action.label,
                method: action.method,
                path: action.path,
                body: action.body,
                successMessage: action.successMessage,
              });
            }
          }
        }
        const status = "status" in result ? (result as { status?: unknown }).status : null;
        const detail =
          "jar" in result && typeof (result as { jar?: unknown }).jar === "object"
            ? { jar: (result as { jar?: unknown }).jar }
            : undefined;
        if (
          status === "CONTACT_SAVED" ||
          status === "CONTACT_UPDATED" ||
          status === "JAR_CREATED" ||
          status === "JAR_FUNDED" ||
          status === "SCHEDULE_CREATED"
        ) {
          notifyDataChanged(detail);
        }
        if (!("uiAction" in result)) continue;
        const uiAction = (result as { uiAction?: unknown }).uiAction;
        if (!uiAction || typeof uiAction !== "object" || !("type" in uiAction)) continue;
        const action = uiAction as { type?: string; payload?: Record<string, unknown> };

        if (action.type === "toggle_theme") {
          const mode = action.payload?.mode;
          if (mode === "light" || mode === "dark") setTheme(mode);
          continue;
        }

        if (action.type === "open_send_modal") {
          router.push("/dashboard");
          executeAction({
            type: "open_send_modal",
            payload: {
              amount:
                typeof action.payload?.amount === "number"
                  ? action.payload.amount
                  : undefined,
              recipient:
                typeof action.payload?.recipient === "string"
                  ? action.payload.recipient
                  : undefined,
            },
          } satisfies ActionHubUiAction);
          continue;
        }

        if (action.type === "open_bill_modal") {
          router.push("/dashboard");
          executeAction({
            type: "open_bill_modal",
            payload: {
              amount:
                typeof action.payload?.amount === "number"
                  ? action.payload.amount
                  : undefined,
              billerName:
                typeof action.payload?.billerName === "string"
                  ? action.payload.billerName
                  : undefined,
            },
          } satisfies ActionHubUiAction);
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "I completed the request, but could not update the interface automatically.",
          },
        ]);
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-[0_0_20px_var(--primary-glow)]">
              <Sparkles className="h-5 w-5 text-black" />
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-xl bg-primary/30 animate-pulse-glow" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">AI Assistant</p>
              <p className="text-[0.6875rem] text-text-tertiary">Powered by Groq</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearHistory}
            disabled={loading || !historyLoaded}
            className="rounded-lg border border-[var(--border)] bg-[var(--item-hover)] p-2 text-text-tertiary transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear AI chat history"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {!historyLoaded && (
          <p className="text-xs text-text-tertiary animate-pulse">Loading chat history...</p>
        )}
        {messages.map((m, i) => (
          <ChatMessageRow key={i} message={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-text-tertiary">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs">Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-2 p-1 pl-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-full transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-[var(--primary-glow)]">
          <input
            placeholder="Ask me to transfer, pay a bill, or check jars..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-gradient-to-br from-primary to-primary-light text-black",
              "shadow-[0_0_12px_var(--primary-glow)]",
              "transition-all duration-200",
              "hover:scale-105 hover:shadow-[0_0_20px_var(--primary-glow)]",
              "disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessageRow({ message: m }: { message: Message }) {
  const isUser = m.role === "user";
  
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--icon-bg)] border border-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-[var(--ai-user-bubble)] text-[var(--ai-user-bubble-text)] rounded-br-sm"
            : "bg-[var(--ai-assistant-bubble)] border border-[var(--ai-assistant-bubble-border)] text-text-primary rounded-bl-sm"
        )}
      >
        {m.content}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--input-bg)] border border-[var(--border)]">
          <User className="h-4 w-4 text-text-tertiary" />
        </div>
      )}
    </div>
  );
}
