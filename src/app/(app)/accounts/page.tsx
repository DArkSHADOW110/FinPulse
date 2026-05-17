"use client";

import { useEffect, useState } from "react";
import {
  usePlaidLink,
  type PlaidLinkError,
  type PlaidLinkOnExitMetadata,
  type PlaidLinkOnSuccessMetadata,
} from "react-plaid-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { LinkedAccount } from "@/types/database";
import {
  RefreshCw,
  ShieldCheck,
  Wallet,
  Building2,
  Star,
  KeyRound,
  Trash2,
  Link2,
  Landmark,
} from "lucide-react";

const BANKS = [
  { code: "7083", name: "Seylan Bank" },
  { code: "7004", name: "Bank of Ceylon" },
  { code: "7010", name: "People's Bank" },
  { code: "7056", name: "Commercial Bank" },
  { code: "7278", name: "Sampath Bank" },
  { code: "7302", name: "DFCC Bank" },
];

function accountMask(account: LinkedAccount) {
  const savedMask =
    typeof account.metadata?.account_mask === "string" ? account.metadata.account_mask : null;
  if (savedMask) return savedMask;
  if (account.account_number.includes("*")) return account.account_number;
  const compact = account.account_number.replace(/\D/g, "");
  if (compact.length <= 5) return account.account_number;
  return `${compact.slice(0, 2)}${"*".repeat(Math.max(compact.length - 5, 3))}${compact.slice(-3)}`;
}

