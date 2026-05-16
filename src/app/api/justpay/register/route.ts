import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  createRetrievalReference,
  savePendingRegistration,
} from "@/lib/justpay/registrations";

const REQUIRED_FIELDS = ["bank_code", "bank_name", "account_number", "nic", "mobile"] as const;

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json({ error: `${field} required` }, { status: 400 });
    }
  }

  const retrievalReference = createRetrievalReference();
  savePendingRegistration({
    user_id: user.id,
    bank_code: String(body.bank_code),
    bank_name: String(body.bank_name),
    account_number: String(body.account_number),
    nic: String(body.nic),
    mobile: String(body.mobile),
    retrieval_reference: retrievalReference,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    status: "OTP_SENT",
    message: "JustPay registration OTP sent to the provided mobile number.",
    Retrieval_reference: retrievalReference,
    Transaction_Reference: retrievalReference,
  });
}
