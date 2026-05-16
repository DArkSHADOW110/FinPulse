"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/database";
import { ArrowDownRight, ArrowUpRight, Receipt } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions?limit=50")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Transactions</h1>
        <p className="text-text-tertiary text-sm mt-1">Full activity history</p>
      </div>

      {/* Transaction List */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] backdrop-blur-[24px] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="divide-y divide-[var(--border)]">
          {transactions.map((t) => (
            <div 
              key={t.id} 
              className="flex items-center justify-between px-5 py-4 hover:bg-[var(--item-hover)] transition-colors duration-200"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${
                  t.type === "credit" 
                    ? "bg-success/10 text-success" 
                    : "bg-[var(--input-bg)] text-text-tertiary"
                }`}>
                  {t.type === "credit" ? (
                    <ArrowDownRight className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{t.counterparty ?? t.type}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t.remark} · {formatDate(t.occurred_at)}
                  </p>
                </div>
              </div>
              <p className={`text-base font-semibold tabular-nums ${
                t.type === "credit" ? "text-success" : "text-text-primary"
              }`}>
                {t.type === "credit" ? "+" : "-"}
                {formatCurrency(Number(t.amount), t.currency)}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <Receipt className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
