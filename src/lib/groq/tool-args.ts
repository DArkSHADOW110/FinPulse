import { toolSchemas, type ToolName } from "@/lib/groq/tool-schemas";

const MAX_TX_LIMIT = 100;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Coerce model/tool payloads to a plain integer limit for get_recent_transactions. */
export function coerceTransactionLimit(input: unknown): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return clamp(Math.floor(input), 1, MAX_TX_LIMIT);
  }
  if (typeof input === "string" && input.trim() !== "") {
    const n = parseInt(input, 10);
    if (Number.isFinite(n)) return clamp(n, 1, MAX_TX_LIMIT);
  }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const o = input as Record<string, unknown>;
    const candidate = o.limit ?? o.days ?? o.count;
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return clamp(Math.floor(candidate), 1, MAX_TX_LIMIT);
    }
    if (typeof candidate === "string") {
      const n = parseInt(candidate, 10);
      if (Number.isFinite(n)) return clamp(n, 1, MAX_TX_LIMIT);
    }
  }
  return 20;
}

export function normalizeToolArguments(
  toolName: string,
  rawArguments: string
): { parsed: Record<string, unknown>; argumentsJson: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArguments || "{}");
  } catch {
    parsed = {};
  }

  if (toolName in toolSchemas) {
    const normalized = normalizeKnownToolArguments(toolName as ToolName, parsed);
    return { parsed: normalized, argumentsJson: JSON.stringify(normalized) };
  }

  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>;
    return { parsed: record, argumentsJson: JSON.stringify(record) };
  }

  return { parsed: {}, argumentsJson: "{}" };
}

function normalizeKnownToolArguments(toolName: ToolName, parsed: unknown): Record<string, unknown> {
  const input =
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  switch (toolName) {
    case "get_account_balance":
      return typeof input.accountId === "string" && input.accountId.trim()
        ? { accountId: input.accountId }
        : {};
    case "get_recent_transactions": {
      const daysCandidate = input.days ?? input.limit ?? input.count;
      const days =
        typeof daysCandidate === "number" || typeof daysCandidate === "string"
          ? Number(daysCandidate)
          : 7;
      return { days: Number.isFinite(days) ? Math.max(1, Math.min(365, Math.floor(days))) : 7 };
    }
    case "initiate_transfer":
      return {
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
        recipient: typeof input.recipient === "string" ? input.recipient : "",
      };
    case "pay_bill":
      return {
        billerName: typeof input.billerName === "string" ? input.billerName : "",
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
      };
    case "toggle_theme":
      return { mode: input.mode === "light" ? "light" : "dark" };
    case "execute_transfer":
      return {
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
        recipientName: typeof input.recipientName === "string" ? input.recipientName : undefined,
        accountNumber: typeof input.accountNumber === "string" ? input.accountNumber : undefined,
        bankName: typeof input.bankName === "string" ? input.bankName : undefined,
        fromAccountId: typeof input.fromAccountId === "string" ? input.fromAccountId : undefined,
        remark: typeof input.remark === "string" ? input.remark : undefined,
      };
    case "execute_bill_payment":
      return {
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
        billerName: typeof input.billerName === "string" ? input.billerName : undefined,
        billerAccount: typeof input.billerAccount === "string" ? input.billerAccount : undefined,
        reference: typeof input.reference === "string" ? input.reference : undefined,
        fromAccountId: typeof input.fromAccountId === "string" ? input.fromAccountId : undefined,
      };
    case "execute_mobile_topup":
      return {
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
        contactName: typeof input.contactName === "string" ? input.contactName : undefined,
        mobileNumber: typeof input.mobileNumber === "string" ? input.mobileNumber : undefined,
        provider: typeof input.provider === "string" ? input.provider : undefined,
        fromAccountId: typeof input.fromAccountId === "string" ? input.fromAccountId : undefined,
      };
    case "save_contact":
      return {
        label: typeof input.label === "string" ? input.label : "",
        contactType:
          input.contactType === "bill" || input.contactType === "mobile" ? input.contactType : "bank",
        accountNumber: typeof input.accountNumber === "string" ? input.accountNumber : "",
        bankCode: typeof input.bankCode === "string" ? input.bankCode : undefined,
        provider: typeof input.provider === "string" ? input.provider : undefined,
      };
    case "delete_contact":
      return {
        label: typeof input.label === "string" ? input.label : "",
        contactType:
          input.contactType === "bank" || input.contactType === "bill" || input.contactType === "mobile"
            ? input.contactType
            : undefined,
      };
    case "analyze_finances": {
      const days = Number(input.days);
      return {
        days: Number.isFinite(days) ? Math.max(1, Math.min(365, Math.floor(days))) : undefined,
        fromDate: typeof input.fromDate === "string" ? input.fromDate : undefined,
        toDate: typeof input.toDate === "string" ? input.toDate : undefined,
        groupBy:
          input.groupBy === "category" || input.groupBy === "account" || input.groupBy === "type"
            ? input.groupBy
            : "none",
      };
    }
    case "create_jar":
      return {
        name: typeof input.name === "string" ? input.name : "",
        targetAmount: Number.isFinite(Number(input.targetAmount)) ? Number(input.targetAmount) : undefined,
        initialAmount: Number.isFinite(Number(input.initialAmount)) ? Number(input.initialAmount) : undefined,
      };
    case "fund_jar":
      return {
        jarName: typeof input.jarName === "string" ? input.jarName : "",
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
        isVirtual: Boolean(input.isVirtual),
      };
    case "delete_jar":
      return { jarName: typeof input.jarName === "string" ? input.jarName : "" };
    case "create_schedule":
      return {
        label: typeof input.label === "string" ? input.label : "",
        amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
        dayOfMonth: Number.isFinite(Number(input.dayOfMonth)) ? Number(input.dayOfMonth) : 1,
      };
  }
}

export function validateToolArguments(
  toolName: string,
  args: Record<string, unknown>
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  if (!(toolName in toolSchemas)) return { ok: true, data: args };
  const schema = toolSchemas[toolName as ToolName];
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }
  return { ok: true, data: parsed.data as Record<string, unknown> };
}
