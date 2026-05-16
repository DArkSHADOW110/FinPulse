import { withAuth } from "@/lib/api/response";
import { getBankingAdapter } from "@/lib/banking";
import * as accountsRepo from "@/lib/repositories/accounts";
import * as transactionsRepo from "@/lib/repositories/transactions";

export async function POST(request: Request) {
  const body = await request.json();
  return withAuth(async (user) => {
    const { from_account_id, to_account_number, amount, remark } = body;
    const account = await accountsRepo.getAccount(user.id, from_account_id);
    if (!account) throw new Error("Account not found");

    const adapter = getBankingAdapter();
    const result = await adapter.transfer({
      fromAccountId: account.external_account_id ?? account.id,
      toAccountNumber: to_account_number,
      amount: Number(amount),
      currency: account.currency,
      remark,
    });

    await transactionsRepo.createTransaction(user.id, {
      linked_account_id: account.id,
      type: "transfer",
      amount: Number(amount),
      currency: account.currency,
      counterparty: to_account_number,
      remark: remark ?? "Transfer",
    });

    return { ...result, sandbox: !adapter.isConfigured() || adapter.provider === "mock" };
  });
}
