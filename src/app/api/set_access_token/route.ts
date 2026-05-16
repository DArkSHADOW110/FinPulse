import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getPlaidClient } from "@/lib/plaid/client";
import * as accountsRepo from "@/lib/repositories/accounts";

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
      error: data.error_message ?? "Plaid public token exchange failed",
      error_code: data.error_code,
      error_type: data.error_type,
      request_id: data.request_id,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Plaid public token exchange failed",
  };
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const publicToken = String(body.public_token ?? "");
  if (!publicToken) {
    return NextResponse.json({ error: "public_token is required" }, { status: 400 });
  }

  try {
    const plaidClient = getPlaidClient();
    const exchange = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    // TODO: Encrypt and save accessToken in a dedicated secure credentials table.
    // This demo stores it as the linked account external identifier through the existing repository shape.
    console.log("Plaid access_token:", accessToken);

    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const firstPlaidAccount = accountsResponse.data.accounts[0];
    const institutionName =
      typeof body.institution_name === "string" && body.institution_name.trim()
        ? body.institution_name
        : "Plaid Institution";
    const mask =
      firstPlaidAccount?.mask ||
      (typeof body.account_mask === "string" ? body.account_mask.replace(/\D/g, "") : "") ||
      "0000";
    const balance = Number(
      firstPlaidAccount?.balances.current ??
        firstPlaidAccount?.balances.available ??
        firstPlaidAccount?.balances.limit ??
        0
    );
    const currency = "LKR";

    const account = await accountsRepo.linkTokenizedJustPayAccount(user.id, {
      provider: institutionName,
      bank_code: "PLAID",
      account_mask: `**${mask}`,
      account_token: accessToken,
      retrieval_reference: itemId,
      account_name: firstPlaidAccount?.name ?? `${institutionName} Linked Account`,
      account_type: firstPlaidAccount?.subtype ?? firstPlaidAccount?.type ?? "plaid",
      currency,
      balance,
    });

    return NextResponse.json({
      status: "SUCCESS",
      item_id: itemId,
      account,
      plaid_balance: {
        current: firstPlaidAccount?.balances.current ?? null,
        available: firstPlaidAccount?.balances.available ?? null,
        source_currency: firstPlaidAccount?.balances.iso_currency_code ?? "USD",
        display_currency: currency,
      },
      request_id: exchange.data.request_id,
    });
  } catch (error) {
    return NextResponse.json(plaidErrorPayload(error), { status: 500 });
  }
}
