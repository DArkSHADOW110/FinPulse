import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export const GROQ_MODEL = "llama-3.3-70b-versatile";
