export interface PendingJustPayRegistration {
  user_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  nic: string;
  mobile: string;
  retrieval_reference: string;
  created_at: string;
}

const pendingRegistrations = new Map<string, PendingJustPayRegistration>();

export function createRetrievalReference() {
  return `E${Date.now().toString().slice(-11)}`;
}

export function savePendingRegistration(registration: PendingJustPayRegistration) {
  pendingRegistrations.set(registration.retrieval_reference, registration);
}

export function getPendingRegistration(reference: string) {
  return pendingRegistrations.get(reference) ?? null;
}

export function consumePendingRegistration(reference: string) {
  const registration = getPendingRegistration(reference);
  if (registration) pendingRegistrations.delete(reference);
  return registration;
}

export function maskAccountNumber(accountNumber: string) {
  const compact = accountNumber.replace(/\D/g, "");
  if (compact.length <= 5) return compact;
  return `${compact.slice(0, 2)}${"*".repeat(Math.max(compact.length - 5, 3))}${compact.slice(-3)}`;
}

export function createAccountToken(reference: string) {
  const random = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `@TER1TBEVST${reference}${random.slice(0, 16)}`;
}
