import type { BankingAdapter } from "@/lib/banking/adapter";
import { mockAdapter } from "@/lib/banking/mock";
import { seylanAdapter } from "@/lib/banking/seylan";

export function getBankingAdapter(): BankingAdapter {
  if (seylanAdapter.isConfigured()) {
    return seylanAdapter;
  }
  return mockAdapter;
}

export { type BankingAdapter } from "@/lib/banking/adapter";
export { seylanAdapter } from "@/lib/banking/seylan";
export { mockAdapter } from "@/lib/banking/mock";
