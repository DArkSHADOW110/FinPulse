import * as accountsRepo from "@/lib/repositories/accounts";
import * as contactsRepo from "@/lib/repositories/contacts";
import * as jarsRepo from "@/lib/repositories/jars";
import * as schedulesRepo from "@/lib/repositories/scheduled-payments";
import * as transactionsRepo from "@/lib/repositories/transactions";
import { validateToolArguments } from "@/lib/groq/tool-args";
import type { Contact, Jar, LinkedAccount, Transaction, User } from "@/types/database";

function formatAccount(account: Awaited<ReturnType<typeof accountsRepo.listAccounts>>[number]) {
  return {
    id: account.id,
    name: account.account_name,
    provider: account.provider,
    mask: account.account_number,
    balance: Number(account.balance),
    currency: account.currency,
    isPrimary: account.is_primary,
  };
}

function withinDays(transaction: Transaction, days: number) {
  const timestamp = new Date(transaction.occurred_at || transaction.created_at).getTime();
  return timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function matchByName<T extends { name?: string; label?: string }>(items: T[], name: string) {
  const needle = normalizeText(name);
  return (
    items.find((item) => normalizeText(item.label ?? item.name ?? "") === needle) ??
    items.find((item) => normalizeText(item.label ?? item.name ?? "").includes(needle))
  );
}

function primaryAccount(accounts: LinkedAccount[], requestedId?: unknown) {
  const id = typeof requestedId === "string" ? requestedId : "";
  return accounts.find((account) => account.id === id) ?? accounts.find((account) => account.is_primary) ?? accounts[0];
}

function confirmationAction(input: {
  label: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  successMessage: string;
}) {
  return {
    confirmationRequired: true,
    prompt: `${input.label}\n\nReply "yes" to confirm or "no" to cancel.`,
    confirmAction: input,
  };
}

function summarizeTransaction(transaction: Transaction, accountName?: string) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    counterparty: transaction.counterparty,
    remark: transaction.remark,
    category: transaction.category ?? "Uncategorized",
    account: accountName ?? transaction.linked_account_id ?? "Unknown",
    status: transaction.status,
    occurred_at: transaction.occurred_at,
  };
}

function filterTransactionsByRange(
  transactions: Transaction[],
  input: { days?: unknown; fromDate?: unknown; toDate?: unknown }
) {
  const now = Date.now();
  const from =
    typeof input.fromDate === "string" && input.fromDate
      ? new Date(input.fromDate).getTime()
      : Number.isFinite(Number(input.days))
        ? now - Number(input.days) * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000;
  const to =
    typeof input.toDate === "string" && input.toDate ? new Date(input.toDate).getTime() : now;

  return transactions.filter((transaction) => {
    const timestamp = new Date(transaction.occurred_at || transaction.created_at).getTime();
    return timestamp >= from && timestamp <= to;
  });
}

