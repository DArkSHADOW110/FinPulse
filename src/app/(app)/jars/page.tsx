"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { Jar, LinkedAccount } from "@/types/database";
import { Coins, Pencil, PiggyBank, Plus, Target, Trash2, X } from "lucide-react";

type FundingSource = "actual" | "virtual";

const EMPTY_FORM = {
  name: "",
  target: "",
  initialAmount: "",
  autoEnabled: false,
  autoAmount: "",
  autoFrequency: "monthly" as "weekly" | "monthly",
};

function jarTotal(jar: Jar) {
  return Number(jar.actual_saved ?? 0) + Number(jar.virtual_saved ?? 0);
}

function readAuto(jar: Jar) {
  return (jar.metadata?.auto_contribution ?? {}) as {
    enabled?: boolean;
    amount?: number;
    frequency?: "weekly" | "monthly";
    next_run_at?: string;
  };
}

function nextAutoRun(frequency: "weekly" | "monthly") {
  const date = new Date();
  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function mergeJars(current: Jar[], incoming: Jar[]) {
  const byId = new Map(current.map((jar) => [jar.id, jar]));
  for (const jar of incoming) {
    byId.set(jar.id, jar);
  }
  return Array.from(byId.values());
}

export default function JarsPage() {
  const [jars, setJars] = useState<Jar[]>([]);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [jarForm, setJarForm] = useState(EMPTY_FORM);
  const [editingJar, setEditingJar] = useState<Jar | null>(null);
  const [depositJar, setDepositJar] = useState<Jar | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [fundingSource, setFundingSource] = useState<FundingSource>("actual");
  const [jarModalOpen, setJarModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState("");

  function load(options?: { merge?: boolean }) {
    fetch(`/api/jars?ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const nextJars = (d.jars ?? []) as Jar[];
        if (options?.merge) {
          setJars((current) => mergeJars(current, nextJars));
          return;
        }
        setJars(nextJars);
      });
    fetch(`/api/accounts?ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []));
  }

  useEffect(() => {
    load();
    function handleDataRefresh(event: Event) {
      const detail = (event as CustomEvent<{ jar?: Jar }>).detail;
      if (detail?.jar) {
        setJars((current) => {
          const exists = current.some((jar) => jar.id === detail.jar?.id);
          return exists
            ? current.map((jar) => (jar.id === detail.jar?.id ? detail.jar : jar))
            : [...current, detail.jar as Jar];
        });
        window.setTimeout(() => load({ merge: true }), 800);
        window.setTimeout(() => load({ merge: true }), 2000);
        return;
      }
      load();
    }
    window.addEventListener("finpulse:data-refresh", handleDataRefresh);
    return () => window.removeEventListener("finpulse:data-refresh", handleDataRefresh);
  }, []);

  const linkedBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const actualSaved = jars.reduce((sum, jar) => sum + Number(jar.actual_saved ?? 0), 0);
  const virtualSaved = jars.reduce((sum, jar) => sum + Number(jar.virtual_saved ?? 0), 0);
  const actualMainBalance = Math.max(linkedBalance - actualSaved, 0);
  const progressSummary = useMemo(
    () => ({
      actualSaved,
      virtualSaved,
      totalSaved: actualSaved + virtualSaved,
    }),
    [actualSaved, virtualSaved]
  );

  function openCreateModal() {
    setEditingJar(null);
    setJarForm(EMPTY_FORM);
    setError("");
    setJarModalOpen(true);
  }

  function openEditModal(jar: Jar) {
    setEditingJar(jar);
    setJarForm({
      name: jar.name,
      target: jar.target_amount ? String(jar.target_amount) : "",
      initialAmount: "",
      autoEnabled: Boolean(readAuto(jar).enabled),
      autoAmount: readAuto(jar).amount ? String(readAuto(jar).amount) : "",
      autoFrequency: readAuto(jar).frequency ?? "monthly",
    });
    setError("");
    setJarModalOpen(true);
  }

  async function saveJar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: jarForm.name,
      target_amount: jarForm.target ? Number(jarForm.target) : null,
      metadata: {
        ...(editingJar?.metadata ?? {}),
        auto_contribution: {
          enabled: jarForm.autoEnabled,
          amount: jarForm.autoAmount ? Number(jarForm.autoAmount) : 0,
          frequency: jarForm.autoFrequency,
          next_run_at:
            editingJar && readAuto(editingJar).next_run_at
              ? readAuto(editingJar).next_run_at
              : nextAutoRun(jarForm.autoFrequency),
        },
      },
    };
    const initialAmount = Number(jarForm.initialAmount || 0);
    if (!editingJar && initialAmount > actualMainBalance) {
      setSaving(false);
      setError("Initial real deposit cannot exceed your available actual main balance.");
      return;
    }
    const res = await fetch(editingJar ? `/api/jars/${editingJar.id}` : "/api/jars", {
      method: editingJar ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not save jar. Please try again.");
      return;
    }
    if (!editingJar && initialAmount > 0 && data.jar?.id) {
      const fundRes = await fetch(`/api/jars/${data.jar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fund_amount: initialAmount,
          is_virtual: false,
        }),
      });
      if (!fundRes.ok) {
        const fundData = await fundRes.json().catch(() => ({}));
        setError(fundData.error ?? "Jar created, but initial amount could not be added.");
        return;
      }
    }
    setJarModalOpen(false);
    setEditingJar(null);
    setJarForm(EMPTY_FORM);
    load();
  }

  async function deleteJar(id: string) {
    await fetch(`/api/jars/${id}`, { method: "DELETE" });
    load();
  }

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    if (!depositJar) return;
    const amount = Number(depositAmount);
    setError("");
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (fundingSource === "actual" && amount > actualMainBalance) {
      setError("You cannot deposit more real money than your available actual main balance.");
      return;
    }
    setDepositing(true);
    const res = await fetch(`/api/jars/${depositJar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fund_amount: amount,
        is_virtual: fundingSource === "virtual",
      }),
    });
    setDepositing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not deposit to jar.");
      return;
    }
    setDepositJar(null);
    setDepositAmount("");
    setFundingSource("actual");
    load();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <PiggyBank className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Savings Jars</h1>
            <p className="mt-1 text-sm text-text-tertiary">
              Targeted goals with real and virtual funding.
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Jar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Actual Main Balance</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{formatCurrency(actualMainBalance)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Virtual Saved</p>
          <p className="mt-2 text-2xl font-bold text-amber-500 dark:text-amber-300">
            {formatCurrency(progressSummary.virtualSaved)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jars.map((jar) => {
          const total = jarTotal(jar);
          const target = Number(jar.target_amount ?? 0);
          const progress = target > 0 ? Math.min((total / target) * 100, 100) : 0;
          const auto = readAuto(jar);
          return (
            <Card
              key={jar.id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_var(--cyber-cyan-glow)]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg p-2.5"
                      style={{
                        backgroundColor: jar.color ? `${jar.color}20` : "var(--primary-glow)",
                        color: jar.color || "var(--primary)",
                      }}
                    >
                      <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{jar.name}</CardTitle>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-text-tertiary">
                        <Target className="h-3.5 w-3.5" />
                        Target: {target ? formatCurrency(target) : "No target"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDepositJar(jar)}
                      className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="Deposit to jar"
                    >
                      <Coins className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(jar)}
                      className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="Edit jar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteJar(jar.id)}
                      className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete jar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--input-bg)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-text-tertiary">{progress.toFixed(1)}% reached</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <p className="font-semibold text-primary">Real</p>
                    <p className="mt-1 text-text-primary">{formatCurrency(Number(jar.actual_saved ?? 0))}</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 p-3">
                    <p className="font-semibold text-amber-500 dark:text-amber-300">Virtual</p>
                    <p className="mt-1 text-text-primary">{formatCurrency(Number(jar.virtual_saved ?? 0))}</p>
                  </div>
                </div>
                {auto.enabled && auto.amount ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs">
                    <p className="font-semibold text-amber-500 dark:text-amber-300">Auto DCA active</p>
                    <p className="mt-1 text-text-tertiary">
                      Adds {formatCurrency(Number(auto.amount))} {auto.frequency ?? "monthly"}
                    </p>
                    {auto.next_run_at && (
                      <p className="mt-1 text-text-tertiary">
                        Next: {new Date(auto.next_run_at).toLocaleDateString("en-LK")}
                      </p>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {jars.length === 0 && (
          <div className="col-span-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-12 text-center text-text-tertiary">
            <PiggyBank className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-sm">No jars created yet</p>
          </div>
        )}
      </div>

      {jarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
          <Card className="relative w-full max-w-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border)]">
              <CardTitle>{editingJar ? "Edit Goal" : "Create New Jar"}</CardTitle>
              <button onClick={() => setJarModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={saveJar} className="space-y-4">
                <div>
                  <Label>Jar name</Label>
                  <Input
                    className="mt-2"
                    placeholder="e.g. Buy a Phone"
                    value={jarForm.name}
                    onChange={(e) => setJarForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Target amount (LKR)</Label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    placeholder="75000"
                    value={jarForm.target}
                    onChange={(e) => setJarForm((f) => ({ ...f, target: e.target.value }))}
                    required
                  />
                </div>
                {!editingJar && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-4">
                    <Label>Initial amount to add now (optional)</Label>
                    <Input
                      className="mt-2"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={jarForm.initialAmount}
                      onChange={(e) => setJarForm((f) => ({ ...f, initialAmount: e.target.value }))}
                    />
                  </div>
                )}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <input
                      type="checkbox"
                      checked={jarForm.autoEnabled}
                      onChange={(e) => setJarForm((f) => ({ ...f, autoEnabled: e.target.checked }))}
                      className="h-4 w-4 accent-primary"
                    />
                    Enable automatic DCA contribution
                  </label>
                  {jarForm.autoEnabled && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Scheduled amount</Label>
                        <Input
                          className="mt-2"
                          type="number"
                          min="1"
                          placeholder="e.g. 5000"
                          value={jarForm.autoAmount}
                          onChange={(e) => setJarForm((f) => ({ ...f, autoAmount: e.target.value }))}
                          required={jarForm.autoEnabled}
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <select
                          className="mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary"
                          value={jarForm.autoFrequency}
                          onChange={(e) =>
                            setJarForm((f) => ({
                              ...f,
                              autoFrequency: e.target.value as "weekly" | "monthly",
                            }))
                          }
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving..." : editingJar ? "Save changes" : "Create jar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {depositJar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
          <Card className="relative w-full max-w-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border)]">
              <CardTitle>Deposit to {depositJar.name}</CardTitle>
              <button onClick={() => setDepositJar(null)} className="text-text-tertiary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={deposit} className="space-y-4">
                <div>
                  <Label>Amount (LKR)</Label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Funding source</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFundingSource("actual")}
                      className={`rounded-xl border p-3 text-left text-sm transition-all ${
                        fundingSource === "actual"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-[var(--border)] bg-[var(--item-hover)] text-text-secondary"
                      }`}
                    >
                      <span className="font-semibold">Main Balance</span>
                      <span className="mt-1 block text-xs text-text-tertiary">
                        Available: {formatCurrency(actualMainBalance)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFundingSource("virtual")}
                      className={`rounded-xl border p-3 text-left text-sm transition-all ${
                        fundingSource === "virtual"
                          ? "border-amber-400/40 bg-amber-500/10 text-amber-500 dark:text-amber-300"
                          : "border-[var(--border)] bg-[var(--item-hover)] text-text-secondary"
                      }`}
                    >
                      <span className="font-semibold">Virtual Funds</span>
                      <span className="mt-1 block text-xs text-text-tertiary">
                        Does not deduct real funds
                      </span>
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={depositing} className="w-full">
                  {depositing ? "Depositing..." : "Deposit funds"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
