import {
  getSubscriptionTargetDate,
  processSubscriptionAutoGeneration,
  handleSubscriptionBillingDayUpdate,
} from '../subscriptionAutoGenerator';
import { tursoService } from '../tursoService';
import { Subscription, Transaction } from '../../types';

jest.mock('../tursoService', () => ({
  tursoService: {
    addTransaction: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'tx-mock-' + Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        ...data,
      })
    ),
    updateTransaction: jest.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        createdAt: new Date().toISOString(),
        ...data,
      })
    ),
  },
}));

describe('subscriptionAutoGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionTargetDate', () => {
    it('calculates date accurately for standard months', () => {
      const date = getSubscriptionTargetDate(15, 2026, 7); // Aug 15, 2026
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(7);
      expect(date.getDate()).toBe(15);
    });

    it('clamps billing day 31 to Feb 28 in non-leap year', () => {
      const date = getSubscriptionTargetDate(31, 2027, 1); // Feb 2027
      expect(date.getFullYear()).toBe(2027);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(28);
    });

    it('clamps billing day 31 to Feb 29 in leap year', () => {
      const date = getSubscriptionTargetDate(31, 2028, 1); // Feb 2028
      expect(date.getFullYear()).toBe(2028);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });
  });

  describe('processSubscriptionAutoGeneration', () => {
    const activeSub: Subscription = {
      id: 'sub-active-1',
      title: 'Spotify Premium',
      amount: 21.9,
      currency: 'BRL',
      category: 'Entertainment',
      billingDay: 10,
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const inactiveSub: Subscription = {
      id: 'sub-inactive-1',
      title: 'Gym Membership',
      amount: 110.0,
      currency: 'BRL',
      category: 'Health',
      billingDay: 5,
      active: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('generates transaction for active subscription if not generated for current month', async () => {
      const refDate = new Date(2026, 7, 11); // August 11, 2026
      const existingTxs: Transaction[] = [];

      const generated = await processSubscriptionAutoGeneration([activeSub, inactiveSub], existingTxs, refDate);

      expect(generated.length).toBe(1);
      expect(generated[0].title).toBe('Spotify Premium');
      expect(generated[0].subscriptionId).toBe('sub-active-1');
      expect(generated[0].amount).toBe(21.9);
      expect(tursoService.addTransaction).toHaveBeenCalledTimes(1);
    });

    it('enforces idempotency: does not generate duplicate transaction if month transaction exists', async () => {
      const refDate = new Date(2026, 7, 11); // August 11, 2026
      const existingTxs: Transaction[] = [
        {
          id: 'tx-existing-1',
          type: 'expense',
          title: 'Spotify Premium',
          amount: 21.9,
          currency: 'BRL',
          category: 'Entertainment',
          subscriptionId: 'sub-active-1',
          date: '2026-08-10T12:00:00.000Z',
          createdAt: '2026-08-10T12:00:00.000Z',
        },
      ];

      const generated = await processSubscriptionAutoGeneration([activeSub], existingTxs, refDate);

      expect(generated.length).toBe(0);
      expect(tursoService.addTransaction).not.toHaveBeenCalled();
    });

    it('does not generate transaction for inactive subscriptions', async () => {
      const refDate = new Date(2026, 7, 11);
      const generated = await processSubscriptionAutoGeneration([inactiveSub], [], refDate);

      expect(generated.length).toBe(0);
      expect(tursoService.addTransaction).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionBillingDayUpdate', () => {
    it('updates transaction date for current month when billingDay changes', async () => {
      const refDate = new Date(2026, 7, 11); // August 2026
      const sub: Subscription = {
        id: 'sub-1',
        title: 'Cloud VPS',
        amount: 30.0,
        currency: 'USD',
        category: 'Services',
        billingDay: 25, // Updated from 5 to 25
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-11T00:00:00.000Z',
      };

      const currentMonthTx: Transaction = {
        id: 'tx-august-1',
        type: 'expense',
        title: 'Cloud VPS',
        amount: 30.0,
        currency: 'USD',
        category: 'Services',
        subscriptionId: 'sub-1',
        date: '2026-08-05T12:00:00.000Z', // Old date (day 5)
        createdAt: '2026-08-05T12:00:00.000Z',
      };

      const pastMonthTx: Transaction = {
        id: 'tx-july-1',
        type: 'expense',
        title: 'Cloud VPS',
        amount: 30.0,
        currency: 'USD',
        category: 'Services',
        subscriptionId: 'sub-1',
        date: '2026-07-05T12:00:00.000Z', // Past month (July 5)
        createdAt: '2026-07-05T12:00:00.000Z',
      };

      await handleSubscriptionBillingDayUpdate(sub, [currentMonthTx, pastMonthTx], refDate);

      expect(tursoService.updateTransaction).toHaveBeenCalledTimes(1);
      expect(tursoService.updateTransaction).toHaveBeenCalledWith(
        'tx-august-1',
        expect.objectContaining({
          date: new Date(2026, 7, 25, 12, 0, 0, 0).toISOString(),
        })
      );
    });

    it('does not touch past month transactions when billingDay changes', async () => {
      const refDate = new Date(2026, 7, 11); // August 2026
      const sub: Subscription = {
        id: 'sub-1',
        title: 'Cloud VPS',
        amount: 30.0,
        currency: 'USD',
        category: 'Services',
        billingDay: 25,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-11T00:00:00.000Z',
      };

      const pastMonthTxOnly: Transaction = {
        id: 'tx-july-1',
        type: 'expense',
        title: 'Cloud VPS',
        amount: 30.0,
        currency: 'USD',
        category: 'Services',
        subscriptionId: 'sub-1',
        date: '2026-07-05T12:00:00.000Z', // Past month (July)
        createdAt: '2026-07-05T12:00:00.000Z',
      };

      await handleSubscriptionBillingDayUpdate(sub, [pastMonthTxOnly], refDate);

      expect(tursoService.updateTransaction).not.toHaveBeenCalled();
    });
  });
});
