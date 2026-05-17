"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, HeroCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Jar, LinkedAccount, Transaction } from "@/types/database";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ActionHub } from "@/components/action-hub/action-hub";
import { AiExpenseAnalysis } from "@/components/insights/ai-expense-analysis";
import { 
  ArrowRight, 
  Activity, 
  Wallet, 
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jars, setJars] = useState<Jar[]>([]);

  function loadDashboardData() {
    fetch(`/api/accounts?ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []));
    fetch(`/api/transactions?limit=5&ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []));
    fetch(`/api/jars?ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setJars(d.jars ?? []));
  }

  useEffect(() => {
    loadDashboardData();
    window.addEventListener("finpulse:data-refresh", loadDashboardData);
    return () => window.removeEventListener("finpulse:data-refresh", loadDashboardData);
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const actualSavedInJars = jars.reduce((s, jar) => s + Number(jar.actual_saved ?? jar.balance ?? 0), 0);
  const virtualMainBalance = jars.reduce((s, jar) => s + Number(jar.virtual_saved ?? 0), 0);
  const actualMainBalance = Math.max(totalBalance - actualSavedInJars, 0);
  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Good night"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 21
            ? "Good evening"
            : "Good night";
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
          {greeting}, {firstName}
        </h1>
        <p className="text-text-tertiary text-sm font-medium">
          Review your spending insights and upcoming payments from your dashboard.
        </p>
      </div>

      {/* Hero Section - Balance & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Balance Card */}
        <HeroCard className="md:col-span-2 p-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-[var(--icon-bg)]">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-text-tertiary">Total Net Worth</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[2.5rem] font-bold text-text-primary tracking-tighter">
                {formatCurrency(actualMainBalance)}
              </span>
            </div>
            
            {/* Change indicator */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success">
                <TrendingUp className="h-3 w-3" />
                +2.4%
              </span>
              <span className="text-xs text-text-tertiary flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Across {accounts.length} linked account{accounts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-[var(--input-bg)] px-3 py-1.5 text-text-secondary">
                Actual main: {formatCurrency(actualMainBalance)}
              </span>
              <span className="rounded-full bg-amber-500/10 px-3 py-1.5 font-semibold text-amber-500 dark:text-amber-300">
                Virtual: {formatCurrency(virtualMainBalance)}
              </span>
            </div>
          </div>
        </HeroCard>

        {/* Quick Actions Card */}
        <Card className="p-5">
          <ActionHub />
        </Card>
      </div>

      {/* Accounts & Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Accounts */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <CardTitle className="text-base font-semibold">Connected Accounts</CardTitle>
            <Link href="/accounts">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 p-5">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="snap-center shrink-0 w-[260px] group flex flex-col justify-between rounded-xl bg-gradient-to-br from-[var(--card-hover)] to-[var(--card)] hover:from-primary/10 hover:to-[var(--card)] border border-[var(--card-border)] hover:border-primary/30 p-5 transition-all duration-300 active:scale-[0.98] relative overflow-hidden"
                >
                  {/* Glow effect */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 blur-2xl rounded-full group-hover:bg-primary/20 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="p-2.5 rounded-xl bg-[var(--icon-bg)] text-primary group-hover:bg-primary/20 transition-colors">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-text-tertiary">{a.provider || 'Bank'}</span>
                  </div>
                  
                  <div className="relative z-10">
                    <p className="font-bold text-2xl text-text-primary tracking-tight">
                      {formatCurrency(Number(a.balance), "LKR")}
                    </p>
                    <p className="font-medium text-text-secondary text-sm mt-1">{a.account_name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5 tracking-[0.15em]">{a.account_number}</p>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="w-full py-8 text-center text-text-tertiary text-sm">
                  No accounts linked yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <CardTitle className="text-base font-semibold">Recent Pulse</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {transactions.slice(0, 5).map((t) => (
                <div 
                  key={t.id} 
                  className="flex justify-between items-center px-5 py-4 hover:bg-[var(--item-hover)] transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${t.type === "credit" ? "bg-[var(--icon-bg-success)] text-success" : "bg-[var(--icon-bg)] text-primary"}`}>
                      {t.type === "credit" ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t.counterparty ?? t.remark}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{t.remark}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      t.type === "credit" 
                        ? "text-success" 
                        : "text-text-primary"
                    }`}
                  >
                    {t.type === "credit" ? "+" : "-"}
                    {formatCurrency(Number(t.amount), t.currency)}
                  </p>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="py-8 text-center text-text-tertiary text-sm">
                  No recent transactions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AiExpenseAnalysis />
    </div>
  );
}
