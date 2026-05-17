"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Send,
  ArrowDownLeft,
  Smartphone,
  Calendar,
  Pencil,
  Receipt,
  Share2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GlassModal } from "@/components/action-hub/glass-modal";
import { useActionHubController } from "@/components/action-hub/action-hub-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import type { Contact, LinkedAccount } from "@/types/database";
import {
  type BillFormState,
  type ScheduledTransaction,
  type ScheduleMode,
  type SendFormState,
  type TopUpFormState,
  type TopUpTab,
  MOBILE_PROVIDERS,
  SEND_CATEGORIES,
} from "@/components/action-hub/types";

import {
  MODAL_CHECKBOX_LABEL,
  MODAL_FILTER_GROUP,
  MODAL_INPUT,
  MODAL_LABEL,
  MODAL_PANEL,
  MODAL_SELECT,
  MODAL_TAB_ACTIVE,
  MODAL_TAB_INACTIVE,
} from "@/components/action-hub/modal-styles";

const INITIAL_SEND: SendFormState = {
  fromAccountId: "",
  recipientName: "",
  toAccount: "",
  amount: "",
  category: "General",
  remarks: "",
  saveContact: false,
};

const INITIAL_BILL: BillFormState = {
  fromAccountId: "",
  billerName: "",
  referenceNumber: "",
  amount: "",
  remarks: "",
  saveContact: false,
  isScheduled: false,
  scheduleMode: "relative",
  relativeDays: "30",
  monthlyDay: "12",
  scheduledDate: "",
  scheduledTime: "",
};

const INITIAL_TOPUP: TopUpFormState = {
  fromAccountId: "",
  contactName: "",
  provider: "dialog",
  mobileNumber: "",
  amount: "",
  isScheduled: false,
  scheduleMode: "relative",
  relativeDays: "30",
  monthlyDay: "12",
  scheduledDate: "",
  scheduledTime: "",
};

