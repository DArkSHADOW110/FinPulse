import { list, memoryStore, push } from "@/lib/repositories/memory-store";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { ChatMessage } from "@/types/database";

export async function getRecentMessages(
  userId: string,
  limit = 20
): Promise<ChatMessage[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(limit);
    return (data as ChatMessage[]) ?? [];
  }
  return list(memoryStore.chat, userId)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-limit);
}

export async function saveMessage(
  userId: string,
  role: ChatMessage["role"],
  content: string,
  meta?: { toolResults?: unknown }
): Promise<ChatMessage> {
  const row: ChatMessage = {
    id: crypto.randomUUID(),
    user_id: userId,
    role,
    content,
    tool_calls: meta?.toolResults ?? null,
    metadata: meta ?? {},
    created_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("chat_messages")
      .insert(row)
      .select()
      .single();
    return (data as ChatMessage) ?? row;
  }
  return push(memoryStore.chat, userId, row);
}

export async function clearMessages(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
    return !error;
  }
  memoryStore.chat.set(userId, []);
  return true;
}
