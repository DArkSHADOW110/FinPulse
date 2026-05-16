import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getPlaidClient, getPlaidCountryCodes, getPlaidProducts } from "@/lib/plaid/client";

function plaidErrorPayload(error: unknown) {
  const responseData =
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
      ? (error.response as { data?: unknown }).data
      : null;

  if (responseData && typeof responseData === "object") {
    const data = responseData as {
      error_message?: string;
      error_code?: string;
      error_type?: string;
      request_id?: string;
    };
    return {
      error: data.error_message ?? "Plaid link token creation failed",
      error_code: data.error_code,
      error_type: data.error_type,
      request_id: data.request_id,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Unable to create Plaid link token",
  };
}

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plaidClient = getPlaidClient();
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id || user.email || crypto.randomUUID(),
      },
      client_name: "FinPulse",
      products: getPlaidProducts(),
      country_codes: getPlaidCountryCodes(),
      language: "en",
    });

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
      request_id: response.data.request_id,
    });
  } catch (error) {
    return NextResponse.json(plaidErrorPayload(error), { status: 500 });
  }
}
