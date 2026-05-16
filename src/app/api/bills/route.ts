import { withAuth } from "@/lib/api/response";
import { getBankingAdapter } from "@/lib/banking";
import * as accountsRepo from "@/lib/repositories/accounts";
import * as transactionsRepo from "@/lib/repositories/transactions";

export async function POST(request: Request) {
  const body = await request.json();
  return withAuth(async (user) => {
    const { from_account_id, biller_account, amount, reference } = body;
    const account = await accountsRepo.getAccount(user.id, from_account_id);
    if (!account) throw new Error("Account not found");

    const adapter = getBankingAdapter();
    const result = await adapter.payBill({
      fromAccountId: account.external_account_id ?? account.id,
      billerAccount: biller_account,
      amount: Number(amount),
      currency: account.currency,
      reference,
    });

    await transactionsRepo.createTransaction(user.id, {
      linked_account_id: account.id,
      type: "bill",
      amount: Number(amount),
      currency: account.currency,
      counterparty: biller_account,
      remark: reference ?? "Bill payment",
    });

    return { ...result, sandbox: adapter.provider === "mock" };
  });
}
