import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";

export async function withAuth<T>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof requireUser>>>) => Promise<T>
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await handler(user);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
