import { list, memoryStore, push } from "@/lib/repositories/memory-store";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Jar } from "@/types/database";

function normalizeJar(jar: Jar): Jar {
  const actual = Number(jar.actual_saved ?? jar.balance ?? 0);
  const virtual = Number(jar.virtual_saved ?? 0);
  return {
    ...jar,
    balance: actual + virtual,
    actual_saved: actual,
    virtual_saved: virtual,
    metadata: jar.metadata ?? {},
  };
}

export async function listJars(userId: string): Promise<Jar[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("jars")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Could not list jars: ${error.message}`);
    return ((data as Jar[]) ?? []).map(normalizeJar);
  }
  return list(memoryStore.jars, userId).map(normalizeJar);
}

export async function createJar(
  userId: string,
  input: { name: string; target_amount?: number | null; color?: string; metadata?: Record<string, unknown> }
): Promise<Jar> {
  const row: Jar = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: input.name,
    target_amount: input.target_amount ?? null,
    balance: 0,
    actual_saved: 0,
    virtual_saved: 0,
    color: input.color ?? "#33a1ff",
    icon: "piggy-bank",
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const insert = await supabase
      .from("jars")
      .insert({
        user_id: row.user_id,
        name: row.name,
        target_amount: row.target_amount,
        balance: row.balance,
        actual_saved: row.actual_saved,
        virtual_saved: row.virtual_saved,
        color: row.color,
        icon: row.icon,
        metadata: row.metadata,
      })
      .select()
      .single();
    if (!insert.error && insert.data) return normalizeJar(insert.data as Jar);

    const legacyInsert = await supabase
      .from("jars")
      .insert({
        user_id: row.user_id,
        name: row.name,
        target_amount: row.target_amount,
        balance: row.balance,
        color: row.color,
        icon: row.icon,
      })
      .select()
      .single();
    if (legacyInsert.error) {
      throw new Error(`Could not create jar: ${legacyInsert.error.message || insert.error?.message}`);
    }
    return normalizeJar((legacyInsert.data as Jar) ?? row);
  }
  return push(memoryStore.jars, userId, row);
}

export async function updateJar(
  userId: string,
  jarId: string,
  input: Partial<Pick<Jar, "name" | "target_amount" | "color" | "metadata">>
): Promise<Jar | null> {
  const jars = await listJars(userId);
  const jar = jars.find((j) => j.id === jarId);
  if (!jar) return null;

  const updated = { ...jar, ...input, updated_at: new Date().toISOString() };
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const update = await supabase
      .from("jars")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", jarId)
      .eq("user_id", userId)
      .select()
      .single();
    if (!update.error && update.data) return normalizeJar(update.data as Jar);

    const legacyInput: Partial<Pick<Jar, "name" | "target_amount" | "color">> = {};
    if (input.name !== undefined) legacyInput.name = input.name;
    if (input.target_amount !== undefined) legacyInput.target_amount = input.target_amount;
    if (input.color !== undefined) legacyInput.color = input.color;
    const legacyUpdate = await supabase
      .from("jars")
      .update({ ...legacyInput, updated_at: new Date().toISOString() })
      .eq("id", jarId)
      .eq("user_id", userId)
      .select()
      .single();
    if (legacyUpdate.error) {
      throw new Error(`Could not update jar: ${legacyUpdate.error.message || update.error?.message}`);
    }
    return normalizeJar((legacyUpdate.data as Jar) ?? updated);
  }

  const arr = memoryStore.jars.get(userId) ?? [];
  memoryStore.jars.set(
    userId,
    arr.map((j) => (j.id === jarId ? updated : j))
  );
  return updated;
}

export async function deleteJar(userId: string, jarId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from("jars")
      .delete()
      .eq("id", jarId)
      .eq("user_id", userId);
    if (error) throw new Error(`Could not delete jar: ${error.message}`);
    return !error;
  }
  memoryStore.jars.set(
    userId,
    list(memoryStore.jars, userId).filter((j) => j.id !== jarId)
  );
  return true;
}

export async function fundJar(
  userId: string,
  jarId: string,
  amount: number,
  isVirtual = false
): Promise<Jar | null> {
  const jars = await listJars(userId);
  const jar = jars.find((j) => j.id === jarId);
  if (!jar) return null;

  const newActual = Number(jar.actual_saved ?? jar.balance ?? 0) + (isVirtual ? 0 : amount);
  const newVirtual = Number(jar.virtual_saved ?? 0) + (isVirtual ? amount : 0);
  const newBalance = newActual + newVirtual;
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const update = await supabase
      .from("jars")
      .update({
        balance: newBalance,
        actual_saved: newActual,
        virtual_saved: newVirtual,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jarId)
      .eq("user_id", userId)
      .select()
      .single();
    if (!update.error && update.data) return normalizeJar(update.data as Jar);

    const legacyUpdate = await supabase
      .from("jars")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jarId)
      .eq("user_id", userId)
      .select()
      .single();
    if (legacyUpdate.error) {
      throw new Error(`Could not fund jar: ${legacyUpdate.error.message || update.error?.message}`);
    }
    return normalizeJar((legacyUpdate.data as Jar) ?? { ...jar, balance: newBalance, actual_saved: newActual, virtual_saved: newVirtual });
  }

  const updated = {
    ...jar,
    balance: newBalance,
    actual_saved: newActual,
    virtual_saved: newVirtual,
    updated_at: new Date().toISOString(),
  };
  const arr = memoryStore.jars.get(userId) ?? [];
  memoryStore.jars.set(
    userId,
    arr.map((j) => (j.id === jarId ? updated : j))
  );
  return normalizeJar(updated);
}