export function ActionHub() {
  const { registerHandlers } = useActionHubController();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpTab, setTopUpTab] = useState<TopUpTab>("topup");

  const [sendForm, setSendForm] = useState<SendFormState>(INITIAL_SEND);
  const [receiveAccountId, setReceiveAccountId] = useState("");
  const [billForm, setBillForm] = useState<BillFormState>(INITIAL_BILL);
  const [topUpForm, setTopUpForm] = useState<TopUpFormState>(INITIAL_TOPUP);

  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [scheduledTransactions, setScheduledTransactions] = useState<ScheduledTransaction[]>([]);

  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [billStatus, setBillStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [topUpStatus, setTopUpStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [editingScheduledId, setEditingScheduledId] = useState<string | null>(null);

  const defaultAccountId = accounts[0]?.id ?? "";

  const bankContacts = useMemo(
    () => contacts.filter((c) => c.contact_type === "bank"),
    [contacts]
  );
  const billContacts = useMemo(
    () => contacts.filter((c) => c.contact_type === "bill"),
    [contacts]
  );
  const mobileContacts = useMemo(
    () => contacts.filter((c) => c.contact_type === "mobile"),
    [contacts]
  );

  const receiveAccount = useMemo(
    () => accounts.find((a) => a.id === receiveAccountId) ?? accounts[0] ?? null,
    [accounts, receiveAccountId]
  );

  const loadData = useCallback(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const list: LinkedAccount[] = d.accounts ?? [];
        setAccounts(list);
        if (list[0]) {
          setSendForm((f) => ({ ...f, fromAccountId: f.fromAccountId || list[0].id }));
          setBillForm((f) => ({ ...f, fromAccountId: f.fromAccountId || list[0].id }));
          setTopUpForm((f) => ({ ...f, fromAccountId: f.fromAccountId || list[0].id }));
          setReceiveAccountId((id) => id || list[0].id);
        }
      });
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveContact(
    label: string,
    contactType: Contact["contact_type"],
    accountNumber: string,
    provider?: string | null
  ) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        contact_type: contactType,
        account_number: accountNumber,
        provider: provider ?? null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setContacts((prev) => [...prev, data.contact]);
    }
  }

  function openSendModal() {
    setSendForm((f) => ({
      ...INITIAL_SEND,
      fromAccountId: defaultAccountId,
    }));
    setSendStatus(null);
    setIsSendModalOpen(true);
  }

  const openSendModalFromAssistant = useCallback(
    (payload: { amount?: number; recipient?: string }) => {
      setSendForm({
        ...INITIAL_SEND,
        fromAccountId: defaultAccountId,
        recipientName: payload.recipient ?? "",
        toAccount: payload.recipient ?? "",
        amount: payload.amount ? String(payload.amount) : "",
      });
      setSendStatus({
        type: "success",
        message: "I prepared the transfer. Please review and confirm before sending.",
      });
      setIsSendModalOpen(true);
    },
    [defaultAccountId]
  );

  function openReceiveModal() {
    setReceiveAccountId(defaultAccountId);
    setShareCopied(false);
    setIsReceiveModalOpen(true);
  }

  function openTopUpModal() {
    setTopUpTab("topup");
    setTopUpForm({ ...INITIAL_TOPUP, fromAccountId: defaultAccountId });
    setBillForm({ ...INITIAL_BILL, fromAccountId: defaultAccountId });
    setBillStatus(null);
    setTopUpStatus(null);
    setIsTopUpModalOpen(true);
  }

  const openBillModalFromAssistant = useCallback(
    (payload: { amount?: number; billerName?: string }) => {
      setTopUpTab("bills");
      setBillForm({
        ...INITIAL_BILL,
        fromAccountId: defaultAccountId,
        billerName: payload.billerName ?? "",
        amount: payload.amount ? String(payload.amount) : "",
      });
      setBillStatus({
        type: "success",
        message: "I prepared the bill payment. Please review and confirm before paying.",
      });
      setIsTopUpModalOpen(true);
    },
    [defaultAccountId]
  );

  useEffect(() => {
    return registerHandlers({
      openSend: openSendModalFromAssistant,
      openBill: openBillModalFromAssistant,
    });
  }, [openBillModalFromAssistant, openSendModalFromAssistant, registerHandlers]);

  function providerValue(provider: string | null) {
    const match = MOBILE_PROVIDERS.find(
      (p) =>
        p.value.toLowerCase() === provider?.toLowerCase() ||
        p.label.toLowerCase() === provider?.toLowerCase()
    );
    return match?.value ?? "dialog";
  }

  function pickBankContactByName(name: string) {
    const contact = bankContacts.find(
      (c) => c.label.toLowerCase() === name.trim().toLowerCase()
    );
    if (!contact) {
      setSendForm((f) => ({ ...f, recipientName: name }));
      return;
    }
    setSendForm((f) => ({
      ...f,
      recipientName: contact.label,
      toAccount: contact.account_number,
      remarks: f.remarks || `Transfer to ${contact.label}`,
    }));
  }

  function pickBillContactByName(name: string) {
    const contact = billContacts.find(
      (c) => c.label.toLowerCase() === name.trim().toLowerCase()
    );
    if (!contact) {
      setBillForm((f) => ({ ...f, billerName: name }));
      return;
    }
    setBillForm((f) => ({
      ...f,
      billerName: contact.label,
      referenceNumber: contact.account_number,
      remarks: f.remarks || contact.provider || "",
    }));
  }

  function pickMobileContactByName(name: string) {
    const contact = mobileContacts.find(
      (c) => c.label.toLowerCase() === name.trim().toLowerCase()
    );
    if (!contact) {
      setTopUpForm((f) => ({ ...f, contactName: name }));
      return;
    }
    setTopUpForm((f) => ({
      ...f,
      contactName: contact.label,
      mobileNumber: contact.account_number,
      provider: providerValue(contact.provider),
    }));
  }

  function addScheduled(item: Omit<ScheduledTransaction, "id">) {
    if (editingScheduledId) {
      setScheduledTransactions((prev) =>
        prev.map((scheduled) =>
          scheduled.id === editingScheduledId ? { ...item, id: scheduled.id } : scheduled
        )
      );
      setEditingScheduledId(null);
      return;
    }
    setScheduledTransactions((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }

  function removeScheduled(id: string) {
    setScheduledTransactions((prev) => prev.filter((t) => t.id !== id));
    if (editingScheduledId === id) setEditingScheduledId(null);
  }

  function scheduleLabel(form: Pick<BillFormState | TopUpFormState, "scheduleMode" | "relativeDays" | "monthlyDay" | "scheduledDate">) {
    if (form.scheduleMode === "relative") return `Pay in ${form.relativeDays || 30} days`;
    if (form.scheduleMode === "monthly") return `Pay on day ${form.monthlyDay || 1} of every month`;
    return form.scheduledDate ? `Pay on ${form.scheduledDate}` : "One-time scheduled payment";
  }

  function schedulePayload(form: BillFormState | TopUpFormState) {
    return {
      scheduleMode: form.scheduleMode,
      scheduleLabel: scheduleLabel(form),
      scheduledDate: form.scheduleMode === "once" ? form.scheduledDate : undefined,
      scheduledTime: form.scheduledTime,
      relativeDays: form.scheduleMode === "relative" ? Number(form.relativeDays || 30) : undefined,
      monthlyDay: form.scheduleMode === "monthly" ? Number(form.monthlyDay || 1) : undefined,
    };
  }

  function editScheduled(item: ScheduledTransaction) {
    setEditingScheduledId(item.id);
    if (item.type === "bill") {
      setBillForm({
        ...INITIAL_BILL,
        ...(item.metadata as Partial<BillFormState>),
        isScheduled: true,
      });
      setBillStatus({
        type: "success",
        message: "Editing scheduled bill. Update details and save again.",
      });
      setTopUpTab("bills");
    } else {
      setTopUpForm({
        ...INITIAL_TOPUP,
        ...(item.metadata as Partial<TopUpFormState>),
        isScheduled: true,
      });
      setTopUpStatus({
        type: "success",
        message: "Editing scheduled top-up. Update details and save again.",
      });
      setTopUpTab("topup");
    }
  }

  async function handleSendSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sendForm.saveContact && sendForm.toAccount) {
      await saveContact(
        sendForm.recipientName || `Recipient ${sendForm.toAccount.slice(-4)}`,
        "bank",
        sendForm.toAccount
      );
    }
    setSendLoading(true);
    setSendStatus(null);
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_account_id: sendForm.fromAccountId,
        to_account_number: sendForm.toAccount,
        amount: Number(sendForm.amount),
        remark: sendForm.remarks || `${sendForm.category} payment`,
      }),
    });
    const data = await res.json();
    setSendLoading(false);
    if (!res.ok) {
      setSendStatus({ type: "error", message: data.error ?? "Transfer failed" });
      return;
    }
    setSendStatus({ type: "success", message: `Transfer sent (${data.reference ?? "OK"})` });
    setSendForm({ ...INITIAL_SEND, fromAccountId: defaultAccountId });
    setTimeout(() => setIsSendModalOpen(false), 1500);
  }

  async function handleBillSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (billForm.isScheduled) {
      addScheduled({
        type: "bill",
        title: billForm.billerName || "Bill payment",
        amount: Number(billForm.amount),
        ...schedulePayload(billForm),
        fromAccountId: billForm.fromAccountId,
        metadata: { ...billForm },
      });
      setBillStatus({ type: "success", message: editingScheduledId ? "Scheduled bill updated" : "Bill payment scheduled" });
      setBillForm({ ...INITIAL_BILL, fromAccountId: defaultAccountId });
      setTopUpTab("scheduled");
      return;
    }
    if (billForm.saveContact && billForm.billerName && billForm.referenceNumber) {
      await saveContact(billForm.billerName, "bill", billForm.referenceNumber);
    }
    setBillLoading(true);
    setBillStatus(null);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_account_id: billForm.fromAccountId,
        biller_account: billForm.referenceNumber,
        amount: Number(billForm.amount),
        reference: billForm.remarks || billForm.billerName,
      }),
    });
    const data = await res.json();
    setBillLoading(false);
    if (!res.ok) {
      setBillStatus({ type: "error", message: data.error ?? "Payment failed" });
      return;
    }
    setBillStatus({ type: "success", message: `Bill paid (${data.reference ?? "OK"})` });
    setBillForm({ ...INITIAL_BILL, fromAccountId: defaultAccountId });
  }

  async function handleTopUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (topUpForm.isScheduled) {
      const providerLabel =
        MOBILE_PROVIDERS.find((p) => p.value === topUpForm.provider)?.label ?? topUpForm.provider;
      addScheduled({
        type: "topup",
        title: `${providerLabel} — ${topUpForm.mobileNumber}`,
        amount: Number(topUpForm.amount),
        ...schedulePayload(topUpForm),
        fromAccountId: topUpForm.fromAccountId,
        metadata: { ...topUpForm },
      });
      setTopUpStatus({ type: "success", message: editingScheduledId ? "Scheduled top-up updated" : "Top-up scheduled" });
      setTopUpForm({ ...INITIAL_TOPUP, fromAccountId: defaultAccountId });
      setTopUpTab("scheduled");
      return;
    }
    setTopUpLoading(true);
    setTopUpStatus(null);
    const res = await fetch("/api/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_account_id: topUpForm.fromAccountId,
        mobile_number: topUpForm.mobileNumber,
        amount: Number(topUpForm.amount),
        provider: topUpForm.provider,
      }),
    });
    const data = await res.json();
    setTopUpLoading(false);
    if (!res.ok) {
      setTopUpStatus({ type: "error", message: data.error ?? "Top-up failed" });
      return;
    }
    setTopUpStatus({ type: "success", message: `Top-up successful (${data.reference ?? "OK"})` });
    setTopUpForm({ ...INITIAL_TOPUP, fromAccountId: defaultAccountId });
  }

  function shareReceiveDetails() {
    if (!receiveAccount) return;
    const text = `Send to ${receiveAccount.account_name}\nAccount: ${receiveAccount.account_number}\nBank: ${receiveAccount.provider}`;
    if (navigator.share) {
      navigator.share({ title: "Receive payment", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  function StatusBanner({
    status,
  }: {
    status: { type: "success" | "error"; message: string } | null;
  }) {
    if (!status) return null;
    return (
      <div
        className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
          status.type === "success"
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        {status.type === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        {status.message}
      </div>
    );
  }

  function ScheduleFields({
    isScheduled,
    onToggle,
    mode,
    relativeDays,
    monthlyDay,
    date,
    time,
    onModeChange,
    onRelativeDaysChange,
    onMonthlyDayChange,
    onDateChange,
    onTimeChange,
  }: {
    isScheduled: boolean;
    onToggle: (v: boolean) => void;
    mode: ScheduleMode;
    relativeDays: string;
    monthlyDay: string;
    date: string;
    time: string;
    onModeChange: (v: ScheduleMode) => void;
    onRelativeDaysChange: (v: string) => void;
    onMonthlyDayChange: (v: string) => void;
    onDateChange: (v: string) => void;
    onTimeChange: (v: string) => void;
  }) {
    return (
      <div className={cn("space-y-3 p-4", MODAL_PANEL)}>
        <label className={MODAL_CHECKBOX_LABEL}>
          <input
            type="checkbox"
            checked={isScheduled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--input-border)] bg-[var(--input-bg)] accent-primary"
          />
          Schedule payment
        </label>
        {isScheduled && (<div className="space-y-3">
              <div>
                <Label className={MODAL_LABEL}>Schedule type</Label>
                <select
                  className={MODAL_SELECT}
                  value={mode}
                  onChange={(e) => onModeChange(e.target.value as ScheduleMode)}
                >
                  <option value="relative">Pay after days</option>
                  <option value="monthly">Monthly day</option>
                  <option value="once">Specific date</option>
                </select>
              </div>
              {mode === "relative" && (
                <div>
                  <Label className={MODAL_LABEL}>Day count</Label>
                  <select
                    className={MODAL_SELECT}
                    value={relativeDays}
                    onChange={(e) => onRelativeDaysChange(e.target.value)}
                  >
                    <option value="30">Pay in 30 days</option>
                    <option value="60">Pay in 60 days</option>
                    <option value="90">Pay in 90 days</option>
                  </select>
                </div>
              )}
              {mode === "monthly" && (
                <div>
                  <Label className={MODAL_LABEL}>Day of every month</Label>
                  <select
                    className={MODAL_SELECT}
                    value={monthlyDay}
                    onChange={(e) => onMonthlyDayChange(e.target.value)}
                  >
                    <option value="12">12 day of all month</option>
                    <option value="25">25 day of all month</option>
                    {Array.from({ length: 28 }, (_, i) => String(i + 1)).map((day) => (
                      <option key={day} value={day}>
                        Day {day} of every month
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
              {mode === "once" && (
              <div>
                <Label className={MODAL_LABEL}>Date</Label>
                <input
                  type="date"
                  className={MODAL_SELECT}
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  required={isScheduled}
                />
              </div>
              )}
              <div>
                <Label className={MODAL_LABEL}>Time</Label>
                <input
                  type="time"
                  className={MODAL_SELECT}
                  value={time}
                  onChange={(e) => onTimeChange(e.target.value)}
                  required={isScheduled}
                />
              </div>
            </div>
            </div>)}
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          Action Hub
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 max-[359px]:grid-cols-1">
        <button
          type="button"
          onClick={openSendModal}
          className="group relative flex flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-slate-300/25 bg-white px-3 py-5 text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.04)] outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/60 active:scale-95 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:shadow-none dark:hover:border-cyan-400/30 dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
        >
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-colors duration-300 group-hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:group-hover:bg-cyan-500/20">
            <Send className="h-5 w-5" />
          </span>
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-slate-800 transition-colors duration-300 dark:text-slate-200">
            Send
          </span>
        </button>
        <button
          type="button"
          onClick={openReceiveModal}
          className="group relative flex flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-slate-300/25 bg-white px-3 py-5 text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.04)] outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/60 active:scale-95 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:shadow-none dark:hover:border-violet-400/30 dark:hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
        >
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors duration-300 group-hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:group-hover:bg-violet-500/20">
            <ArrowDownLeft className="h-5 w-5" />
          </span>
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-slate-800 transition-colors duration-300 dark:text-slate-200">
            Receive
          </span>
        </button>
        <button
          type="button"
          onClick={openTopUpModal}
          className="group relative flex flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-slate-300/25 bg-white px-3 py-5 text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.04)] outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/60 active:scale-95 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:shadow-none dark:hover:border-emerald-400/30 dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]"
        >
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
            <Smartphone className="h-5 w-5" />
          </span>
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-slate-800 transition-colors duration-300 dark:text-slate-200">
            Top-Up
          </span>
        </button>
      </div>

      {/* Send Modal */}
      <GlassModal
        open={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send Money"
        icon={<Send className="h-5 w-5 text-cyan-400" />}
      >
        <form onSubmit={handleSendSubmit} className="space-y-4">
          <div>
            <Label className={MODAL_LABEL}>Pay from account</Label>
            <select
              className={MODAL_SELECT}
              value={sendForm.fromAccountId}
              onChange={(e) => setSendForm((f) => ({ ...f, fromAccountId: e.target.value }))}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} — {a.account_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className={MODAL_LABEL}>Recipient name</Label>
            <Input
              className={MODAL_INPUT}
              placeholder="Type saved contact name"
              list="send-contact-suggestions"
              value={sendForm.recipientName}
              onChange={(e) => pickBankContactByName(e.target.value)}
              required
            />
            <datalist id="send-contact-suggestions">
              {bankContacts.map((c) => (
                <option key={c.id} value={c.label}>
                  {c.account_number}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <Label className={MODAL_LABEL}>Recipient account</Label>
            <Input
              className={MODAL_INPUT}
              placeholder="Account number"
              value={sendForm.toAccount}
              onChange={(e) => setSendForm((f) => ({ ...f, toAccount: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label className={MODAL_LABEL}>Amount (LKR)</Label>
            <Input
              type="number"
              min="1"
              className={MODAL_INPUT}
              value={sendForm.amount}
              onChange={(e) => setSendForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label className={MODAL_LABEL}>Category</Label>
            <select
              className={MODAL_SELECT}
              value={sendForm.category}
              onChange={(e) => setSendForm((f) => ({ ...f, category: e.target.value }))}
            >
              {SEND_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className={MODAL_LABEL}>Remarks (optional)</Label>
            <Input
              className={MODAL_INPUT}
              value={sendForm.remarks}
              onChange={(e) => setSendForm((f) => ({ ...f, remarks: e.target.value }))}
            />
          </div>

          <label className={MODAL_CHECKBOX_LABEL}>
            <input
              type="checkbox"
              checked={sendForm.saveContact}
              onChange={(e) => setSendForm((f) => ({ ...f, saveContact: e.target.checked }))}
              className="h-4 w-4 rounded accent-cyan-500"
            />
            Save this contact for future
          </label>

          <Button type="submit" disabled={sendLoading} className="w-full border-none">
            {sendLoading ? "Sending…" : "Send money"}
          </Button>
          <StatusBanner status={sendStatus} />
        </form>
      </GlassModal>

      {/* Receive Modal */}
      <GlassModal
        open={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Money"
        icon={<ArrowDownLeft className="h-5 w-5 text-violet-400" />}
      >
        <div className="space-y-4">
          <div>
            <Label className={MODAL_LABEL}>Receive to account</Label>
            <select
              className={MODAL_SELECT}
              value={receiveAccountId}
              onChange={(e) => setReceiveAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} — {a.account_number}
                </option>
              ))}
            </select>
          </div>

          {receiveAccount ? (
            <div className={cn("flex flex-col items-center gap-4 p-6", MODAL_PANEL)}>
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG
                  value={receiveAccount.account_number}
                  size={180}
                  level="M"
                  includeMargin
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-text-tertiary">{receiveAccount.account_name}</p>
                <p className="mt-1 text-lg font-semibold tracking-wider text-text-primary">
                  {receiveAccount.account_number}
                </p>
                <p className="mt-1 text-xs capitalize text-text-tertiary">{receiveAccount.provider}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2 border-[var(--border)] bg-[var(--item-hover)] text-text-primary hover:bg-[var(--card-hover)]"
                onClick={shareReceiveDetails}
              >
                <Share2 className="h-4 w-4" />
                {shareCopied ? "Copied!" : "Share details"}
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-text-tertiary">Link an account to receive payments.</p>
          )}
        </div>
      </GlassModal>

      {/* Top-Up & Bills Modal */}
      <GlassModal
        open={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        title="Top-Up & Bills"
        icon={<Smartphone className="h-5 w-5 text-emerald-400" />}
        className="max-w-xl"
      >
        <div className={MODAL_FILTER_GROUP}>
          {(
            [
              { id: "topup" as const, label: "Top-Up" },
              { id: "bills" as const, label: "Bills" },
              { id: "scheduled" as const, label: "Scheduled" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTopUpTab(tab.id)}
              className={topUpTab === tab.id ? MODAL_TAB_ACTIVE : MODAL_TAB_INACTIVE}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {topUpTab === "topup" && (
          <form onSubmit={handleTopUpSubmit} className="space-y-4"><div>
                <Label className={MODAL_LABEL}>Pay from account</Label>
                <select
                  className={MODAL_SELECT}
                  value={topUpForm.fromAccountId}
                  onChange={(e) => setTopUpForm((f) => ({ ...f, fromAccountId: e.target.value }))}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={MODAL_LABEL}>Name</Label>
                <Input
                  className={MODAL_INPUT}
                  placeholder="Type saved mobile contact name"
                  list="topup-contact-suggestions"
                  value={topUpForm.contactName}
                  onChange={(e) => pickMobileContactByName(e.target.value)}
                />
                <datalist id="topup-contact-suggestions">
                  {mobileContacts.map((c) => (
                    <option key={c.id} value={c.label}>
                      {c.account_number}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <Label className={MODAL_LABEL}>Provider</Label>
                <select
                  className={MODAL_SELECT}
                  value={topUpForm.provider}
                  onChange={(e) => setTopUpForm((f) => ({ ...f, provider: e.target.value }))}
                >
                  {MOBILE_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={MODAL_LABEL}>Mobile number</Label>
                <Input
                  className={MODAL_INPUT}
                  placeholder="07XXXXXXXX"
                  value={topUpForm.mobileNumber}
                  onChange={(e) => setTopUpForm((f) => ({ ...f, mobileNumber: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label className={MODAL_LABEL}>Amount (LKR)</Label>
                <Input
                  type="number"
                  min="1"
                  className={MODAL_INPUT}
                  value={topUpForm.amount}
                  onChange={(e) => setTopUpForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
            <ScheduleFields
              isScheduled={topUpForm.isScheduled}
              onToggle={(v) => setTopUpForm((f) => ({ ...f, isScheduled: v }))}
              mode={topUpForm.scheduleMode}
              relativeDays={topUpForm.relativeDays}
              monthlyDay={topUpForm.monthlyDay}
              date={topUpForm.scheduledDate}
              time={topUpForm.scheduledTime}
              onModeChange={(v) => setTopUpForm((f) => ({ ...f, scheduleMode: v }))}
              onRelativeDaysChange={(v) => setTopUpForm((f) => ({ ...f, relativeDays: v }))}
              onMonthlyDayChange={(v) => setTopUpForm((f) => ({ ...f, monthlyDay: v }))}
              onDateChange={(v) => setTopUpForm((f) => ({ ...f, scheduledDate: v }))}
              onTimeChange={(v) => setTopUpForm((f) => ({ ...f, scheduledTime: v }))}
            />
            <Button type="submit" disabled={topUpLoading} className="w-full">
              {topUpLoading
                ? "Processing…"
                : topUpForm.isScheduled
                  ? "Schedule payment"
                  : "Top up now"}
            </Button>
            <StatusBanner status={topUpStatus} />
          </form>
        )}

        {topUpTab === "bills" && (
          <form onSubmit={handleBillSubmit} className="space-y-4">
            <div>
              <Label className={MODAL_LABEL}>Pay from account</Label>
              <select
                className={MODAL_SELECT}
                value={billForm.fromAccountId}
                onChange={(e) => setBillForm((f) => ({ ...f, fromAccountId: e.target.value }))}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className={MODAL_LABEL}>Biller name</Label>
              <Input
                className={MODAL_INPUT}
                placeholder="Type saved biller name"
                list="bill-contact-suggestions"
                value={billForm.billerName}
                onChange={(e) => pickBillContactByName(e.target.value)}
                required
              />
              <datalist id="bill-contact-suggestions">
                {billContacts.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.account_number}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <Label className={MODAL_LABEL}>Account / reference no.</Label>
              <Input
                className={MODAL_INPUT}
                value={billForm.referenceNumber}
                onChange={(e) => setBillForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className={MODAL_LABEL}>Amount (LKR)</Label>
              <Input
                type="number"
                min="1"
                className={MODAL_INPUT}
                value={billForm.amount}
                onChange={(e) => setBillForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className={MODAL_LABEL}>Remarks (optional)</Label>
              <Input
                className={MODAL_INPUT}
                value={billForm.remarks}
                onChange={(e) => setBillForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </div>
            <label className={MODAL_CHECKBOX_LABEL}>
              <input
                type="checkbox"
                checked={billForm.saveContact}
                onChange={(e) => setBillForm((f) => ({ ...f, saveContact: e.target.checked }))}
                className="h-4 w-4 rounded accent-cyan-500"
              />
              Save this biller for future
            </label>
            <ScheduleFields
              isScheduled={billForm.isScheduled}
              onToggle={(v) => setBillForm((f) => ({ ...f, isScheduled: v }))}
              mode={billForm.scheduleMode}
              relativeDays={billForm.relativeDays}
              monthlyDay={billForm.monthlyDay}
              date={billForm.scheduledDate}
              time={billForm.scheduledTime}
              onModeChange={(v) => setBillForm((f) => ({ ...f, scheduleMode: v }))}
              onRelativeDaysChange={(v) => setBillForm((f) => ({ ...f, relativeDays: v }))}
              onMonthlyDayChange={(v) => setBillForm((f) => ({ ...f, monthlyDay: v }))}
              onDateChange={(v) => setBillForm((f) => ({ ...f, scheduledDate: v }))}
              onTimeChange={(v) => setBillForm((f) => ({ ...f, scheduledTime: v }))}
            />
            <Button type="submit" disabled={billLoading} className="w-full">
              {billLoading
                ? "Paying…"
                : billForm.isScheduled
                  ? "Schedule payment"
                  : "Pay bill now"}
            </Button>
            <StatusBanner status={billStatus} />
          </form>
        )}

        {topUpTab === "scheduled" && (<div className="space-y-3">
              {scheduledTransactions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-text-tertiary">
                  <Calendar className="h-10 w-10 opacity-40" />
                  <p className="text-sm">No scheduled payments yet</p>
                </div>
              ) : (
                scheduledTransactions.map((item) => (
                  <div
                    key={item.id}
                    className={cn("flex items-center justify-between gap-3 p-4", MODAL_PANEL)}
                  >
                    <div className="flex items-start gap-3">{item.type === "topup" ? (
                          <Smartphone className="mt-0.5 h-5 w-5 text-emerald-400" />
                        ) : (
                          <Receipt className="mt-0.5 h-5 w-5 text-cyan-400" />
                        )}<div>
                        <p className="font-medium text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-tertiary">
                          {item.scheduleLabel}
                          {item.scheduledTime ? ` at ${item.scheduledTime}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => editScheduled(item)}
                        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label="Edit scheduled payment"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeScheduled(item.id)}
                        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove scheduled payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>)}
      </GlassModal>
    </>
  );
}
