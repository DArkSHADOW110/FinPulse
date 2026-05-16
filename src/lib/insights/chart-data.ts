import type { Transaction } from "@/types/database";

export type InsightTimeRange = "1d" | "7d" | "30d" | "6m" | "1y";

export const TIME_RANGE_DAYS: Record<InsightTimeRange, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "6m": 180,
  "1y": 365,
};

export const TIME_RANGE_LABELS: InsightTimeRange[] = ["1d", "7d", "30d", "6m", "1y"];

export const CHART_COLORS = [
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
];

export interface ChartPoint {
  name: string;
  value: number;
}

function txTimestamp(t: Transaction) {
  return new Date(t.occurred_at || t.created_at).getTime();
}

export function filterExpenseTransactions(
  transactions: Transaction[],
  range: InsightTimeRange
): Transaction[] {
  const days = TIME_RANGE_DAYS[range];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return transactions.filter((t) => {
    if (t.type === "credit") return false;
    return txTimestamp(t) >= cutoff;
  });
}

export function buildCategoryChartData(transactions: Transaction[]): ChartPoint[] {
  const totals: Record<string, number> = {};
  for (const t of transactions) {
    const cat = (t.category || inferCategoryFromRemark(t.remark)).trim() || "General";
    totals[cat] = (totals[cat] || 0) + Number(t.amount);
  }
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildTimelineChartData(transactions: Transaction[]): ChartPoint[] {
  const byDay = new Map<number, number>();
  for (const t of transactions) {
    const d = new Date(t.occurred_at || t.created_at);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount));
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, value]) => ({
      name: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
    }));
}

function inferCategoryFromRemark(remark: string | null): string {
  const r = (remark ?? "").toLowerCase();
  if (r.includes("grocery") || r.includes("food")) return "Food";
  if (r.includes("bill") || r.includes("electric")) return "Utilities";
  if (r.includes("ride") || r.includes("transport")) return "Transport";
  if (r.includes("mobile") || r.includes("dialog")) return "Telecom";
  return "General";
}

export function sumExpenses(transactions: Transaction[]) {
  return transactions.reduce((s, t) => s + Number(t.amount), 0);
}
