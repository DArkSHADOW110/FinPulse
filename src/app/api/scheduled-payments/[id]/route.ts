import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/response";
import * as schedulesRepo from "@/lib/repositories/scheduled-payments";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  return withAuth(async (user) => {
    const scheduled_payment = await schedulesRepo.updateScheduledPayment(
      user.id,
      params.id,
      body
    );
    if (!scheduled_payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return { scheduled_payment };
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    await schedulesRepo.deleteScheduledPayment(user.id, params.id);
    return { ok: true };
  });
}
