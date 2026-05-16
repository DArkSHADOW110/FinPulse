import { withAuth } from "@/lib/api/response";
import * as transactionsRepo from "@/lib/repositories/transactions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  return withAuth(async (user) => {
    const transactions = await transactionsRepo.listTransactions(user.id, limit);
    return { transactions };
  });
}
