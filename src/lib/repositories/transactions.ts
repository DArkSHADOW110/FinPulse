import { list, memoryStore, push } from "@/lib/repositories/memory-store";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Transaction, TransactionType, TransactionStatus } from "@/types/database";

export async function listTransactions(
  userId: string,
  limit = 50
): Promise<Transaction[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(limit);
    return (data as Transaction[]) ?? [];
  }
  return [...list(memoryStore.transactions, userId)]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, limit);
}

export async function createTransaction(
  userId: string,
  input: {
    linked_account_id?: string | null;
    type: TransactionType;
    amount: number;
    currency?: string;
    counterparty?: string | null;
    remark?: string | null;
    category?: string | null;
    status?: TransactionStatus;
  }
): Promise<Transaction> {
  const row: Transaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    linked_account_id: input.linked_account_id ?? null,
    type: input.type,
    amount: input.amount,
    currency: input.currency ?? "LKR",
    counterparty: input.counterparty ?? null,
    remark: input.remark ?? null,
    category: input.category ?? null,
    status: input.status ?? "completed",
    metadata: {},
    occurred_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase.from("transactions").insert(row).select().single();
    return (data as Transaction) ?? row;
  }

  return push(memoryStore.transactions, userId, row);
}

export async function seedDemoTransactions(userId: string, accountId: string) {
  const existing = await listTransactions(userId, 1);
  if (existing.length > 0) return;

  const samples = [
    { type: "debit" as const, amount: 4500, remark: "groceries weekly shop", counterparty: "Cargills" },
    { type: "debit" as const, amount: 12000, remark: "electricity bill march", counterparty: "CEB" },
    { type: "credit" as const, amount: 185000, remark: "salary april", counterparty: "Payroll" },
    { type: "debit" as const, amount: 2500, remark: "ride to office", counterparty: "PickMe" },
  ];

  for (const s of samples) {
    await createTransaction(userId, {
      ...s,
      linked_account_id: accountId,
      category: inferCategory(s.remark),
    });
  }
}

function inferCategory(remark: string): string {
  const r = remark.toLowerCase();
  if (r.includes("grocery") || r.includes("food")) return "Food";
  if (r.includes("bill") || r.includes("electric")) return "Utilities";
  if (r.includes("salary")) return "Income";
  if (r.includes("ride")) return "Transport";
  return "General";
}
