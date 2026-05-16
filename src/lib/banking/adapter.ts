import type { LinkedAccount, Transaction } from "@/types/database";

export interface BankAccountSummary {
  externalId: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: number;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  remark?: string;
  bankCode?: string;
}

export interface BillPaymentRequest {
  fromAccountId: string;
  billerAccount: string;
  amount: number;
  currency: string;
  reference?: string;
}

export interface MobileTopupRequest {
  fromAccountId: string;
  mobileNumber: string;
  amount: number;
  currency: string;
  provider?: string;
}

export interface BankingAdapter {
  readonly provider: string;
  isConfigured(): boolean;
  listAccounts(userExternalId: string): Promise<BankAccountSummary[]>;
  getBalance(externalAccountId: string): Promise<number>;
  transfer(request: TransferRequest): Promise<{ reference: string; status: string }>;
  payBill(request: BillPaymentRequest): Promise<{ reference: string; status: string }>;
  mobileTopup(request: MobileTopupRequest): Promise<{ reference: string; status: string }>;
  fetchTransactions(
    externalAccountId: string,
    since?: Date
  ): Promise<
    Array<{
      type: Transaction["type"];
      amount: number;
      currency: string;
      counterparty?: string;
      remark?: string;
      occurredAt: Date;
    }>
  >;
}

export function mapSummaryToLinkedAccount(
  userId: string,
  provider: string,
  summary: BankAccountSummary
): Omit<LinkedAccount, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    provider,
    external_account_id: summary.externalId,
    account_name: summary.accountName,
    account_number: summary.accountNumber,
    account_type: summary.accountType,
    currency: summary.currency,
    balance: summary.balance,
    is_primary: false,
    metadata: {},
  };
}
