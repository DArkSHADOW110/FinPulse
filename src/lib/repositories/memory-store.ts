import type {
  ChatMessage,
  Contact,
  Jar,
  LinkedAccount,
  ScheduledPayment,
  Transaction,
} from "@/types/database";

export const memoryStore = {
  accounts: new Map<string, LinkedAccount[]>(),
  transactions: new Map<string, Transaction[]>(),
  jars: new Map<string, Jar[]>(),
  contacts: new Map<string, Contact[]>(),
  schedules: new Map<string, ScheduledPayment[]>(),
  chat: new Map<string, ChatMessage[]>(),
};

function list<T>(map: Map<string, T[]>, userId: string): T[] {
  return map.get(userId) ?? [];
}

function push<T extends { id: string }>(map: Map<string, T[]>, userId: string, item: T) {
  const arr = map.get(userId) ?? [];
  arr.push(item);
  map.set(userId, arr);
  return item;
}

export { list, push };
