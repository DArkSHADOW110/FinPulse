"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, HeroCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  filterExpenseTransactions,
  sumExpenses,
  TIME_RANGE_DAYS,
  type InsightTimeRange,
} from "@/lib/insights/chart-data";
import type { Transaction } from "@/types/database";
import { Brain, LineChart, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InsightsPage() {
  const [timeRange] = useState<InsightTimeRange>("30d");
  const [totalSpend, setTotalSpend] = useState(0);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions?limit=500").then((r) => r.json()),
      fetch(`/api/expense-analysis?range=${timeRange}`).then((r) => r.json()),
    ])
      .then(([txData, analysisData]) => {
        const txs: Transaction[] = txData.transactions ?? [];
        const filtered = filterExpenseTransactions(txs, timeRange);
        setTotalSpend(sumExpenses(filtered));
        setAnalysis(analysisData.analysis ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [timeRange]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <LineChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
              Expense Insights
            </h1>
            <p className="mt-1 text-sm text-text-tertiary">
              Summary metrics and AI narrative. Interactive charts live on the dashboard.
            </p>
          </div>
        </div>

        <HeroCard className="max-w-md p-6">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-destructive/10 p-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-sm font-medium text-text-tertiary">
                Total spending (last {TIME_RANGE_DAYS[timeRange]} days)
              </span>
            </div>
            <p className="text-[2.5rem] font-bold tracking-tighter text-text-primary">
              {loading ? (
                <span className="inline-block h-10 w-40 animate-pulse rounded-lg bg-[var(--border)]" />
              ) : (
                formatCurrency(totalSpend)
              )}
            </p>
          </div>
        </HeroCard>

        <Card>
          <CardHeader className="border-b border-[var(--border)]">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {loading ? (
              <div className="flex items-center gap-3 text-text-tertiary">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                </div>
                <span className="text-sm">Generating insights…</span>
              </div>
            ) : analysis ? (
              <article className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-text-secondary">
                {analysis}
              </article>
            ) : (
              <p className="py-6 text-center text-sm text-text-tertiary">
                No analysis available yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--card-border)] bg-[var(--item-hover)]">
          <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              View spending charts, category breakdown, and timeline filters on your dashboard.
            </p>
            <Link href="/dashboard">
              <Button size="sm">Open dashboard charts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
}