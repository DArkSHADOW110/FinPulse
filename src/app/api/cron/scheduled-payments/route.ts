import { NextResponse } from "next/server";
import { getBankingAdapter } from "@/lib/banking";
import * as accountsRepo from "@/lib/repositories/accounts";
import * as contactsRepo from "@/lib/repositories/contacts";
import * as schedulesRepo from "@/lib/repositories/scheduled-payments";
import * as transactionsRepo from "@/lib/repositories/transactions";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await schedulesRepo.getDuePayments();
  const adapter = getBankingAdapter();
  const processed: string[] = [];

  for (const payment of due) {
    const accounts = await accountsRepo.listAccounts(payment.user_id);
    const account =
      accounts.find((a) => a.id === payment.linked_account_id) ?? accounts[0];
    if (!account) continue;

    let biller =
      (payment.metadata as { biller_account?: string })?.biller_account ??
      payment.label;

    if (payment.contact_id) {
      const contacts = await contactsRepo.listContacts(payment.user_id);
      const contact = contacts.find((c) => c.id === payment.contact_id);
      if (contact) biller = contact.account_number;
    }

    await adapter.payBill({
      fromAccountId: account.external_account_id ?? account.id,
      billerAccount: biller,
      amount: Number(payment.amount),
      currency: payment.currency,
      reference: `SCHED-${payment.id}`,
    });

    await transactionsRepo.createTransaction(payment.user_id, {
      linked_account_id: account.id,
      type: "bill",
      amount: Number(payment.amount),
      currency: payment.currency,
      counterparty: biller,
      remark: `Scheduled: ${payment.label}`,
    });

    await schedulesRepo.markPaymentRun(payment);
    processed.push(payment.id);
  }

  return NextResponse.json({ processed: processed.length, ids: processed });
}
