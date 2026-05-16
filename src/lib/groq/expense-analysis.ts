import { getGroqClient, GROQ_MODEL } from "@/lib/groq/client";

export async function analyzeExpenses(
  transactions: Array<{
    remark: string | null;
    amount: number;
    category: string | null;
    type: string;
  }>
): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    return "Configure GROQ_API_KEY to generate AI expense insights.";
  }

  const summary = transactions
    .slice(0, 100)
    .map(
      (t) =>
        `${t.type} ${t.amount} LKR — ${t.remark ?? "no remark"} ${t.category ? `[${t.category}]` : ""}`
    )
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a personal finance analyst. Summarize spending patterns, top categories inferred from remarks, and 3 actionable savings tips. Use markdown headings and bullet points.",
      },
      {
        role: "user",
        content: `Analyze these transactions:\n\n${summary}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content ?? "No analysis generated.";
}