function notifyDataChanged(detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("finpulse:data-refresh", { detail }));
  window.setTimeout(() => window.dispatchEvent(new CustomEvent("finpulse:data-refresh", { detail })), 300);
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [openPlaidWhenReady, setOpenPlaidWhenReady] = useState(false);
  const [plaidMessage, setPlaidMessage] = useState<string>(
    "Click Prepare and Open Plaid Link to start bank linking."
  );
  const [providerHint, setProviderHint] = useState(
    "JustPay sandbox mode — OTP registration stubs are used until Seylan credentials are configured"
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [bankCode, setBankCode] = useState("7083");
  const [accountNumber, setAccountNumber] = useState("");
  const [nic, setNic] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [registrationRef, setRegistrationRef] = useState("");
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function load() {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts ?? []);
        const p = d.accounts?.[0]?.provider;
        if (p) setProviderHint("Connected accounts are stored with tokenized JustPay-safe details");
      });
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  });

  useEffect(() => {
    load();
    createLinkToken();
  }, []);

  useEffect(() => {
    if (!openPlaidWhenReady || !ready || !linkToken) return;
    setOpenPlaidWhenReady(false);
    setPlaidMessage("Opening Plaid Link...");
    open();
  }, [linkToken, open, openPlaidWhenReady, ready]);

  async function createLinkToken(openAfterCreate = false) {
    setPlaidLoading(true);
    setStatus(null);
    setPlaidMessage("Requesting Plaid Link token from the backend...");
    try {
      const res = await fetch("/api/create_link_token", {
        method: "POST",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        const details = [data.error_code, data.request_id].filter(Boolean).join(" / ");
        throw new Error(
          `${data.error ?? "Could not create Plaid Link token"}${details ? ` (${details})` : ""}`
        );
      }
      if (typeof data.link_token !== "string" || !data.link_token) {
        throw new Error("Backend did not return a valid Plaid link_token.");
      }
      setLinkToken(data.link_token);
      if (openAfterCreate) setOpenPlaidWhenReady(true);
      setPlaidMessage(openAfterCreate ? "Plaid token ready. Opening Link..." : "Plaid token ready.");
      setProviderHint("Plaid Link is ready. Connect your bank securely.");
    } catch (error) {
      setOpenPlaidWhenReady(false);
      setLinkToken(null);
      setPlaidMessage(error instanceof Error ? error.message : "Plaid Link preparation failed.");
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not initialize Plaid Link. Check Plaid environment variables.",
      });
    } finally {
      setPlaidLoading(false);
    }
  }

  async function sync() {
    setSyncing(true);
    const res = await fetch("/api/accounts", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Automatic bank sync is disabled." });
      setSyncing(false);
      return;
    }
    load();
    setSyncing(false);
  }

  async function handlePlaidSuccess(
    publicToken: string,
    metadata?: PlaidLinkOnSuccessMetadata
  ) {
    setPlaidLoading(true);
    setStatus(null);
    setPlaidMessage("Exchanging Plaid public token securely...");
    const institutionName = metadata?.institution?.name ?? "Plaid Sandbox Bank";
    const accountMask = metadata?.accounts?.[0]?.mask
      ? `**${metadata.accounts[0].mask}`
      : "92*****193";
    const res = await fetch("/api/set_access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        public_token: publicToken,
        institution_name: institutionName,
        account_mask: accountMask,
      }),
    });
    const data = await res.json();
    setPlaidLoading(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Plaid token exchange failed" });
      setPlaidMessage(data.error ?? "Plaid token exchange failed");
      return;
    }
    setAccounts((prev) => [data.account, ...prev.filter((a) => a.id !== data.account.id)]);
    notifyDataChanged({ account: data.account });
    setProviderHint("Connected via Plaid token exchange");
    setStatus({
      type: "success",
      message: `${institutionName} linked securely with Plaid.`,
    });
    setPlaidMessage("Plaid account linked successfully.");
  }

  function handlePlaidExit(error: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) {
    setOpenPlaidWhenReady(false);
    if (error) {
      setPlaidMessage(error.display_message ?? error.error_message ?? "Plaid Link closed with an error.");
      setStatus({
        type: "error",
        message: error.display_message ?? error.error_message ?? "Plaid Link closed with an error.",
      });
      return;
    }
    setPlaidMessage(metadata.status ? `Plaid Link closed: ${metadata.status}.` : "Plaid Link was closed.");
  }

  function handlePlaidClick() {
    if (ready && linkToken) {
      setPlaidMessage("Opening Plaid Link...");
      open();
      return;
    }
    setOpenPlaidWhenReady(true);
    createLinkToken(true);
  }

  async function handleUnlinkAccount(accountId: string) {
    setRemovingIds((prev) => [...prev, accountId]);
    setStatus(null);
    const res = await fetch(`/api/accounts?id=${encodeURIComponent(accountId)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setRemovingIds((prev) => prev.filter((id) => id !== accountId));
      setStatus({ type: "error", message: data.error ?? "Could not unlink account" });
      return;
    }

    window.setTimeout(() => {
      setAccounts((prev) => prev.filter((account) => account.id !== accountId));
      setRemovingIds((prev) => prev.filter((id) => id !== accountId));
      notifyDataChanged();
    }, 220);
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    setStatus(null);
    const bank = BANKS.find((b) => b.code === bankCode) ?? BANKS[0];
    const res = await fetch("/api/justpay/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank_code: bank.code,
        bank_name: bank.name,
        account_number: accountNumber,
        nic,
        mobile,
      }),
    });
    const data = await res.json();
    setRegistering(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Could not request JustPay OTP" });
      return;
    }
    setRegistrationRef(data.Retrieval_reference ?? data.Transaction_Reference ?? "");
    setStep(2);
    setStatus({
      type: "success",
      message: `OTP sent to ${mobile}. Reference: ${data.Retrieval_reference}`,
    });
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setStatus(null);
    const res = await fetch("/api/justpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Retrieval_reference: registrationRef,
        OTP: otp,
      }),
    });
    const data = await res.json();
    setVerifying(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "OTP verification failed" });
      return;
    }
    if (data.account) {
      setAccounts((prev) => [data.account, ...prev.filter((a) => a.id !== data.account.id)]);
    } else {
      load();
    }
    setStatus({
      type: "success",
      message: `Account linked securely as ${data.Account_mask}. Token stored server-side.`,
    });
    setStep(1);
    setAccountNumber("");
    setNic("");
    setMobile("");
    setOtp("");
    setRegistrationRef("");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Linked Accounts</h1>
          <p className="text-text-tertiary text-sm mt-1">{providerHint}</p>
        </div>
        <Button onClick={sync} disabled={syncing} variant="secondary" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync from bank"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:order-1 lg:col-span-5">
          <Card className="relative h-full min-h-[500px] overflow-hidden border border-white/10 bg-[var(--card)]/70 backdrop-blur-md">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-[80px]" />
            <CardHeader className="border-b border-[var(--border)]">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                Add Account
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex h-full flex-col gap-5 pt-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--item-hover)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-text-primary" />
                  <p className="text-sm font-semibold text-text-primary">Automated linking</p>
                </div>
                <Button
                  type="button"
                  onClick={handlePlaidClick}
                  disabled={plaidLoading}
                  className="h-12 w-full border border-white/20 bg-gradient-to-br from-black to-slate-900 text-white shadow-[0_0_22px_rgba(255,255,255,0.18)] hover:from-slate-950 hover:to-black"
                >
                  {plaidLoading
                    ? "Preparing Plaid..."
                    : ready && linkToken
                      ? "Open Plaid Link"
                      : "Prepare and Open Plaid Link"}
                </Button>
                <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                    Plaid status
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{plaidMessage}</p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
                  Plaid Link now uses a server-generated link token and exchanges the returned public
                  token securely on the backend.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-tertiary">
                  OR
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-text-primary">Manual Link (Seylan)</p>
                </div>
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-1">
                  <div
                    className={`rounded-lg px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider transition-all ${
                      step === 1 ? "bg-primary text-black shadow-[0_0_15px_var(--primary-glow)]" : "text-text-tertiary"
                    }`}
                  >
                    Register
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider transition-all ${
                      step === 2 ? "bg-primary text-black shadow-[0_0_15px_var(--primary-glow)]" : "text-text-tertiary"
                    }`}
                  >
                    Verify OTP
                  </div>
                </div>

                {step === 1 ? (
                  <form onSubmit={requestOtp} className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div>
                      <Label>Bank / provider</Label>
                      <select
                        className="mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary transition-all focus:border-primary focus:ring-2 focus:ring-[var(--primary-glow)]"
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                      >
                        {BANKS.map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name} ({bank.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Account number</Label>
                      <Input
                        className="mt-2"
                        inputMode="numeric"
                        placeholder="Enter bank account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>NIC number</Label>
                      <Input
                        className="mt-2"
                        placeholder="e.g. 901234567V"
                        value={nic}
                        onChange={(e) => setNic(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Mobile number</Label>
                      <Input
                        className="mt-2"
                        inputMode="tel"
                        placeholder="07XXXXXXXX"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={registering} className="w-full">
                      {registering ? "Requesting OTP..." : "Request OTP"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
                        Registration reference
                      </p>
                      <p className="mt-1 text-sm text-text-primary">{registrationRef}</p>
                    </div>
                    <div>
                      <Label>OTP code</Label>
                      <Input
                        className="mt-2 h-14 text-center text-2xl tracking-[0.5em]"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={verifying} className="w-full">
                      <KeyRound className="h-4 w-4" />
                      {verifying ? "Verifying..." : "Verify & Link"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setStep(1);
                        setOtp("");
                        setRegistrationRef("");
                      }}
                    >
                      Back to registration
                    </Button>
                  </form>
                )}
              </div>

              {status && (
                <div
                  className={`mt-auto rounded-xl border p-3 text-sm ${
                    status.type === "success"
                      ? "border-success/20 bg-success-light text-success"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.message}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4 lg:order-2 lg:col-span-7">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Connected Accounts</h2>
            <p className="mt-1 text-sm text-text-tertiary">
              Balances are displayed in LKR for the FinPulse dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {accounts.map((a) => {
              const isRemoving = removingIds.includes(a.id);
              return (
                <Card
                  key={a.id}
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_var(--cyber-cyan-glow)] ${
                    isRemoving ? "scale-95 opacity-0" : "scale-100 opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleUnlinkAccount(a.id)}
                    className="absolute right-3 top-3 z-10 rounded-full border border-[var(--border)] bg-[var(--card)]/80 p-2 text-text-tertiary opacity-70 backdrop-blur-md transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                    aria-label={`Unlink ${a.account_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <CardHeader className="pb-2 pr-14 md:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{a.account_name}</CardTitle>
                          <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {a.provider.toUpperCase()} · {a.account_type}
                          </p>
                        </div>
                      </div>
                      {a.is_primary && (
                        <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3" /> Primary
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:pt-0">
                    <div>
                      <p className="text-2xl font-bold text-primary tracking-tight">
                      {formatCurrency(Number(a.balance), "LKR")}
                      </p>
                      <p className="mt-2 text-sm text-text-tertiary tracking-[0.1em]">
                        {accountMask(a)}
                      </p>
                    </div>
                    {a.external_account_id && (
                      <p className="inline-flex w-fit rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        Tokenized
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
