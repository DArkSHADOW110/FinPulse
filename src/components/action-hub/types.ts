export type TopUpTab = "topup" | "bills" | "scheduled";
export type ScheduleMode = "once" | "relative" | "monthly";

export interface SendFormState {
  fromAccountId: string;
  recipientName: string;
  toAccount: string;
  amount: string;
  category: string;
  remarks: string;
  saveContact: boolean;
}

export interface BillFormState {
  fromAccountId: string;
  billerName: string;
  referenceNumber: string;
  amount: string;
  remarks: string;
  saveContact: boolean;
  isScheduled: boolean;
  scheduleMode: ScheduleMode;
  relativeDays: string;
  monthlyDay: string;
  scheduledDate: string;
  scheduledTime: string;
}

export interface TopUpFormState {
  fromAccountId: string;
  contactName: string;
  provider: string;
  mobileNumber: string;
  amount: string;
  isScheduled: boolean;
  scheduleMode: ScheduleMode;
  relativeDays: string;
  monthlyDay: string;
  scheduledDate: string;
  scheduledTime: string;
}

export interface ScheduledTransaction {
  id: string;
  type: "topup" | "bill";
  title: string;
  amount: number;
  scheduleMode: ScheduleMode;
  scheduleLabel: string;
  scheduledDate?: string;
  scheduledTime: string;
  relativeDays?: number;
  monthlyDay?: number;
  fromAccountId: string;
  metadata: Record<string, unknown>;
}

export const SEND_CATEGORIES = [
  "General",
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Education",
] as const;

export const MOBILE_PROVIDERS = [
  { value: "dialog", label: "Dialog" },
  { value: "mobitel", label: "Mobitel" },
  { value: "airtel", label: "Airtel" },
  { value: "hutch", label: "Hutch" },
] as const;
