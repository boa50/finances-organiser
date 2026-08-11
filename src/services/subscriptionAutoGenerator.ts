import { Subscription, Transaction } from '../types';
import { tursoService } from './tursoService';

/**
 * Calculates the target Date object for a given billing day in a specific year and month.
 * Handles short months gracefully (e.g., billing day 31 in Feb becomes Feb 28/29).
 */
export function getSubscriptionTargetDate(
  billingDay: number,
  year: number,
  monthIndex: number // 0-indexed: 0 for Jan, 7 for Aug, etc.
): Date {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const validDay = Math.min(Math.max(billingDay, 1), daysInMonth);
  return new Date(year, monthIndex, validDay, 12, 0, 0, 0);
}

/**
 * Checks active subscriptions and auto-generates monthly expense transactions
 * based on the user's browser/device date. Enforces idempotency (max 1 transaction
 * per subscription per month).
 *
 * @param subscriptions List of all subscriptions
 * @param currentTransactions Current list of transactions
 * @param referenceDate Optional reference date for testing (defaults to user's device/browser date)
 * @returns Array of newly added transactions
 */
export async function processSubscriptionAutoGeneration(
  subscriptions: Subscription[],
  currentTransactions: Transaction[],
  referenceDate: Date = new Date()
): Promise<Transaction[]> {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth(); // 0 - 11
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const currentMonthKey = `${year}-${monthStr}`; // e.g. "2026-08"

  const activeSubs = subscriptions.filter((sub) => sub.active);
  const newTransactions: Transaction[] = [];

  for (const sub of activeSubs) {
    // Check idempotency: does a transaction for this subscription exist in current month?
    const existingForMonth = currentTransactions.find(
      (tx) => tx.subscriptionId === sub.id && tx.date.startsWith(currentMonthKey)
    );

    if (!existingForMonth) {
      const targetDate = getSubscriptionTargetDate(sub.billingDay, year, monthIndex);
      const targetIso = targetDate.toISOString();

      try {
        const createdTx = await tursoService.addTransaction({
          type: 'expense',
          title: sub.title,
          amount: sub.amount,
          currency: sub.currency,
          categoryId: sub.categoryId,
          paymentMethodId: sub.paymentMethodId,
          bankId: sub.bankId,
          store: sub.store,
          subscriptionId: sub.id,
          date: targetIso,
          notes: sub.notes ? sub.notes : 'Monthly recurring subscription',
        });
        newTransactions.push(createdTx);
      } catch (e) {
        console.error(`Failed to auto-generate transaction for subscription ${sub.title}:`, e);
      }
    }
  }

  return newTransactions;
}

/**
 * When a subscription's billing day is updated, updates the date of the current month's
 * transaction (if one already exists for this subscription in the current month).
 * Past month transactions remain untouched.
 */
export async function handleSubscriptionBillingDayUpdate(
  updatedSub: Subscription,
  currentTransactions: Transaction[],
  referenceDate: Date = new Date()
): Promise<void> {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const currentMonthKey = `${year}-${monthStr}`;

  const currentMonthTx = currentTransactions.find(
    (tx) => tx.subscriptionId === updatedSub.id && tx.date.startsWith(currentMonthKey)
  );

  if (currentMonthTx) {
    const newTargetDate = getSubscriptionTargetDate(updatedSub.billingDay, year, monthIndex);
    const newIso = newTargetDate.toISOString();

    if (currentMonthTx.date !== newIso) {
      try {
        await tursoService.updateTransaction(currentMonthTx.id, {
          type: currentMonthTx.type,
          title: updatedSub.title,
          amount: updatedSub.amount,
          currency: updatedSub.currency,
          categoryId: updatedSub.categoryId,
          paymentMethodId: updatedSub.paymentMethodId,
          bankId: updatedSub.bankId,
          store: updatedSub.store,
          date: newIso,
          notes: currentMonthTx.notes,
          subscriptionId: updatedSub.id,
        });
      } catch (e) {
        console.error(`Failed to update current month transaction date for subscription ${updatedSub.title}:`, e);
      }
    }
  }
}
