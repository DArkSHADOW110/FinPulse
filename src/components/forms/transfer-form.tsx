"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LinkedAccount } from "@/types/database";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function TransferForm() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [fromId, setFromId] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const list = d.accounts ?? [];
        setAccounts(list);
        if (list[0]) setFromId(list[0].id);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_account_id: fromId,
        to_account_number: to,
        amount: Number(amount),
        remark,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Transfer failed" });
    } else {
      setStatus({ type: "success", message: `Transfer submitted (${data.reference})` });
      setTo("");
      setAmount("");
      setRemark("");
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader className="border-b border-[var(--border)]">
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Transfer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>From account</Label>
            <select
              className="mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary transition-all focus:border-primary focus:ring-2 focus:ring-[var(--primary-glow)]"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} — {a.account_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>To account number</Label>
            <Input 
              className="mt-2" 
              placeholder="Enter recipient account number"
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              required 
            />
          </div>
          <div>
            <Label>Amount (LKR)</Label>
            <Input
              className="mt-2"
              type="number"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Remark (optional)</Label>
            <Input 
              className="mt-2" 
              placeholder="Add a note"
              value={remark} 
              onChange={(e) => setRemark(e.target.value)} 
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send transfer"}
          </Button>
          
          {status && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              status.type === "success" 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            }`}>
              {status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {status.message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
