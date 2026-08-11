import { subscriptionService } from '../subscriptionService';
import { Subscription } from '../../types';

describe('subscriptionService', () => {
  let createdSub: Subscription;

  it('adds a new subscription successfully', async () => {
    createdSub = await subscriptionService.addSubscription({
      title: 'Netflix HD',
      amount: 45.9,
      currencyId: 'BRL',
      categoryId: 'cat-ent-1',
      billingDay: 15,
      active: true,
      notes: 'Monthly streaming plan',
    });

    expect(createdSub.id).toBeDefined();
    expect(createdSub.title).toBe('Netflix HD');
    expect(createdSub.amount).toBe(45.9);
    expect(createdSub.currencyId).toBe('BRL');
    expect(createdSub.billingDay).toBe(15);
    expect(createdSub.active).toBe(true);

    const subs = await subscriptionService.getSubscriptions();
    expect(subs.some((s) => s.id === createdSub.id)).toBe(true);
  });

  it('updates an existing subscription and toggles active status', async () => {
    const updated = await subscriptionService.updateSubscription(createdSub.id, {
      amount: 55.9,
      billingDay: 20,
    });

    expect(updated.amount).toBe(55.9);
    expect(updated.billingDay).toBe(20);

    const toggled = await subscriptionService.toggleSubscriptionActive(createdSub.id, false);
    expect(toggled.active).toBe(false);

    const subs = await subscriptionService.getSubscriptions();
    const found = subs.find((s) => s.id === createdSub.id);
    expect(found?.active).toBe(false);
    expect(found?.billingDay).toBe(20);
  });

  it('deletes a subscription successfully', async () => {
    const result = await subscriptionService.deleteSubscription(createdSub.id);
    expect(result).toBe(true);

    const subs = await subscriptionService.getSubscriptions();
    expect(subs.some((s) => s.id === createdSub.id)).toBe(false);
  });
});
