import {
  getSubscriptionTargetDate,
  processSubscriptionAutoGeneration,
  handleSubscriptionBillingDayUpdate,
  handleSubscriptionBillingUpdate,
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

    it('clamps billing day 31 to April 30 in 30-day month', () => {
      const date = getSubscriptionTargetDate(31, 2026, 3); // April 2026
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3);
      expect(date.getDate()).toBe(30);
    });
  });

  describe('processSubscriptionAutoGeneration', () => {
    const activeSub: Subscription = {
      id: 'sub-active-1',
      title: 'Spotify Premium',
      amount: 21.9,
      currencyId: 'BRL',
      categoryId: 'cat-ent-1',
      frequency: 'monthly',
      billingDay: 10,
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const inactiveSub: Subscription = {
      id: 'sub-inactive-1',
      title: 'Gym Membership',
      amount: 110.0,
      currencyId: 'BRL',
      categoryId: 'cat-health-1',
      frequency: 'monthly',
      billingDay: 5,
      active: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const annualSub: Subscription = {
      id: 'sub-annual-1',
      title: 'Amazon Prime Annual',
      amount: 199.9,
      currencyId: 'BRL',
      categoryId: 'cat-ent-1',
      frequency: 'annual',
      billingDay: 15,
      billingMonth: 3, // March 15
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const inactiveAnnualSub: Subscription = {
      id: 'sub-annual-inactive',
      title: 'Costco Membership',
      amount: 60.0,
      currencyId: 'USD',
      categoryId: 'cat-ent-1',
      frequency: 'annual',
      billingDay: 1,
      billingMonth: 6,
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

    it('generates transaction on Feb 28 for monthly subscription with billing day 31 in non-leap year', async () => {
      const refDate = new Date(2027, 1, 28); // February 28, 2027
      const subDay31: Subscription = {
        id: 'sub-day31',
        title: 'End of Month Cloud',
        amount: 50.0,
        currencyId: 'BRL',
        frequency: 'monthly',
        billingDay: 31,
        active: true,
        createdAt: '2027-01-01T00:00:00.000Z',
        updatedAt: '2027-01-01T00:00:00.000Z',
      };

      const generated = await processSubscriptionAutoGeneration([subDay31], [], refDate);

      expect(generated.length).toBe(1);
      expect(tursoService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-day31',
          date: '2027-02-28T00:00:00.000Z',
        })
      );
    });

    it('enforces idempotency: does not generate duplicate transaction if month transaction exists', async () => {
      const refDate = new Date(2026, 7, 11); // August 11, 2026
      const existingTxs: Transaction[] = [
        {
          id: 'tx-existing-1',
          type: 'expense',
          title: 'Spotify Premium',
          amount: 21.9,
          currencyId: 'BRL',
          categoryId: 'cat-ent-1',
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
      const generated = await processSubscriptionAutoGeneration([inactiveSub, inactiveAnnualSub], [], refDate);

      expect(generated.length).toBe(0);
      expect(tursoService.addTransaction).not.toHaveBeenCalled();
    });

    it('generates annual transaction when billing date has passed this year and no tx exists', async () => {
      const refDate = new Date(2026, 7, 11); // August 11, 2026 (March 15 has passed)
      const existingTxs: Transaction[] = [];

      const generated = await processSubscriptionAutoGeneration([annualSub], existingTxs, refDate);

      expect(generated.length).toBe(1);
      expect(generated[0].title).toBe('Amazon Prime Annual');
      expect(generated[0].subscriptionId).toBe('sub-annual-1');
      expect(generated[0].amount).toBe(199.9);
      expect(tursoService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-annual-1',
          date: '2026-03-15T00:00:00.000Z',
          notes: undefined,
        })
      );
    });

    it('enforces annual idempotency: does not generate duplicate transaction if year tx exists', async () => {
      const refDate = new Date(2026, 7, 11); // August 11, 2026
      const existingTxs: Transaction[] = [
        {
          id: 'tx-annual-2026',
          type: 'expense',
          title: 'Amazon Prime Annual',
          amount: 199.9,
          currencyId: 'BRL',
          categoryId: 'cat-ent-1',
          subscriptionId: 'sub-annual-1',
          date: '2026-03-15T00:00:00.000Z',
          createdAt: '2026-03-15T00:00:00.000Z',
        },
      ];

      // Next year target is March 15, 2027. RefDate is August 11, 2026.
      // 12 months from refDate is August 11, 2027 -> March 15, 2027 is within 12 months,
      // so it generates the 2027 transaction.
      const generated = await processSubscriptionAutoGeneration([annualSub], existingTxs, refDate);

      expect(generated.length).toBe(1);
      expect(tursoService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub-annual-1',
          date: '2027-03-15T00:00:00.000Z',
        })
      );
    });

    it('does not generate next year annual transaction when more than 12 months away', async () => {
      const refDate = new Date(2026, 0, 5); // January 5, 2026
      const subNov: Subscription = {
        id: 'sub-nov-annual',
        title: 'Domain Registration',
        amount: 50.0,
        currencyId: 'USD',
        frequency: 'annual',
        billingDay: 20,
        billingMonth: 11, // November 20
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const existingTxs: Transaction[] = [
        {
          id: 'tx-nov-2026',
          type: 'expense',
          title: 'Domain Registration',
          amount: 50.0,
          currencyId: 'USD',
          subscriptionId: 'sub-nov-annual',
          date: '2026-11-20T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      // 2026 already exists. Next year target: Nov 20, 2027.
      // 12 months from Jan 5, 2026 is Jan 5, 2027.
      // Nov 20, 2027 is > 12 months away, so it must not generate.
      const generated = await processSubscriptionAutoGeneration([subNov], existingTxs, refDate);

      expect(generated.length).toBe(0);
      expect(tursoService.addTransaction).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionBillingUpdate', () => {
    it('updates transaction date for current month when billingDay changes (monthly)', async () => {
      const refDate = new Date(2026, 7, 11); // August 2026
      const sub: Subscription = {
        id: 'sub-1',
        title: 'Cloud VPS',
        amount: 30.0,
        currencyId: 'USD',
        categoryId: 'cat-serv-1',
        frequency: 'monthly',
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
        currencyId: 'USD',
        categoryId: 'cat-serv-1',
        subscriptionId: 'sub-1',
        date: '2026-08-05T12:00:00.000Z', // Old date (day 5)
        createdAt: '2026-08-05T12:00:00.000Z',
      };

      const pastMonthTx: Transaction = {
        id: 'tx-july-1',
        type: 'expense',
        title: 'Cloud VPS',
        amount: 30.0,
        currencyId: 'USD',
        categoryId: 'cat-serv-1',
        subscriptionId: 'sub-1',
        date: '2026-07-05T12:00:00.000Z', // Past month (July 5)
        createdAt: '2026-07-05T12:00:00.000Z',
      };

      await handleSubscriptionBillingUpdate(sub, [currentMonthTx, pastMonthTx], refDate);

      expect(tursoService.updateTransaction).toHaveBeenCalledTimes(1);
      expect(tursoService.updateTransaction).toHaveBeenCalledWith(
        'tx-august-1',
        expect.objectContaining({
          date: '2026-08-25T00:00:00.000Z',
        })
      );
    });

    it('updates current year transaction date when billingMonth and billingDay change (annual)', async () => {
      const refDate = new Date(2026, 7, 11); // August 2026
      const annualSub: Subscription = {
        id: 'sub-annual-update',
        title: 'VPN Yearly',
        amount: 80.0,
        currencyId: 'USD',
        frequency: 'annual',
        billingDay: 20, // Updated from 10 to 20
        billingMonth: 10, // Updated from 5 (May) to 10 (October)
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-11T00:00:00.000Z',
      };

      const currentYearTx: Transaction = {
        id: 'tx-annual-current-year',
        type: 'expense',
        title: 'VPN Yearly',
        amount: 80.0,
        currencyId: 'USD',
        subscriptionId: 'sub-annual-update',
        date: '2026-05-10T00:00:00.000Z', // Old date (May 10, 2026)
        createdAt: '2026-05-10T00:00:00.000Z',
      };

      const pastYearTx: Transaction = {
        id: 'tx-annual-past-year',
        type: 'expense',
        title: 'VPN Yearly',
        amount: 80.0,
        currencyId: 'USD',
        subscriptionId: 'sub-annual-update',
        date: '2025-05-10T00:00:00.000Z', // 2025 transaction
        createdAt: '2025-05-10T00:00:00.000Z',
      };

      await handleSubscriptionBillingUpdate(annualSub, [currentYearTx, pastYearTx], refDate);

      expect(tursoService.updateTransaction).toHaveBeenCalledTimes(1);
      expect(tursoService.updateTransaction).toHaveBeenCalledWith(
        'tx-annual-current-year',
        expect.objectContaining({
          date: '2026-10-20T00:00:00.000Z',
        })
      );
    });

    it('does not touch past month or past year transactions when billing changes', async () => {
      const refDate = new Date(2026, 7, 11); // August 2026
      const sub: Subscription = {
        id: 'sub-1',
        title: 'Cloud VPS',
        amount: 30.0,
        currencyId: 'USD',
        categoryId: 'cat-serv-1',
        frequency: 'monthly',
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
        currencyId: 'USD',
        categoryId: 'cat-serv-1',
        subscriptionId: 'sub-1',
        date: '2026-07-05T12:00:00.000Z', // Past month (July)
        createdAt: '2026-07-05T12:00:00.000Z',
      };

      await handleSubscriptionBillingDayUpdate(sub, [pastMonthTxOnly], refDate);

      expect(tursoService.updateTransaction).not.toHaveBeenCalled();
    });
  });
});

