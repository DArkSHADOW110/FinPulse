import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getUserByEmail } from "@/lib/auth/user-sync";
import type { User } from "@/types/database";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  return session;
}

export async function requireUser(): Promise<User | null> {
  const session = await requireSession();
  if (!session?.user?.email) return null;
  return getUserByEmail(session.user.email);
}