function groupTotals(
  transactions: Array<ReturnType<typeof summarizeTransaction>>,
  groupBy: "none" | "category" | "account" | "type"
) {
  if (groupBy === "none") return [];
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    const key = String(transaction[groupBy] ?? "Unknown");
    totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
  }
  return Array.from(totals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function executeAgentTool(
  user: User,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const validation = validateToolArguments(name, args);
  if (!validation.ok) {
    return { error: `Invalid tool arguments: ${validation.error}` };
  }
  const parsed = validation.data;

  switch (name) {
    case "get_account_balance": {
      const accounts = await accountsRepo.listAccounts(user.id);
      const accountId = parsed.accountId ? String(parsed.accountId) : "";
      if (accountId) {
        const account = accounts.find((a) => a.id === accountId);
        return account ? formatAccount(account) : { error: "Account not found" };
      }
      return {
        accounts: accounts.map(formatAccount),
        totalBalance: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
        currency: accounts[0]?.currency ?? "LKR",
      };
    }
    case "get_recent_transactions": {
      const days = Number(parsed.days);
      const txs = (await transactionsRepo.listTransactions(user.id, 100))
        .filter((transaction) => withinDays(transaction, days))
        .map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          currency: transaction.currency,
          counterparty: transaction.counterparty,
          remark: transaction.remark,
          category: transaction.category,
          occurred_at: transaction.occurred_at,
        }));
      return { days, transactions: txs };
    }
    case "initiate_transfer": {
      const amount = Number(parsed.amount);
      const recipient = String(parsed.recipient).trim();
      if (!recipient || amount <= 0) {
        return { error: "Transfer requires a positive amount and recipient." };
      }
      return {
        uiAction: {
          type: "open_send_modal",
          payload: { amount, recipient },
        },
        status: "READY_FOR_USER_CONFIRMATION",
      };
    }
    case "pay_bill": {
      const amount = Number(parsed.amount);
      const billerName = String(parsed.billerName).trim();
      if (!billerName || amount <= 0) {
        return { error: "Bill payment requires a biller name and positive amount." };
      }
      return {
        uiAction: {
          type: "open_bill_modal",
          payload: { billerName, amount },
        },
        status: "READY_FOR_USER_CONFIRMATION",
      };
    }
    case "toggle_theme": {
      return {
        uiAction: {
          type: "toggle_theme",
          payload: { mode: parsed.mode },
        },
        status: "THEME_CHANGE_REQUESTED",
      };
    }
    case "execute_transfer": {
      const amount = Number(parsed.amount);
      const contacts = await contactsRepo.listContacts(user.id);
      const accounts = await accountsRepo.listAccounts(user.id);
      const account = primaryAccount(accounts, parsed.fromAccountId);
      if (!account) return { error: "No linked account is available to send money from." };

      const recipientName = typeof parsed.recipientName === "string" ? parsed.recipientName : "";
      const directAccount = typeof parsed.accountNumber === "string" ? parsed.accountNumber.trim() : "";
      const contact = recipientName
        ? matchByName(
            contacts.filter((item) => item.contact_type === "bank"),
            recipientName
          )
        : undefined;
      const toAccountNumber = directAccount || contact?.account_number;
      if (!toAccountNumber) {
        return { error: "I need a saved bank contact name or bank account number to send money." };
      }

      const recipientLabel = (contact?.label ?? recipientName) || toAccountNumber;
      return confirmationAction({
        label: `Confirm transfer of LKR ${amount.toLocaleString()} to ${recipientLabel} from ${account.account_name}?`,
        method: "POST",
        path: "/api/transfers",
        body: {
          from_account_id: account.id,
          to_account_number: toAccountNumber,
          amount,
          remark:
            typeof parsed.remark === "string" && parsed.remark.trim()
              ? parsed.remark
              : `AI transfer to ${recipientLabel}`,
        },
        successMessage: `Transfer completed: LKR ${amount.toLocaleString()} to ${recipientLabel}.`,
      });
    }
    case "execute_bill_payment": {
      const amount = Number(parsed.amount);
      const contacts = await contactsRepo.listContacts(user.id);
      const accounts = await accountsRepo.listAccounts(user.id);
      const account = primaryAccount(accounts, parsed.fromAccountId);
      if (!account) return { error: "No linked account is available to pay from." };

      const billerName = typeof parsed.billerName === "string" ? parsed.billerName : "";
      const directBiller = typeof parsed.billerAccount === "string" ? parsed.billerAccount.trim() : "";
      const contact = billerName
        ? matchByName(
            contacts.filter((item) => item.contact_type === "bill"),
            billerName
          )
        : undefined;
      const billerAccount = directBiller || contact?.account_number;
      if (!billerAccount) {
        return { error: "I need a saved bill contact name or bill account/reference number." };
      }

      const label = (contact?.label ?? billerName) || billerAccount;
      return confirmationAction({
        label: `Confirm bill payment of LKR ${amount.toLocaleString()} to ${label} from ${account.account_name}?`,
        method: "POST",
        path: "/api/bills",
        body: {
          from_account_id: account.id,
          biller_account: billerAccount,
          amount,
          reference:
            typeof parsed.reference === "string" && parsed.reference.trim()
              ? parsed.reference
              : `AI bill payment to ${label}`,
        },
        successMessage: `Bill payment completed: LKR ${amount.toLocaleString()} to ${label}.`,
      });
    }
    case "execute_mobile_topup": {
      const amount = Number(parsed.amount);
      const contacts = await contactsRepo.listContacts(user.id);
      const accounts = await accountsRepo.listAccounts(user.id);
      const account = primaryAccount(accounts, parsed.fromAccountId);
      if (!account) return { error: "No linked account is available to top up from." };

      const contactName = typeof parsed.contactName === "string" ? parsed.contactName : "";
      const directMobile = typeof parsed.mobileNumber === "string" ? parsed.mobileNumber.trim() : "";
      const contact = contactName
        ? matchByName(
            contacts.filter((item) => item.contact_type === "mobile"),
            contactName
          )
        : undefined;
      const mobileNumber = directMobile || contact?.account_number;
      if (!mobileNumber) {
        return { error: "I need a saved mobile contact name or telephone number." };
      }

      const label = (contact?.label ?? contactName) || mobileNumber;
      return confirmationAction({
        label: `Confirm mobile top-up of LKR ${amount.toLocaleString()} for ${label} from ${account.account_name}?`,
        method: "POST",
        path: "/api/topup",
        body: {
          from_account_id: account.id,
          mobile_number: mobileNumber,
          amount,
          provider:
            typeof parsed.provider === "string" && parsed.provider.trim()
              ? parsed.provider
              : contact?.provider,
          remark: `AI mobile top-up for ${label}`,
        },
        successMessage: `Top-up completed: LKR ${amount.toLocaleString()} for ${label}.`,
      });
    }
    case "save_contact": {
      const label = String(parsed.label).trim();
      const contact_type = parsed.contactType as Contact["contact_type"];
      const account_number = String(parsed.accountNumber).trim();
      const bank_code = typeof parsed.bankCode === "string" ? parsed.bankCode : null;
      const provider = typeof parsed.provider === "string" ? parsed.provider : null;
      if (!/\d{3,}/.test(account_number)) {
        return {
          error:
            "Contact number is required. Please include the mobile, bank, or bill account number. Example: save mobile number 0761772110 name as Imesh2.",
        };
      }
      const existing = (await contactsRepo.listContacts(user.id)).find(
        (contact) =>
          normalizeText(contact.label) === normalizeText(label) &&
          contact.contact_type === contact_type
      );
      const contact = existing
        ? await contactsRepo.updateContact(user.id, existing.id, {
            label,
            contact_type,
            account_number,
            bank_code,
            provider,
          })
        : await contactsRepo.createContact(user.id, {
            label,
            contact_type,
            account_number,
            bank_code,
            provider,
          });
      return { status: existing ? "CONTACT_UPDATED" : "CONTACT_SAVED", contact };
    }
    case "delete_contact": {
      const contacts = await contactsRepo.listContacts(user.id);
      const label = String(parsed.label);
      const type = parsed.contactType;
      const candidates = contacts.filter((contact) => !type || contact.contact_type === type);
      const contact = matchByName(candidates, label);
      if (!contact) return { error: `Could not find a saved contact named ${label}.` };
      return confirmationAction({
        label: `Are you sure you want to remove ${contact.label} from ${contact.contact_type} contacts?`,
        method: "DELETE",
        path: `/api/contacts/${contact.id}`,
        successMessage: `${contact.label} was removed from contacts.`,
      });
    }
    case "analyze_finances": {
      const accounts = await accountsRepo.listAccounts(user.id);
      const accountNames = new Map(accounts.map((account) => [account.id, account.account_name]));
      const filtered = filterTransactionsByRange(
        await transactionsRepo.listTransactions(user.id, 1000),
        parsed
      ).map((transaction) =>
        summarizeTransaction(
          transaction,
          transaction.linked_account_id ? accountNames.get(transaction.linked_account_id) : undefined
        )
      );
      const expenses = filtered.filter((transaction) => transaction.type !== "credit");
      const deposits = filtered.filter((transaction) => transaction.type === "credit");
      const groupBy =
        parsed.groupBy === "category" || parsed.groupBy === "account" || parsed.groupBy === "type"
          ? parsed.groupBy
          : "none";

      return {
        currency: "LKR",
        timeframe: {
          days: parsed.days ?? 30,
          fromDate: parsed.fromDate ?? null,
          toDate: parsed.toDate ?? null,
        },
        totalBalance: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
        transactionCount: filtered.length,
        expenseCount: expenses.length,
        depositCount: deposits.length,
        totalExpenses: expenses.reduce((sum, transaction) => sum + transaction.amount, 0),
        totalDeposits: deposits.reduce((sum, transaction) => sum + transaction.amount, 0),
        grouped: groupTotals(filtered, groupBy),
        topExpenses: expenses.sort((a, b) => b.amount - a.amount).slice(0, 5),
      };
    }
    case "create_jar": {
      const jar = await jarsRepo.createJar(user.id, {
        name: String(parsed.name).trim(),
        target_amount: parsed.targetAmount ? Number(parsed.targetAmount) : null,
      });
      const initialAmount = Number(parsed.initialAmount ?? 0);
      if (initialAmount > 0) {
        const fundedJar = await jarsRepo.fundJar(user.id, jar.id, initialAmount, false);
        await transactionsRepo.createTransaction(user.id, {
          linked_account_id: null,
          type: "debit",
          amount: initialAmount,
          currency: "LKR",
          counterparty: jar.name,
          remark: `Jar deposit: ${jar.name}`,
          category: "Savings",
          status: "completed",
        });
        return {
          status: "JAR_CREATED",
          jar: fundedJar ?? jar,
          message: `Created ${jar.name} and added LKR ${initialAmount.toLocaleString()}.`,
        };
      }
      return { status: "JAR_CREATED", jar };
    }
    case "fund_jar": {
      const jars = await jarsRepo.listJars(user.id);
      const requestedJarName = String(parsed.jarName).trim();
      const jar = matchByName<Jar>(jars, requestedJarName) ?? (await jarsRepo.createJar(user.id, {
        name: requestedJarName,
        target_amount: null,
      }));
      const amount = Number(parsed.amount);
      const fundedJar = await jarsRepo.fundJar(user.id, jar.id, amount, Boolean(parsed.isVirtual));
      if (!parsed.isVirtual) {
        await transactionsRepo.createTransaction(user.id, {
          linked_account_id: null,
          type: "debit",
          amount,
          currency: "LKR",
          counterparty: jar.name,
          remark: `Jar deposit: ${jar.name}`,
          category: "Savings",
          status: "completed",
        });
      }
      return {
        status: "JAR_FUNDED",
        jar: fundedJar ?? jar,
        message: `Added LKR ${amount.toLocaleString()} to ${jar.name}.`,
      };
    }
    case "delete_jar": {
      const jars = await jarsRepo.listJars(user.id);
      const jar = matchByName<Jar>(jars, String(parsed.jarName));
      if (!jar) return { error: `Could not find a jar named ${String(parsed.jarName)}.` };
      return confirmationAction({
        label: `Are you sure you want to delete jar ${jar.name}?`,
        method: "DELETE",
        path: `/api/jars/${jar.id}`,
        successMessage: `${jar.name} jar was deleted.`,
      });
    }
    case "create_schedule": {
      const scheduled_payment = await schedulesRepo.createScheduledPayment(user.id, {
        label: String(parsed.label).trim(),
        amount: Number(parsed.amount),
        day_of_month: Number(parsed.dayOfMonth),
      });
      return { status: "SCHEDULE_CREATED", scheduled_payment };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
