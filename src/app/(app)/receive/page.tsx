"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import type { LinkedAccount } from "@/types/database";
import { ArrowLeftRight, Building2, CreditCard, User, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReceivePage() {
  const [primary, setPrimary] = useState<LinkedAccount | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const list: LinkedAccount[] = d.accounts ?? [];
        setPrimary(list.find((a) => a.is_primary) ?? list[0] ?? null);
      });
  }, []);

  function copyToClipboard() {
    if (primary) {
      navigator.clipboard.writeText(primary.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Receive</h1>
          <p className="text-text-tertiary text-sm mt-1">Share your account details to receive payments</p>
        </div>
      </div>

      {/* Account Details Card */}
      <Card className="max-w-lg">
        <CardHeader className="border-b border-[var(--border)]">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Your Receiving Account
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {primary ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)]">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">Account Name</p>
                  <p className="font-medium text-text-primary mt-0.5">{primary.account_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)]">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">Account Number</p>
                  <p className="font-mono font-medium text-text-primary mt-0.5 tracking-wider">{primary.account_number}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="text-text-tertiary hover:text-primary"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)]">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">Bank</p>
                  <p className="font-medium text-text-primary mt-0.5 capitalize">{primary.provider}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Link an account from the Accounts page first.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
