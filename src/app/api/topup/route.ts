import { withAuth } from "@/lib/api/response";
import { getBankingAdapter } from "@/lib/banking";
import * as accountsRepo from "@/lib/repositories/accounts";
import * as transactionsRepo from "@/lib/repositories/transactions";

export async function POST(request: Request) {
  const body = await request.json();
  return withAuth(async (user) => {
    const fromId = String(body.from_account_id);
    const mobileNumber = String(body.mobile_number);
    const amount = Number(body.amount);
    const provider = body.provider ? String(body.provider) : undefined;

    const account = await accountsRepo.getAccount(user.id, fromId);
    if (!account) {
      throw new Error("Account not found");
    }

    const adapter = getBankingAdapter();
    const result = await adapter.mobileTopup({
      fromAccountId: account.external_account_id ?? account.id,
      mobileNumber,
      amount,
      currency: account.currency,
      provider,
    });

    await transactionsRepo.createTransaction(user.id, {
      linked_account_id: account.id,
      type: "topup",
      amount,
      currency: account.currency,
      counterparty: mobileNumber,
      remark: body.remark ? String(body.remark) : `Mobile top-up${provider ? ` (${provider})` : ""}`,
      status: "completed",
    });

    return { ...result, amount, mobile_number: mobileNumber };
  });
}
