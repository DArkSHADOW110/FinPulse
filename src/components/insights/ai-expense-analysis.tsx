"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/insights/chart-skeleton";
import {
  buildCategoryChartData,
  buildTimelineChartData,
  CHART_COLORS,
  filterExpenseTransactions,
  TIME_RANGE_DAYS,
  TIME_RANGE_LABELS,
  type InsightTimeRange,
} from "@/lib/insights/chart-data";
import { formatCurrency, cn } from "@/lib/utils";
import type { Transaction } from "@/types/database";
import { Activity, BarChart3, Brain, Sparkles } from "lucide-react";

type ChartView = "category" | "timeline";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  borderColor: "var(--card-border)",
  borderRadius: "12px",
  color: "var(--text-primary)",
};

export function AiExpenseAnalysis() {
  const [timeRange, setTimeRange] = useState<InsightTimeRange>("7d");
  const [chartType, setChartType] = useState<ChartView>("category");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadTransactions = useCallback(() => {
    setChartsLoading(true);
    return fetch("/api/transactions?limit=500")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setChartsLoading(false));
  }, []);

  const loadAnalysis = useCallback(() => {
    setAnalysisLoading(true);
    return fetch(`/api/expense-analysis?range=${timeRange}`)
      .then((r) => r.json())
      .then((d) => setAnalysis(d.analysis ?? ""))
      .catch(() => setAnalysis(""))
      .finally(() => setAnalysisLoading(false));
  }, [timeRange]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, timeRange]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const filteredExpenses = useMemo(
    () => filterExpenseTransactions(transactions, timeRange),
    [transactions, timeRange]
  );

  const categoryData = useMemo(
    () => buildCategoryChartData(filteredExpenses),
    [filteredExpenses]
  );
  const timelineData = useMemo(
    () => buildTimelineChartData(filteredExpenses),
    [filteredExpenses]
  );

  const activeChartData = chartType === "category" ? categoryData : timelineData;
  const hasChartData = activeChartData.length > 0;

  async function regenerateAnalysis() {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/expense-analysis?range=${timeRange}`);
      const data = await res.json();
      setAnalysis(data.analysis ?? "");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const filterBtnClass = (active: boolean) =>
    cn(
      "text-[10px] uppercase font-bold px-3 py-1.5 rounded-md transition-all",
      active
        ? "bg-primary text-black shadow-[0_0_10px_var(--primary-glow)]"
        : "text-text-tertiary hover:bg-[var(--item-hover)] hover:text-text-primary"
    );

  const filterGroupClass =
    "flex rounded-lg border border-[var(--border)] bg-[var(--item-hover)] p-1";

  return (
    <Card className="relative w-full overflow-hidden border-[var(--card-border)]">
      <div className="pointer-events-none absolute right-0 top-0 rounded-full bg-primary/5 p-32 blur-[120px]" />
      <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          AI Expense Analysis
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={regenerateAnalysis}
          disabled={isAnalyzing || analysisLoading}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          {isAnalyzing ? "Analyzing…" : "Refresh AI insights"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-8 px-5 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-text-primary">
                {chartType === "category" ? (
                  <BarChart3 className="h-4 w-4 text-primary" />
                ) : (
                  <Activity className="h-4 w-4 text-primary" />
                )}
                {chartType === "category" ? "Spending by Category" : "Expenses Timeline"}
              </h3>
              <div className={filterGroupClass}>
                <button
                  type="button"
                  onClick={() => setChartType("category")}
                  className={filterBtnClass(chartType === "category")}
                >
                  Category
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("timeline")}
                  className={filterBtnClass(chartType === "timeline")}
                >
                  Timeline
                </button>
              </div>
            </div>
          <div className={cn(filterGroupClass, "flex-wrap")}>
            {TIME_RANGE_LABELS.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeRange(tf)}
                className={filterBtnClass(timeRange === tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {chartsLoading ? (
          <ChartSkeleton />
        ) : hasChartData ? (
          <div className="h-[250px] w-full animate-in fade-in duration-300">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "category" ? (
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-tertiary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-tertiary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rs.${(Number(v) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Amount"]}
                    cursor={{ fill: "var(--item-hover)" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-tertiary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-tertiary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rs.${(Number(v) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Amount"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "var(--background)",
                      stroke: "var(--primary)",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6, fill: "var(--primary)" }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--item-hover)]">
            <p className="text-sm font-medium text-text-tertiary">
              No expenses in the last {TIME_RANGE_DAYS[timeRange]} day
              {TIME_RANGE_DAYS[timeRange] === 1 ? "" : "s"}.
            </p>
          </div>
        )}

        <div className="h-px w-full bg-[var(--border)]" />

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Brain className="h-4 w-4 text-primary" />
            AI Insights
            <span className="flex items-center gap-1 text-xs font-normal text-text-tertiary">
              <Sparkles className="h-3 w-3" /> Groq
            </span>
          </h3>
          {analysisLoading || isAnalyzing ? (
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-5">
              <div className="h-3 w-full animate-pulse rounded bg-[var(--border)]" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--border)]" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-[var(--border)]" />
            </div>
          ) : analysis ? (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-5 leading-relaxed text-text-secondary">
              {analysis}
            </article>
          ) : (
            <p className="py-6 text-center text-sm text-text-tertiary">
              No analysis yet. Add transactions or refresh AI insights.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}