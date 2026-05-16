import { list, memoryStore, push } from "@/lib/repositories/memory-store";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { ScheduledPayment } from "@/types/database";

function computeNextRun(dayOfMonth: number): string {
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, 9, 0, 0);
  if (next <= now) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth, 9, 0, 0);
  }
  return next.toISOString();
}

export async function listScheduledPayments(userId: string): Promise<ScheduledPayment[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("scheduled_payments")
      .select("*")
      .eq("user_id", userId)
      .order("day_of_month", { ascending: true });
    return (data as ScheduledPayment[]) ?? [];
  }
  return list(memoryStore.schedules, userId);
}

export async function createScheduledPayment(
  userId: string,
  input: {
    label: string;
    amount: number;
    day_of_month: number;
    contact_id?: string | null;
    linked_account_id?: string | null;
    currency?: string;
  }
): Promise<ScheduledPayment> {
  const row: ScheduledPayment = {
    id: crypto.randomUUID(),
    user_id: userId,
    contact_id: input.contact_id ?? null,
    linked_account_id: input.linked_account_id ?? null,
    label: input.label,
    amount: input.amount,
    currency: input.currency ?? "LKR",
    day_of_month: input.day_of_month,
    is_active: true,
    last_run_at: null,
    next_run_at: computeNextRun(input.day_of_month),
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("scheduled_payments")
      .insert(row)
      .select()
      .single();
    return (data as ScheduledPayment) ?? row;
  }
  return push(memoryStore.schedules, userId, row);
}

export async function updateScheduledPayment(
  userId: string,
  id: string,
  input: Partial<
    Pick<ScheduledPayment, "label" | "amount" | "day_of_month" | "is_active" | "linked_account_id">
  >
): Promise<ScheduledPayment | null> {
  const updates = {
    ...input,
    updated_at: new Date().toISOString(),
    ...(input.day_of_month !== undefined
      ? { next_run_at: computeNextRun(input.day_of_month) }
      : {}),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("scheduled_payments")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    return (data as ScheduledPayment) ?? null;
  }

  const items = list(memoryStore.schedules, userId);
  const item = items.find((s) => s.id === id);
  if (!item) return null;
  const updated = { ...item, ...updates };
  memoryStore.schedules.set(
    userId,
    items.map((s) => (s.id === id ? updated : s))
  );
  return updated;
}

export async function deleteScheduledPayment(userId: string, id: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from("scheduled_payments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    return !error;
  }
  memoryStore.schedules.set(
    userId,
    list(memoryStore.schedules, userId).filter((s) => s.id !== id)
  );
  return true;
}

export async function getDuePayments(): Promise<ScheduledPayment[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("scheduled_payments")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now);
    return (data as ScheduledPayment[]) ?? [];
  }

  const all: ScheduledPayment[] = [];
  for (const schedules of memoryStore.schedules.values()) {
    all.push(
      ...schedules.filter(
        (s) => s.is_active && s.next_run_at && s.next_run_at <= now
      )
    );
  }
  return all;
}

export async function markPaymentRun(payment: ScheduledPayment) {
  const next = computeNextRun(payment.day_of_month);
  const supabase = createAdminClient();
  const updates = {
    last_run_at: new Date().toISOString(),
    next_run_at: next,
    updated_at: new Date().toISOString(),
  };
  if (supabase && isSupabaseConfigured()) {
    await supabase
      .from("scheduled_payments")
      .update(updates)
      .eq("id", payment.id);
    return;
  }
  const items = memoryStore.schedules.get(payment.user_id) ?? [];
  memoryStore.schedules.set(
    payment.user_id,
    items.map((s) => (s.id === payment.id ? { ...s, ...updates } : s))
  );
}
