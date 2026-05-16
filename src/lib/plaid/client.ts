import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

type PlaidEnv = keyof typeof PlaidEnvironments;

function plaidEnv(): PlaidEnv {
  const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  if (env === "production") return "production";
  if (env === "development") return "development";
  return "sandbox";
}

export function isPlaidConfigured() {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function getPlaidClient() {
  if (!isPlaidConfigured()) {
    throw new Error("Plaid is not configured. Add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV.");
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[plaidEnv()],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });

  return new PlaidApi(configuration);
}

export function getPlaidProducts(): Products[] {
  const products = process.env.PLAID_PRODUCTS ?? "transactions";
  return products
    .split(",")
    .map((product) => product.trim())
    .filter(Boolean) as Products[];
}

export function getPlaidCountryCodes(): CountryCode[] {
  const countryCodes = process.env.PLAID_COUNTRY_CODES ?? "US";
  return countryCodes
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean) as CountryCode[];
}
