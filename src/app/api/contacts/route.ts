import { withAuth } from "@/lib/api/response";
import * as contactsRepo from "@/lib/repositories/contacts";

export async function GET() {
  return withAuth(async (user) => {
    const contacts = await contactsRepo.listContacts(user.id);
    return { contacts };
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return withAuth(async (user) => {
    const contact = await contactsRepo.createContact(user.id, body);
    return { contact };
  });
}
