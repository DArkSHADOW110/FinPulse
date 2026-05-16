import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { analyzeExpenses } from "@/lib/groq/agent";
import {
  filterExpenseTransactions,
  sumExpenses,
  TIME_RANGE_DAYS,
  type InsightTimeRange,
} from "@/lib/insights/chart-data";
import * as transactionsRepo from "@/lib/repositories/transactions";

function parseRange(value: string | null): InsightTimeRange {
  const allowed: InsightTimeRange[] = ["1d", "7d", "30d", "6m", "1y"];
  if (value && allowed.includes(value as InsightTimeRange)) {
    return value as InsightTimeRange;
  }
  return "7d";
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));

  const transactions = await transactionsRepo.listTransactions(user.id, 500);
  const debits = filterExpenseTransactions(transactions, range);
  const totalSpend = sumExpenses(debits);

  const analysis = await analyzeExpenses(
    debits.map((t) => ({
      remark: t.remark,
      amount: Number(t.amount),
      category: t.category,
      type: t.type,
    }))
  );

  return NextResponse.json({
    range,
    rangeDays: TIME_RANGE_DAYS[range],
    totalSpend,
    transactionCount: debits.length,
    analysis,
  });
}
