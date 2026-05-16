import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as accountsRepo from "@/lib/repositories/accounts";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const publicToken = String(body.public_token ?? "");
  if (!publicToken) {
    return NextResponse.json({ error: "public_token required" }, { status: 400 });
  }

  const institutionName = String(body.institution_name ?? "Plaid Institution");
  const accountMask = String(body.account_mask ?? "92*****193");
  const account = await accountsRepo.linkTokenizedJustPayAccount(user.id, {
    provider: institutionName,
    bank_code: "PLAID",
    account_mask: accountMask,
    account_token: `plaid-access-token-${crypto.randomUUID()}`,
    retrieval_reference: `PLAID-${Date.now()}`,
    account_name: `${institutionName} Linked Account`,
    account_type: "plaid",
    currency: "LKR",
  });

  return NextResponse.json({
    status: "SUCCESS",
    account,
    access_token: account.external_account_id,
  });
}
