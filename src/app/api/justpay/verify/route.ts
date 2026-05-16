import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  consumePendingRegistration,
  createAccountToken,
  maskAccountNumber,
} from "@/lib/justpay/registrations";
import * as accountsRepo from "@/lib/repositories/accounts";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const retrievalReference = String(body.Retrieval_reference ?? body.retrieval_reference ?? "");
  const otp = String(body.OTP ?? body.otp ?? "");

  if (!retrievalReference) {
    return NextResponse.json({ error: "Retrieval_reference required" }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(otp)) {
    return NextResponse.json({ error: "Valid 4-6 digit OTP required" }, { status: 400 });
  }

  const pending = consumePendingRegistration(retrievalReference);
  if (!pending || pending.user_id !== user.id) {
    return NextResponse.json({ error: "Registration reference expired or not found" }, { status: 404 });
  }

  const accountMask = maskAccountNumber(pending.account_number);
  const accountToken = createAccountToken(retrievalReference);
  const account = await accountsRepo.linkTokenizedJustPayAccount(user.id, {
    provider: pending.bank_name,
    bank_code: pending.bank_code,
    account_mask: accountMask,
    account_token: accountToken,
    retrieval_reference: retrievalReference,
    account_name: `${pending.bank_name} JustPay`,
  });

  return NextResponse.json({
    status: "SUCCESS",
    message: "JustPay account verified and linked.",
    Retrieval_reference: retrievalReference,
    Account_mask: accountMask,
    Account_token: accountToken,
    account,
  });
}
