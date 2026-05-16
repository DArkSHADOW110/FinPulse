"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Contact, ContactType } from "@/types/database";
import {
  Contact as ContactIcon,
  Plus,
  Building2,
  Receipt,
  Smartphone,
  Trash2,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons = {
  bank: Building2,
  bill: Receipt,
  mobile: Smartphone,
};

const categories: Array<{
  value: ContactType | "all";
  label: string;
  description: string;
}> = [
  { value: "all", label: "All", description: "Every saved contact" },
  { value: "bank", label: "Bank Accounts", description: "Transfer recipients" },
  { value: "bill", label: "Billing Accounts", description: "Utilities and billers" },
  { value: "mobile", label: "Top-Up Phones", description: "Mobile reload numbers" },
];

const typeLabels: Record<ContactType, string> = {
  bank: "Bank account",
  bill: "Billing account",
  mobile: "Top-up phone",
};

function numberLabel(type: ContactType) {
  if (type === "bank") return "Bank account number";
  if (type === "bill") return "Biller / reference number";
  return "Mobile phone number";
}

function numberPlaceholder(type: ContactType) {
  if (type === "bank") return "Enter recipient bank account";
  if (type === "bill") return "Enter biller account or reference";
  return "07XXXXXXXX";
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ContactType>("bank");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [activeCategory, setActiveCategory] = useState<ContactType | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function load() {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        contact_type: type,
        account_number: account,
        provider: provider || null,
        bank_code: bankCode || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error ?? "Could not save contact" });
      return;
    }
    setLabel("");
    setAccount("");
    setProvider("");
    setBankCode("");
    setEditingId(null);
    setStatus({
      type: "success",
      message: editingId ? "Contact updated successfully." : "Contact saved successfully.",
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
  }

  function edit(contact: Contact) {
    setEditingId(contact.id);
    setLabel(contact.label);
    setType(contact.contact_type);
    setAccount(contact.account_number);
    setProvider(contact.provider ?? "");
    setBankCode(contact.bank_code ?? "");
    setStatus(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setLabel("");
    setAccount("");
    setProvider("");
    setBankCode("");
    setType("bank");
  }

  const filteredContacts = useMemo(
    () =>
      activeCategory === "all"
        ? contacts
        : contacts.filter((contact) => contact.contact_type === activeCategory),
    [activeCategory, contacts]
  );

  const groupedCounts = useMemo(
    () => ({
      all: contacts.length,
      bank: contacts.filter((c) => c.contact_type === "bank").length,
      bill: contacts.filter((c) => c.contact_type === "bill").length,
      mobile: contacts.filter((c) => c.contact_type === "mobile").length,
    }),
    [contacts]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <ContactIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Contacts</h1>
          <p className="text-text-tertiary text-sm mt-1">Bank, bill, and mobile top-up numbers</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
      {/* Add / Update Contact Form */}
      <Card className="relative overflow-hidden lg:col-span-4">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />
        <CardHeader className="border-b border-[var(--border)]">
          <CardTitle className="flex items-center gap-2">
            {editingId ? (
              <Pencil className="h-4 w-4 text-primary" />
            ) : (
              <Plus className="h-4 w-4 text-primary" />
            )}
            {editingId ? "Update Contact" : "Add Contact"}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 pt-5">
          <form onSubmit={create} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                className="mt-2" 
                placeholder={
                  type === "bank"
                    ? "e.g. John Doe"
                    : type === "bill"
                      ? "e.g. CEB Electricity"
                      : "e.g. My Dialog Number"
                }
                value={label} 
                onChange={(e) => setLabel(e.target.value)} 
                required 
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary transition-all focus:border-primary focus:ring-2 focus:ring-[var(--primary-glow)]"
                value={type}
                onChange={(e) => setType(e.target.value as ContactType)}
              >
                <option value="bank">Bank account</option>
                <option value="bill">Billing account</option>
                <option value="mobile">Top-up phone</option>
              </select>
            </div>
            <div>
              <Label>{numberLabel(type)}</Label>
              <Input
                className="mt-2"
                placeholder={numberPlaceholder(type)}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>{type === "bank" ? "Bank / Provider" : "Provider / Biller"}</Label>
              <Input
                className="mt-2"
                placeholder={
                  type === "bank" ? "e.g. Seylan Bank" : type === "bill" ? "e.g. CEB" : "e.g. Dialog"
                }
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
            {type === "bank" && (
              <div>
                <Label>Bank code (optional)</Label>
                <Input
                  className="mt-2"
                  placeholder="e.g. 7083"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : editingId ? "Update contact" : "Save contact"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
          {status && (
            <div
              className={`mt-4 rounded-xl border p-3 text-sm ${
                status.type === "success"
                  ? "border-success/20 bg-success-light text-success"
                  : "border-destructive/20 bg-destructive/10 text-destructive"
              }`}
            >
              {status.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categorized Contacts List */}
      <section className="space-y-5 lg:col-span-8">
        <div className="grid gap-3 md:grid-cols-4">
          {categories.map((category) => {
            const active = activeCategory === category.value;
            return (
              <button
                type="button"
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all duration-200",
                  active
                    ? "border-primary/40 bg-primary/10 shadow-[0_0_25px_var(--primary-glow)]"
                    : "border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)]"
                )}
              >
                <p className="text-sm font-semibold text-text-primary">{category.label}</p>
                <p className="mt-1 text-xs text-text-tertiary">{category.description}</p>
                <p className="mt-3 text-2xl font-bold text-primary">
                  {groupedCounts[category.value]}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredContacts.map((c) => {
            const Icon = typeIcons[c.contact_type] || ContactIcon;
            return (
              <div
                key={c.id}
                className="flex flex-col gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 backdrop-blur-[24px] transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)] md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-primary">{c.label}</p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        {typeLabels[c.contact_type]}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1 font-mono tracking-wider">
                      {c.account_number}
                    </p>
                    {(c.provider || c.bank_code) && (
                      <p className="mt-1 text-xs text-text-tertiary">
                        {[c.provider, c.bank_code].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => edit(c)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(c.id)}
                    className="text-text-tertiary hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-text-tertiary rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
              <ContactIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {contacts.length === 0 ? "No contacts saved yet" : "No contacts in this category"}
              </p>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
