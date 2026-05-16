import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import * as jarsRepo from "@/lib/repositories/jars";
import * as transactionsRepo from "@/lib/repositories/transactions";
import { memoryStore } from "@/lib/repositories/memory-store";
import type { Jar } from "@/types/database";

type AutoContribution = {
  enabled?: boolean;
  amount?: number;
  frequency?: "weekly" | "monthly";
  next_run_at?: string;
};

function readAuto(jar: Jar): AutoContribution {
  return (jar.metadata?.auto_contribution ?? {}) as AutoContribution;
}

function nextRun(from: Date, frequency: AutoContribution["frequency"]) {
  const d = new Date(from);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

async function listAllJars(): Promise<Jar[]> {
  const supabase = createAdminClient();
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase.from("jars").select("*");
    return (data as Jar[]) ?? [];
  }
  return Array.from(memoryStore.jars.values()).flat();
}

export async function GET() {
  const now = new Date();
  const jars = await listAllJars();
  const processed: Array<{ jarId: string; amount: number; name: string }> = [];

  for (const jar of jars) {
    const auto = readAuto(jar);
    if (!auto.enabled || !auto.amount || !auto.next_run_at) continue;
    if (new Date(auto.next_run_at).getTime() > now.getTime()) continue;

    const updated = await jarsRepo.fundJar(jar.user_id, jar.id, Number(auto.amount), false);
    if (!updated) continue;

    const updatedMetadata = {
      ...(updated.metadata ?? {}),
      auto_contribution: {
        ...auto,
        next_run_at: nextRun(now, auto.frequency),
      },
    };
    await jarsRepo.updateJar(jar.user_id, jar.id, { metadata: updatedMetadata });
    await transactionsRepo.createTransaction(jar.user_id, {
      linked_account_id: null,
      type: "debit",
      amount: Number(auto.amount),
      currency: "LKR",
      counterparty: jar.name,
      remark: `Auto jar deposit: ${jar.name}`,
      category: "Savings",
      status: "completed",
    });
    processed.push({ jarId: jar.id, amount: Number(auto.amount), name: jar.name });
  }

  return NextResponse.json({ processed });
}
