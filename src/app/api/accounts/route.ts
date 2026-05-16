import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/response";
import * as accountsRepo from "@/lib/repositories/accounts";

export async function GET() {
  return withAuth(async (user) => {
    await accountsRepo.deleteTemporaryAccounts(user.id);
    const accounts = await accountsRepo.listAccounts(user.id);
    return { accounts };
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return withAuth(async (user) => {
    if (body.account_name && body.account_number) {
      const account = await accountsRepo.linkManualAccount(user.id, {
        account_name: String(body.account_name),
        account_number: String(body.account_number),
        account_type: body.account_type ? String(body.account_type) : undefined,
        provider: body.provider ? String(body.provider) : undefined,
        currency: body.currency ? String(body.currency) : undefined,
        balance: body.balance != null ? Number(body.balance) : undefined,
        is_primary: Boolean(body.is_primary),
      });
      return { account, linked: true };
    }

    return NextResponse.json(
      { error: "Automatic bank sync is disabled until a real bank adapter is configured. Use Plaid or JustPay linking." },
      { status: 400 }
    );
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Account id required" }, { status: 400 });
  }

  return withAuth(async (user) => {
    const ok = await accountsRepo.deleteAccount(user.id, id);
    if (!ok) {
      return NextResponse.json({ error: "Could not unlink account" }, { status: 500 });
    }
    return { ok: true };
  });
}
