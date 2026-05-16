import { z } from "zod";

export const toolSchemas = {
  get_account_balance: z
    .object({
      accountId: z.string().optional(),
    })
    .strict(),
  get_recent_transactions: z
    .object({
      days: z.coerce.number().int().min(1).max(365),
    })
    .strict(),
  initiate_transfer: z
    .object({
      amount: z.coerce.number(),
      recipient: z.string(),
    })
    .strict(),
  pay_bill: z
    .object({
      billerName: z.string(),
      amount: z.coerce.number(),
    })
    .strict(),
  toggle_theme: z
    .object({
      mode: z.enum(["light", "dark"]),
    })
    .strict(),
  execute_transfer: z
    .object({
      amount: z.coerce.number().positive(),
      recipientName: z.string().optional(),
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      fromAccountId: z.string().optional(),
      remark: z.string().optional(),
    })
    .strict(),
  execute_bill_payment: z
    .object({
      amount: z.coerce.number().positive(),
      billerName: z.string().optional(),
      billerAccount: z.string().optional(),
      reference: z.string().optional(),
      fromAccountId: z.string().optional(),
    })
    .strict(),
  execute_mobile_topup: z
    .object({
      amount: z.coerce.number().positive(),
      contactName: z.string().optional(),
      mobileNumber: z.string().optional(),
      provider: z.string().optional(),
      fromAccountId: z.string().optional(),
    })
    .strict(),
  save_contact: z
    .object({
      label: z.string().min(1),
      contactType: z.enum(["bank", "bill", "mobile"]),
      accountNumber: z.string().min(1),
      bankCode: z.string().optional(),
      provider: z.string().optional(),
    })
    .strict(),
  delete_contact: z
    .object({
      label: z.string().min(1),
      contactType: z.enum(["bank", "bill", "mobile"]).optional(),
    })
    .strict(),
  analyze_finances: z
    .object({
      days: z.coerce.number().int().min(1).max(365).optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      groupBy: z.enum(["none", "category", "account", "type"]).optional(),
    })
    .strict(),
  create_jar: z
    .object({
      name: z.string().min(1),
      targetAmount: z.coerce.number().positive().optional(),
      initialAmount: z.coerce.number().positive().optional(),
    })
    .strict(),
  fund_jar: z
    .object({
      jarName: z.string().min(1),
      amount: z.coerce.number().positive(),
      isVirtual: z.boolean().optional(),
    })
    .strict(),
  delete_jar: z
    .object({
      jarName: z.string().min(1),
    })
    .strict(),
  create_schedule: z
    .object({
      label: z.string().min(1),
      amount: z.coerce.number().positive(),
      dayOfMonth: z.coerce.number().int().min(1).max(28),
    })
    .strict(),
};

export type ToolName = keyof typeof toolSchemas;

export type ToolArgs = {
  [K in ToolName]: z.infer<(typeof toolSchemas)[K]>;
};

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_account_balance",
      description: "Fetch account balances. If accountId is omitted, returns all linked balances.",
      parameters: {
        type: "object",
        properties: {
          accountId: {
            type: "string",
            description: "Optional linked account UUID.",
          },
        },
        additionalProperties: false,
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_recent_transactions",
      description: "Fetch recent user transactions for a strict number of days.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Number of days to look back, e.g. 1, 7, or 30.",
          },
        },
        additionalProperties: false,
        required: ["days"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "initiate_transfer",
      description:
        "Open and pre-fill the Send Money modal. Use this instead of only explaining how to send money.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          recipient: { type: "string" },
        },
        additionalProperties: false,
        required: ["amount", "recipient"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pay_bill",
      description:
        "Open and pre-fill the Bills tab in the Top-Up & Bills command center.",
      parameters: {
        type: "object",
        properties: {
          billerName: { type: "string" },
          amount: { type: "number" },
        },
        additionalProperties: false,
        required: ["billerName", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "toggle_theme",
      description: "Switch the app theme.",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["light", "dark"] },
        },
        additionalProperties: false,
        required: ["mode"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "execute_transfer",
      description:
        "Prepare a real transfer from chat. Resolve saved bank contacts by name, or use accountNumber/bankName provided by the user. Requires chat confirmation before execution.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          recipientName: { type: "string" },
          accountNumber: { type: "string" },
          bankName: { type: "string" },
          fromAccountId: { type: "string" },
          remark: { type: "string" },
        },
        additionalProperties: false,
        required: ["amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "execute_bill_payment",
      description:
        "Prepare a bill payment from chat. Resolve saved bill contacts by name or use a biller account/reference. Requires chat confirmation before execution.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          billerName: { type: "string" },
          billerAccount: { type: "string" },
          reference: { type: "string" },
          fromAccountId: { type: "string" },
        },
        additionalProperties: false,
        required: ["amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "execute_mobile_topup",
      description:
        "Prepare a mobile top-up from chat. Resolve saved mobile contacts by name or use a phone number. Requires chat confirmation before execution.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          contactName: { type: "string" },
          mobileNumber: { type: "string" },
          provider: { type: "string" },
          fromAccountId: { type: "string" },
        },
        additionalProperties: false,
        required: ["amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_contact",
      description: "Save a bank, bill, or mobile contact when the user asks to save a number.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string" },
          contactType: { type: "string", enum: ["bank", "bill", "mobile"] },
          accountNumber: { type: "string" },
          bankCode: { type: "string" },
          provider: { type: "string" },
        },
        additionalProperties: false,
        required: ["label", "contactType", "accountNumber"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_contact",
      description: "Prepare removal of a saved contact. Always requires chat confirmation before deleting.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string" },
          contactType: { type: "string", enum: ["bank", "bill", "mobile"] },
        },
        additionalProperties: false,
        required: ["label"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_finances",
      description:
        "Analyze expenses, deposits, balances, categories, accounts, and transaction totals for a timeframe. Use for questions like today's expenses, monthly deposits, category spend, or account-based analysis.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number" },
          fromDate: { type: "string" },
          toDate: { type: "string" },
          groupBy: { type: "string", enum: ["none", "category", "account", "type"] },
        },
        additionalProperties: false,
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_jar",
      description: "Create a savings jar from chat.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          targetAmount: { type: "number" },
          initialAmount: { type: "number" },
        },
        additionalProperties: false,
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fund_jar",
      description: "Prepare adding money to a jar. Requires chat confirmation before funding.",
      parameters: {
        type: "object",
        properties: {
          jarName: { type: "string" },
          amount: { type: "number" },
          isVirtual: { type: "boolean" },
        },
        additionalProperties: false,
        required: ["jarName", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_jar",
      description: "Prepare deleting a jar. Always requires chat confirmation before deleting.",
      parameters: {
        type: "object",
        properties: {
          jarName: { type: "string" },
        },
        additionalProperties: false,
        required: ["jarName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_schedule",
      description: "Create a recurring scheduled payment by monthly day.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string" },
          amount: { type: "number" },
          dayOfMonth: { type: "number" },
        },
        additionalProperties: false,
        required: ["label", "amount", "dayOfMonth"],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are FinPulse AI, a concise fintech assistant.
Use tools only when the user clearly requests an app action or financial data.
For transfers, bill payments, top-ups, jar funding, or deletes, prepare the action and require confirmation when the tool returns confirmationRequired.
For save-contact requests, save exactly the label, type, and number given by the user.
For analysis questions, use analyze_finances and summarize totals clearly.
If a required detail is missing, ask one short follow-up question instead of guessing.
Never claim an action succeeded unless a tool result says it succeeded.
Keep replies short and practical.`;
