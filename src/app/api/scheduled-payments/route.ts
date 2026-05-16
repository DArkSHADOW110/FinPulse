import { withAuth } from "@/lib/api/response";
import * as schedulesRepo from "@/lib/repositories/scheduled-payments";

export async function GET() {
  return withAuth(async (user) => {
    const scheduled_payments = await schedulesRepo.listScheduledPayments(user.id);
    return { scheduled_payments };
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return withAuth(async (user) => {
    const scheduled_payment = await schedulesRepo.createScheduledPayment(user.id, body);
    return { scheduled_payment };
  });
}
