import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/response";
import * as contactsRepo from "@/lib/repositories/contacts";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  return withAuth(async (user) => {
    const contact = await contactsRepo.updateContact(user.id, params.id, body);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return { contact };
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    await contactsRepo.deleteContact(user.id, params.id);
    return { ok: true };
  });
}
