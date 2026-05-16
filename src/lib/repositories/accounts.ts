import { getBankingAdapter } from "@/lib/banking";
import { list, memoryStore, push } from "@/lib/repositories/memory-store";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { LinkedAccount } from "@/types/database";

export async function listAccounts(userId: string): Promise<LinkedAccount[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("linked_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return ((data as LinkedAccount[]) ?? []).filter((account) => account.provider !== "mock");
  }
  return list(memoryStore.accounts, userId).filter((account) => account.provider !== "mock");
}

export async function getAccount(
  userId: string,
  accountId: string
): Promise<LinkedAccount | null> {
  const accounts = await listAccounts(userId);
  return accounts.find((a) => a.id === accountId) ?? null;
}

export async function deleteAccount(userId: string, accountId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from("linked_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", userId);
    return !error;
  }

  memoryStore.accounts.set(
    userId,
    list(memoryStore.accounts, userId).filter((account) => account.id !== accountId)
  );
  return true;
}

export async function deleteTemporaryAccounts(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from("linked_accounts")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "mock");
    return !error;
  }

  memoryStore.accounts.set(
    userId,
    list(memoryStore.accounts, userId).filter((account) => account.provider !== "mock")
  );
  return true;
}

export async function syncAccountsFromBank(
  userId: string,
  userExternalId: string
): Promise<LinkedAccount[]> {
  const adapter = getBankingAdapter();
  const summaries = await adapter.listAccounts(userExternalId);
  const supabase = createAdminClient();
  const results: LinkedAccount[] = [];

  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];
    const row: LinkedAccount = {
      id: crypto.randomUUID(),
      user_id: userId,
      provider: adapter.provider,
      external_account_id: summary.externalId,
      account_name: summary.accountName,
      account_number: summary.accountNumber,
      account_type: summary.accountType,
      currency: summary.currency,
      balance: summary.balance,
      is_primary: i === 0,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase && isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from("linked_accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("account_number", row.account_number)
        .maybeSingle();

      if (existing) {
        const { data } = await supabase
          .from("linked_accounts")
          .update({
            balance: row.balance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (data) results.push(data as LinkedAccount);
      } else {
        const { data } = await supabase
          .from("linked_accounts")
          .insert({
            user_id: userId,
            provider: row.provider,
            external_account_id: row.external_account_id,
            account_name: row.account_name,
            account_number: row.account_number,
            account_type: row.account_type,
            currency: row.currency,
            balance: row.balance,
            is_primary: row.is_primary,
          })
          .select()
          .single();
        if (data) results.push(data as LinkedAccount);
      }
    } else {
      const existing = list(memoryStore.accounts, userId);
      const dup = existing.find((a) => a.account_number === row.account_number);
      if (!dup) push(memoryStore.accounts, userId, row);
      results.push(dup ?? row);
    }
  }

  return results.length ? results : listAccounts(userId);
}

export async function ensureDemoAccounts(userId: string, externalId: string) {
  const current = await listAccounts(userId);
  if (current.length > 0) return current;
  return syncAccountsFromBank(userId, externalId);
}

export async function linkManualAccount(
  userId: string,
  input: {
    account_name: string;
    account_number: string;
    account_type?: string;
    provider?: string;
    currency?: string;
    balance?: number;
    is_primary?: boolean;
  }
): Promise<LinkedAccount> {
  const existing = await listAccounts(userId);
  const row: LinkedAccount = {
    id: crypto.randomUUID(),
    user_id: userId,
    provider: input.provider ?? "seylan",
    external_account_id: null,
    account_name: input.account_name,
    account_number: input.account_number,
    account_type: input.account_type ?? "checking",
    currency: input.currency ?? "LKR",
    balance: input.balance ?? 0,
    is_primary: input.is_primary ?? existing.length === 0,
    metadata: { manual: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    if (row.is_primary) {
      await supabase
        .from("linked_accounts")
        .update({ is_primary: false })
        .eq("user_id", userId);
    }
    const { data } = await supabase
      .from("linked_accounts")
      .insert({
        user_id: userId,
        provider: row.provider,
        account_name: row.account_name,
        account_number: row.account_number,
        account_type: row.account_type,
        currency: row.currency,
        balance: row.balance,
        is_primary: row.is_primary,
        metadata: row.metadata,
      })
      .select()
      .single();
    return (data as LinkedAccount) ?? row;
  }

  if (row.is_primary) {
    const accounts = list(memoryStore.accounts, userId).map((a) => ({
      ...a,
      is_primary: false,
    }));
    memoryStore.accounts.set(userId, accounts);
  }
  return push(memoryStore.accounts, userId, row);
}

export async function linkTokenizedJustPayAccount(
  userId: string,
  input: {
    provider: string;
    bank_code: string;
    account_mask: string;
    account_token: string;
    retrieval_reference: string;
    account_name?: string;
    account_type?: string;
    currency?: string;
    balance?: number;
  }
): Promise<LinkedAccount> {
  const existing = await listAccounts(userId);
  const row: LinkedAccount = {
    id: crypto.randomUUID(),
    user_id: userId,
    provider: input.provider,
    external_account_id: input.account_token,
    account_name: input.account_name ?? `${input.provider} JustPay`,
    account_number: input.account_mask,
    account_type: input.account_type ?? "justpay",
    currency: input.currency ?? "LKR",
    balance: input.balance ?? 0,
    is_primary: existing.length === 0,
    metadata: {
      justpay: true,
      bank_code: input.bank_code,
      account_mask: input.account_mask,
      retrieval_reference: input.retrieval_reference,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    if (row.is_primary) {
      await supabase
        .from("linked_accounts")
        .update({ is_primary: false })
        .eq("user_id", userId);
    }
    const { data } = await supabase
      .from("linked_accounts")
      .insert({
        user_id: row.user_id,
        provider: row.provider,
        external_account_id: row.external_account_id,
        account_name: row.account_name,
        account_number: row.account_number,
        account_type: row.account_type,
        currency: row.currency,
        balance: row.balance,
        is_primary: row.is_primary,
        metadata: row.metadata,
      })
      .select()
      .single();
    return (data as LinkedAccount) ?? row;
  }

  if (row.is_primary) {
    const accounts = list(memoryStore.accounts, userId).map((a) => ({
      ...a,
      is_primary: false,
    }));
    memoryStore.accounts.set(userId, accounts);
  }
  return push(memoryStore.accounts, userId, row);
}
