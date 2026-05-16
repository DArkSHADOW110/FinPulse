import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/response";
import * as jarsRepo from "@/lib/repositories/jars";
import * as transactionsRepo from "@/lib/repositories/transactions";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  return withAuth(async (user) => {
    if (body.fund_amount) {
      const jar = await jarsRepo.fundJar(
        user.id,
        params.id,
        Number(body.fund_amount),
        Boolean(body.is_virtual)
      );
      if (!jar) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (!body.is_virtual) {
        const transaction = await transactionsRepo.createTransaction(user.id, {
          linked_account_id: null,
          type: "debit",
          amount: Number(body.fund_amount),
          currency: "LKR",
          counterparty: jar.name,
          remark: `Jar deposit: ${jar.name}`,
          category: "Savings",
          status: "completed",
        });
        return { ok: true, jar, transaction };
      }
      return { ok: true, jar };
    }
    const jar = await jarsRepo.updateJar(user.id, params.id, body);
    if (!jar) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return { jar };
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    await jarsRepo.deleteJar(user.id, params.id);
    return { ok: true };
  });
}
