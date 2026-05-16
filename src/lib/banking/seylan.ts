import type {
  BankAccountSummary,
  BankingAdapter,
  BillPaymentRequest,
  MobileTopupRequest,
  TransferRequest,
} from "@/lib/banking/adapter";

/**
 * Seylan Bank API adapter (stub).
 * Configure SEYLAN_* env vars when official API credentials and docs are available.
 * @see https://www.seylan.lk — contact bank for Open Banking / API access
 */
export class SeylanBankAdapter implements BankingAdapter {
  readonly provider = "seylan";

  private baseUrl = process.env.SEYLAN_API_BASE_URL ?? "";
  private clientId = process.env.SEYLAN_CLIENT_ID ?? "";
  private clientSecret = process.env.SEYLAN_CLIENT_SECRET ?? "";
  private apiKey = process.env.SEYLAN_API_KEY ?? "";

  isConfigured(): boolean {
    return Boolean(
      this.baseUrl && this.clientId && this.clientSecret && this.apiKey
    );
  }

  private async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("Seylan API is not configured. Set SEYLAN_* environment variables.");
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
        Authorization: `Bearer ${await this.getAccessToken()}`,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Seylan API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  private async getAccessToken(): Promise<string> {
    // OAuth2 client credentials — adjust per official Seylan API spec
    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error("Seylan OAuth token request failed");
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  async listAccounts(_userExternalId: string): Promise<BankAccountSummary[]> {
    if (!this.isConfigured()) return [];
    return this.request<BankAccountSummary[]>("/v1/accounts");
  }

  async getBalance(externalAccountId: string): Promise<number> {
    if (!this.isConfigured()) return 0;
    const data = await this.request<{ balance: number }>(
      `/v1/accounts/${externalAccountId}/balance`
    );
    return data.balance;
  }

  async transfer(request: TransferRequest) {
    if (!this.isConfigured()) {
      return { reference: `MOCK-TRF-${Date.now()}`, status: "sandbox" };
    }
    return this.request<{ reference: string; status: string }>("/v1/transfers", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async payBill(request: BillPaymentRequest) {
    if (!this.isConfigured()) {
      return { reference: `MOCK-BILL-${Date.now()}`, status: "sandbox" };
    }
    return this.request<{ reference: string; status: string }>("/v1/bills/pay", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async mobileTopup(request: MobileTopupRequest) {
    if (!this.isConfigured()) {
      return { reference: `MOCK-TOPUP-${Date.now()}`, status: "sandbox" };
    }
    return this.request<{ reference: string; status: string }>("/v1/mobile/topup", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async fetchTransactions(externalAccountId: string, since?: Date) {
    if (!this.isConfigured()) return [];
    const qs = since ? `?since=${since.toISOString()}` : "";
    return this.request<
      Array<{
        type: "credit" | "debit" | "transfer" | "bill" | "topup";
        amount: number;
        currency: string;
        counterparty?: string;
        remark?: string;
        occurredAt: Date;
      }>
    >(`/v1/accounts/${externalAccountId}/transactions${qs}`);
  }
}

export const seylanAdapter = new SeylanBankAdapter();
