import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { executeAgentTool } from "@/lib/groq/actions";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq/client";
export { analyzeExpenses } from "@/lib/groq/expense-analysis";
import { normalizeToolArguments } from "@/lib/groq/tool-args";
import { AGENT_TOOLS, SYSTEM_PROMPT } from "@/lib/groq/tools";
import * as contactsRepo from "@/lib/repositories/contacts";
import * as jarsRepo from "@/lib/repositories/jars";
import * as transactionsRepo from "@/lib/repositories/transactions";
import * as chatRepo from "@/lib/repositories/chat";
import type { User } from "@/types/database";

const GROQ_REPLY_TOKEN_LIMIT = 600;
const GROQ_TEMPERATURE = 0.1;

function chooseTools(userMessage: string) {
  const text = userMessage.toLowerCase();
  const names = new Set<string>();

  if (/\b(balance|account|net worth|money|linked)\b/.test(text)) names.add("get_account_balance");
  if (/\b(transaction|transactions|spent|expense|expenses|deposit|deposits|analysis|analyze|today|week|month|category)\b/.test(text)) {
    names.add("analyze_finances");
    names.add("get_recent_transactions");
  }
  if (/\b(send|transfer|pay\s+\d+.*to)\b/.test(text)) names.add("execute_transfer");
  if (/\b(bill|biller|electric|water|internet)\b/.test(text)) names.add("execute_bill_payment");
  if (/\b(topup|top up|reload|mobile|phone|telephone)\b/.test(text)) names.add("execute_mobile_topup");
  if (/\b(save|contact|number)\b/.test(text)) names.add("save_contact");
  if (/\b(remove|delete)\b/.test(text)) {
    names.add("delete_contact");
    names.add("delete_jar");
  }
  if (/\b(jar|jars|saving|goal)\b/.test(text)) {
    names.add("create_jar");
    names.add("fund_jar");
    names.add("delete_jar");
  }
  if (/\b(schedule|scheduled|monthly|recurring)\b/.test(text)) names.add("create_schedule");
  if (/\b(light|dark|theme)\b/.test(text)) names.add("toggle_theme");

  if (names.size === 0) {
    names.add("get_account_balance");
    names.add("analyze_finances");
  }

  return AGENT_TOOLS.filter((tool) => names.has(tool.function.name));
}

function getResult(item: unknown) {
  return item && typeof item === "object" && "result" in item
    ? (item as { result?: unknown }).result
    : null;
}

function deterministicToolReply(toolResults: unknown[]) {
  const lastResult = [...toolResults].reverse().map(getResult).find(Boolean);
  if (!lastResult || typeof lastResult !== "object") return null;

  if ("confirmAction" in lastResult) {
    const action = (lastResult as { confirmAction?: unknown }).confirmAction;
    const prompt = (lastResult as { prompt?: unknown }).prompt;
    if (typeof prompt === "string") return prompt;
    if (action && typeof action === "object" && "label" in action) {
      const label = (action as { label?: unknown }).label;
      if (typeof label === "string") return `${label}\n\nReply "yes" to confirm or "no" to cancel.`;
    }
  }

  if ("error" in lastResult && typeof (lastResult as { error?: unknown }).error === "string") {
    return (lastResult as { error: string }).error;
  }

  const status = "status" in lastResult ? (lastResult as { status?: unknown }).status : null;
  if (status === "CONTACT_SAVED" || status === "CONTACT_UPDATED") {
    const contact = (lastResult as { contact?: { label?: string; contact_type?: string } }).contact;
    return `${status === "CONTACT_SAVED" ? "Saved" : "Updated"} ${contact?.label ?? "the contact"} as a ${contact?.contact_type ?? "contact"}.`;
  }
  if (status === "JAR_CREATED") {
    const message = (lastResult as { message?: unknown }).message;
    if (typeof message === "string") return message;
    const jar = (lastResult as { jar?: { name?: string } }).jar;
    return `Created jar ${jar?.name ?? "successfully"}.`;
  }
  if (status === "JAR_FUNDED") {
    const message = (lastResult as { message?: unknown }).message;
    if (typeof message === "string") return message;
    return "Added funds to the jar.";
  }
  if (status === "SCHEDULE_CREATED") {
    return "Created the scheduled payment.";
  }
  if (status === "THEME_CHANGE_REQUESTED") {
    return "Theme changed.";
  }

  return null;
}

