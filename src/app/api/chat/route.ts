import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { runAgentChat } from "@/lib/groq/agent";
import * as chatRepo from "@/lib/repositories/chat";
import { withAuth } from "@/lib/api/response";

export async function GET() {
  return withAuth(async (user) => {
    const messages = await chatRepo.getRecentMessages(user.id, 50);
    return {
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    };
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  try {
    const result = await runAgentChat(user, message);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  return withAuth(async (user) => {
    await chatRepo.clearMessages(user.id);
    return { ok: true };
  });
}
