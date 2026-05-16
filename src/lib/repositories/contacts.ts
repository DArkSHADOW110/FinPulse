import { list, memoryStore, push } from "@/lib/repositories/memory-store";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Contact, ContactType } from "@/types/database";

export async function listContacts(userId: string): Promise<Contact[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .order("label", { ascending: true });
    return (data as Contact[]) ?? [];
  }
  return list(memoryStore.contacts, userId);
}

export async function createContact(
  userId: string,
  input: {
    label: string;
    contact_type: ContactType;
    account_number: string;
    bank_code?: string | null;
    provider?: string | null;
  }
): Promise<Contact> {
  const row: Contact = {
    id: crypto.randomUUID(),
    user_id: userId,
    label: input.label,
    contact_type: input.contact_type,
    account_number: input.account_number,
    bank_code: input.bank_code ?? null,
    provider: input.provider ?? null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase.from("contacts").insert(row).select().single();
    return (data as Contact) ?? row;
  }
  return push(memoryStore.contacts, userId, row);
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: Partial<Pick<Contact, "label" | "contact_type" | "account_number" | "bank_code" | "provider">>
): Promise<Contact | null> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase
      .from("contacts")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("user_id", userId)
      .select()
      .single();
    return (data as Contact) ?? null;
  }

  const contacts = list(memoryStore.contacts, userId);
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return null;
  const updated = { ...contact, ...input, updated_at: new Date().toISOString() };
  memoryStore.contacts.set(
    userId,
    contacts.map((c) => (c.id === contactId ? updated : c))
  );
  return updated;
}

export async function deleteContact(userId: string, contactId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("user_id", userId);
    return !error;
  }
  memoryStore.contacts.set(
    userId,
    list(memoryStore.contacts, userId).filter((c) => c.id !== contactId)
  );
  return true;
}