async function handleSimpleCommands(user: User, userMessage: string) {
  const text = userMessage.trim();
  const contactSaveIntent = /\b(save|add|create)\b.*\b(contact|number|phone|telephone|mobile|bank|bill)\b/i.test(text);
  if (contactSaveIntent && !/[+\d][\d\s-]{6,}/.test(text)) {
    return {
      reply:
        "I can't save that contact because the number is missing. Please include the number, for example: `save mobile number 0761772110 name as Imesh2`.",
      toolResults: [
        {
          tool: "save_contact",
          result: {
            error:
              "Contact number is required. Example: save mobile number 0761772110 name as Imesh2.",
          },
        },
      ],
    };
  }
  const savePhone = text.match(/save\s+(?:the\s+)?contact.*?(?:phone|telephone|mobile)\s+number\s+([+\d\s-]{7,}).*?name\s+as\s+([a-zA-Z\s]+)/i);
  if (savePhone) {
    const accountNumber = savePhone[1].replace(/\s+/g, "");
    const label = savePhone[2].trim();
    const contact = await contactsRepo.createContact(user.id, {
      label,
      contact_type: "mobile",
      account_number: accountNumber,
      provider: null,
      bank_code: null,
    });
    return {
      reply: `Saved ${contact.label} as a mobile contact.`,
      toolResults: [{ tool: "save_contact", result: { status: "CONTACT_SAVED", contact } }],
    };
  }

  const createJar = text.match(
    /create\s+(?:a\s+)?jar\s+(?:named|called)\s+(.+?)(?:\s+and\s+add\s+(?:initial\s+)?(?:balance\s+)?(?:as\s+)?(?:a\s+)?(\d+(?:\.\d+)?))?$/i
  );
  if (createJar) {
    const name = createJar[1].trim();
    const initialAmount = Number(createJar[2] ?? 0);
    const jar = await jarsRepo.createJar(user.id, { name, target_amount: null });
    if (initialAmount > 0) {
      const fundedJar = await jarsRepo.fundJar(user.id, jar.id, initialAmount, false);
      await transactionsRepo.createTransaction(user.id, {
        linked_account_id: null,
        type: "debit",
        amount: initialAmount,
        currency: "LKR",
        counterparty: jar.name,
        remark: `Jar deposit: ${jar.name}`,
        category: "Savings",
        status: "completed",
      });
      return {
        reply: `Created jar ${jar.name} and added initial balance LKR ${initialAmount.toLocaleString()}.`,
        toolResults: [
          {
            tool: "create_jar",
            result: {
              status: "JAR_CREATED",
              jar: fundedJar ?? jar,
              message: `Created jar ${jar.name} and added initial balance LKR ${initialAmount.toLocaleString()}.`,
            },
          },
        ],
      };
    }
    return {
      reply: `Created jar ${jar.name}.`,
      toolResults: [{ tool: "create_jar", result: { status: "JAR_CREATED", jar } }],
    };
  }

  return null;
}

export async function runAgentChat(
  user: User,
  userMessage: string
): Promise<{ reply: string; toolResults?: unknown[] }> {
  const groq = getGroqClient();
  if (!groq) {
    return {
      reply:
        "Groq API is not configured. Add GROQ_API_KEY to your environment to enable the AI assistant.",
    };
  }

  await chatRepo.saveMessage(user.id, "user", userMessage);
  const simpleResult = await handleSimpleCommands(user, userMessage);
  if (simpleResult) {
    await chatRepo.saveMessage(user.id, "assistant", simpleResult.reply, {
      toolResults: simpleResult.toolResults,
    });
    return simpleResult;
  }
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];
  const tools = chooseTools(userMessage);

  let completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    tools,
    tool_choice: "auto",
    temperature: GROQ_TEMPERATURE,
    max_tokens: GROQ_REPLY_TOKEN_LIMIT,
  });

  let choice = completion.choices[0]?.message;
  const toolResults: unknown[] = [];

  while (choice?.tool_calls?.length) {
    const sanitizedCalls = choice.tool_calls.map((call) => {
      const { argumentsJson } = normalizeToolArguments(
        call.function.name,
        call.function.arguments || "{}"
      );
      return {
        ...call,
        function: { ...call.function, arguments: argumentsJson },
      };
    });

    messages.push({
      role: "assistant",
      content: choice.content ?? "",
      tool_calls: sanitizedCalls,
    });

    for (const call of sanitizedCalls) {
      const fn = call.function;
      const { parsed } = normalizeToolArguments(fn.name, fn.arguments || "{}");
      let result: unknown;
      try {
        result = await executeAgentTool(user, fn.name, parsed);
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : "Tool execution failed",
        };
      }
      toolResults.push({ tool: fn.name, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }

    completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools,
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_REPLY_TOKEN_LIMIT,
    });
    choice = completion.choices[0]?.message;
  }

  const reply =
    deterministicToolReply(toolResults) ||
    choice?.content?.trim() ||
    "I completed the requested actions. Let me know if you need anything else.";

  await chatRepo.saveMessage(user.id, "assistant", reply, {
    toolResults: toolResults.length ? toolResults : undefined,
  });

  return { reply, toolResults: toolResults.length ? toolResults : undefined };
}
