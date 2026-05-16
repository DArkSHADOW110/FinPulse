export type ContactType = "bank" | "bill" | "mobile";
export type TransactionType = "credit" | "debit" | "transfer" | "bill" | "topup";
export type TransactionStatus = "pending" | "completed" | "failed";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: string;
  external_account_id: string | null;
  account_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  balance: number;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  linked_account_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  counterparty: string | null;
  remark: string | null;
  category: string | null;
  status: TransactionStatus;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface Jar {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | null;
  balance: number;
  actual_saved: number;
  virtual_saved: number;
  color: string;
  icon: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  label: string;
  contact_type: ContactType;
  account_number: string;
  bank_code: string | null;
  provider: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ScheduledPayment {
  id: string;
  user_id: string;
  contact_id: string | null;
  linked_account_id: string | null;
  label: string;
  amount: number;
  currency: string;
  day_of_month: number;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: unknown;
  metadata: Record<string, unknown>;
  created_at: string;
}
