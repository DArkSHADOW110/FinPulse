"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact, LinkedAccount } from "@/types/database";
import { Smartphone, CheckCircle2, AlertCircle, User } from "lucide-react";

export function TopupForm() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fromId, setFromId] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("dialog");
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
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) =>
        setContacts((d.contacts ?? []).filter((c: Contact) => c.contact_type === "mobile"))
      );
  }, []);

  function pickContact(contactId: string) {
    const c = contacts.find((x) => x.id === contactId);
    if (c) setMobile(c.account_number);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_account_id: fromId,
        mobile_number: mobile,
        amount: Number(amount),
        provider,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Top-up failed" });
    } else {
      setStatus({ type: "success", message: `Top-up successful (${data.reference})` });
      setMobile("");
      setAmount("");
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader className="border-b border-[var(--border)]">
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          Top-up Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={submit} className="space-y-4">
          {contacts.length > 0 && (
            <div>
              <Label className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Saved mobile contact
              </Label>
              <select
                className="mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary transition-all focus:border-primary focus:ring-2 focus:ring-[var(--primary-glow)]"
                defaultValue=""
                onChange={(e) => e.target.value && pickContact(e.target.value)}
              >
                <option value="">Select contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.account_number}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            <Label>Mobile number</Label>
            <Input
              className="mt-2"
              placeholder="07XXXXXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
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
            <Label>Carrier</Label>
            <select
              className="mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary transition-all focus:border-primary focus:ring-2 focus:ring-[var(--primary-glow)]"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="dialog">Dialog</option>
              <option value="mobitel">Mobitel</option>
              <option value="airtel">Airtel</option>
              <option value="hutch">Hutch</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing..." : "Top up"}
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
