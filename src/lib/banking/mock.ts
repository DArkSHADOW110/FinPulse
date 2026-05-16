import type {
  BankAccountSummary,
  BankingAdapter,
  BillPaymentRequest,
  MobileTopupRequest,
  TransferRequest,
} from "@/lib/banking/adapter";

/** Sandbox adapter used when Seylan credentials are missing */
export class MockBankingAdapter implements BankingAdapter {
  readonly provider = "mock";

  isConfigured() {
    return true;
  }

  async listAccounts(userExternalId: string): Promise<BankAccountSummary[]> {
    return [
      {
        externalId: `mock-${userExternalId}-1`,
        accountName: "Everyday Checking",
        accountNumber: "****4521",
        accountType: "checking",
        currency: "LKR",
        balance: 248750.5,
      },
      {
        externalId: `mock-${userExternalId}-2`,
        accountName: "Savings Plus",
        accountNumber: "****8834",
        accountType: "savings",
        currency: "LKR",
        balance: 512000,
      },
    ];
  }

  async getBalance(externalAccountId: string): Promise<number> {
    return externalAccountId.includes("2") ? 512000 : 248750.5;
  }

  async transfer(request: TransferRequest) {
    await delay(300);
    return {
      reference: `MOCK-TRF-${Date.now()}`,
      status: "completed",
    };
  }

  async payBill(_request: BillPaymentRequest) {
    await delay(300);
    return {
      reference: `MOCK-BILL-${Date.now()}`,
      status: "completed",
    };
  }

  async mobileTopup(request: MobileTopupRequest) {
    await delay(300);
    return {
      reference: `MOCK-TOPUP-${request.mobileNumber.slice(-4)}-${Date.now()}`,
      status: "completed",
    };
  }

  async fetchTransactions(externalAccountId: string) {
    const now = Date.now();
    return [
      {
        type: "debit" as const,
        amount: 4500,
        currency: "LKR",
        counterparty: "Cargills Food City",
        remark: "groceries weekly shop",
        occurredAt: new Date(now - 86400000),
      },
      {
        type: "debit" as const,
        amount: 12000,
        currency: "LKR",
        counterparty: "CEB",
        remark: "electricity bill march",
        occurredAt: new Date(now - 172800000),
      },
      {
        type: "credit" as const,
        amount: 185000,
        currency: "LKR",
        counterparty: "Employer Payroll",
        remark: "salary april",
        occurredAt: new Date(now - 604800000),
      },
      {
        type: "debit" as const,
        amount: 2500,
        currency: "LKR",
        counterparty: "PickMe",
        remark: "ride to office",
        occurredAt: new Date(now - 259200000),
      },
    ];
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockAdapter = new MockBankingAdapter();
