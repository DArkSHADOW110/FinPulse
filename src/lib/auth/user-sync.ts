import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { User } from "@/types/database";

const memoryUsers = new Map<string, User>();

export async function upsertUserFromOAuth(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId?: string;
}): Promise<User | null> {
  const supabase = createAdminClient();

  if (!supabase || !isSupabaseConfigured()) {
    const existing = memoryUsers.get(input.email);
    if (existing) return existing;
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
      google_id: input.googleId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryUsers.set(input.email, user);
    return user;
  }

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", input.email)
    .maybeSingle();

  if (existing) {
    const { data } = await supabase
      .from("users")
      .update({
        name: input.name,
        image: input.image,
        google_id: input.googleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    return data as User;
  }

  const { data } = await supabase
    .from("users")
    .insert({
      email: input.email,
      name: input.name,
      image: input.image,
      google_id: input.googleId,
    })
    .select()
    .single();

  return data as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createAdminClient();

  if (!supabase || !isSupabaseConfigured()) {
    return memoryUsers.get(email) ?? null;
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  return (data as User) ?? null;
}

export function getMemoryUser(email: string) {
  return memoryUsers.get(email);
}
