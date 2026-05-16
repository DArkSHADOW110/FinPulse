import { withAuth } from "@/lib/api/response";
import * as jarsRepo from "@/lib/repositories/jars";

export async function GET() {
  return withAuth(async (user) => {
    const jars = await jarsRepo.listJars(user.id);
    return { jars };
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return withAuth(async (user) => {
    const jar = await jarsRepo.createJar(user.id, {
      name: body.name,
      target_amount: body.target_amount,
      color: body.color,
      metadata: body.metadata,
    });
    return { jar };
  });
}
