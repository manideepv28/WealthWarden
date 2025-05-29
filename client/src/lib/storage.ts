import { Transaction } from "@shared/schema";

export function saveTransactionsToLocal(userId: number, transactions: Transaction[]): void {
  const key = `financeApp_transactions_${userId}`;
  localStorage.setItem(key, JSON.stringify(transactions));
}

export function getTransactionsFromLocal(userId: number): Transaction[] {
  try {
    const key = `financeApp_transactions_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addTransactionToLocal(userId: number, transaction: Transaction): void {
  const transactions = getTransactionsFromLocal(userId);
  transactions.unshift(transaction);
  saveTransactionsToLocal(userId, transactions);
}

export function removeTransactionFromLocal(userId: number, transactionId: number): void {
  const transactions = getTransactionsFromLocal(userId);
  const filtered = transactions.filter(t => t.id !== transactionId);
  saveTransactionsToLocal(userId, filtered);
}
