import { Subscription, Transaction } from '../types';
import { tursoService } from './tursoService';
import { normalizeTransactionDate } from '../utils/financials';

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
  return new Date(year, monthIndex, validDay, 0, 0, 0, 0);
}

/**
 * Checks active subscriptions and auto-generates expense transactions
 * based on the user's browser/device date.
 * - For monthly subscriptions: enforces monthly idempotency (max 1 tx per month).
 * - For annual subscriptions: generates if less than 12 months from next payment date (max 1 tx per year).
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
    if (sub.frequency === 'annual') {
      const subMonthIndex = (sub.billingMonth || 1) - 1;
      const currentYearKey = `${year}-`;
      const existsThisYear = currentTransactions.some(
        (tx) => tx.subscriptionId === sub.id && tx.date.startsWith(currentYearKey)
      );

      let targetDate: Date | null = null;

      if (!existsThisYear) {
        // Current year payment not yet generated
        targetDate = getSubscriptionTargetDate(sub.billingDay, year, subMonthIndex);
      } else {
        // Current year already exists, check if next year's payment is within 12 months
        const nextYear = year + 1;
        const nextYearKey = `${nextYear}-`;
        const existsNextYear = currentTransactions.some(
          (tx) => tx.subscriptionId === sub.id && tx.date.startsWith(nextYearKey)
        );

        if (!existsNextYear) {
          const nextYearTarget = getSubscriptionTargetDate(sub.billingDay, nextYear, subMonthIndex);
          const twelveMonthsAhead = new Date(year + 1, monthIndex, referenceDate.getDate(), 23, 59, 59, 999);
          if (nextYearTarget.getTime() <= twelveMonthsAhead.getTime()) {
            targetDate = nextYearTarget;
          }
        }
      }

      if (targetDate) {
        const targetIso = normalizeTransactionDate(targetDate);
        try {
          const createdTx = await tursoService.addTransaction({
            type: 'expense',
            title: sub.title,
            amount: sub.amount,
            currencyId: sub.currencyId,
            categoryId: sub.categoryId,
            paymentMethodId: sub.paymentMethodId,
            bankId: sub.bankId,
            store: sub.store,
            subscriptionId: sub.id,
            date: targetIso,
            notes: sub.notes ? sub.notes : undefined,
          });
          newTransactions.push(createdTx);
        } catch (e) {
          console.error(`Failed to auto-generate annual transaction for subscription ${sub.title}:`, e);
        }
      }
    } else {
      // Monthly subscription logic
      const existingForMonth = currentTransactions.find(
        (tx) => tx.subscriptionId === sub.id && tx.date.startsWith(currentMonthKey)
      );

      if (!existingForMonth) {
        const targetDate = getSubscriptionTargetDate(sub.billingDay, year, monthIndex);
        const targetIso = normalizeTransactionDate(targetDate);

        try {
          const createdTx = await tursoService.addTransaction({
            type: 'expense',
            title: sub.title,
            amount: sub.amount,
            currencyId: sub.currencyId,
            categoryId: sub.categoryId,
            paymentMethodId: sub.paymentMethodId,
            bankId: sub.bankId,
            store: sub.store,
            subscriptionId: sub.id,
            date: targetIso,
            notes: sub.notes ? sub.notes : undefined,
          });
          newTransactions.push(createdTx);
        } catch (e) {
          console.error(`Failed to auto-generate monthly transaction for subscription ${sub.title}:`, e);
        }
      }
    }
  }

  return newTransactions;
}

/**
 * When a subscription's billing day or month is updated, updates the date of the current period's
 * transaction (current year for annual subscriptions, current month for monthly subscriptions).
 * Past historical transactions remain untouched.
 */
export async function handleSubscriptionBillingUpdate(
  updatedSub: Subscription,
  currentTransactions: Transaction[],
  referenceDate: Date = new Date()
): Promise<void> {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const monthStr = String(monthIndex + 1).padStart(2, '0');

  if (updatedSub.frequency === 'annual') {
    const currentYearKey = `${year}-`;
    const currentYearTx = currentTransactions.find(
      (tx) => tx.subscriptionId === updatedSub.id && tx.date.startsWith(currentYearKey)
    );

    if (currentYearTx) {
      const subMonthIndex = (updatedSub.billingMonth || 1) - 1;
      const newTargetDate = getSubscriptionTargetDate(updatedSub.billingDay, year, subMonthIndex);
      const newIso = normalizeTransactionDate(newTargetDate);

      if (currentYearTx.date !== newIso) {
        try {
          await tursoService.updateTransaction(currentYearTx.id, {
            type: currentYearTx.type,
            title: updatedSub.title,
            amount: updatedSub.amount,
            currencyId: updatedSub.currencyId,
            categoryId: updatedSub.categoryId,
            paymentMethodId: updatedSub.paymentMethodId,
            bankId: updatedSub.bankId,
            store: updatedSub.store,
            date: newIso,
            notes: currentYearTx.notes,
            subscriptionId: updatedSub.id,
          });
        } catch (e) {
          console.error(`Failed to update current year transaction date for annual subscription ${updatedSub.title}:`, e);
        }
      }
    }
  } else {
    const currentMonthKey = `${year}-${monthStr}`;
    const currentMonthTx = currentTransactions.find(
      (tx) => tx.subscriptionId === updatedSub.id && tx.date.startsWith(currentMonthKey)
    );

    if (currentMonthTx) {
      const newTargetDate = getSubscriptionTargetDate(updatedSub.billingDay, year, monthIndex);
      const newIso = normalizeTransactionDate(newTargetDate);

      if (currentMonthTx.date !== newIso) {
        try {
          await tursoService.updateTransaction(currentMonthTx.id, {
            type: currentMonthTx.type,
            title: updatedSub.title,
            amount: updatedSub.amount,
            currencyId: updatedSub.currencyId,
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
}

/** Backward compatibility alias */
export const handleSubscriptionBillingDayUpdate = handleSubscriptionBillingUpdate;

