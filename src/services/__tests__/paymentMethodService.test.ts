import { paymentMethodService } from '../paymentMethodService';

describe('paymentMethodService', () => {
  beforeEach(async () => {
    await paymentMethodService.resetToDefaults();
  });

  it('starts with empty list when reset', async () => {
    const methods = await paymentMethodService.getPaymentMethods();
    expect(methods.length).toBe(0);
  });

  it('adds a new payment method with allowInstallments flag', async () => {
    const newPm = await paymentMethodService.addPaymentMethod('Store Card', true);
    expect(newPm.name).toBe('Store Card');
    expect(newPm.allowInstallments).toBe(true);

    const methods = await paymentMethodService.getPaymentMethods();
    expect(methods.some((pm) => pm.id === newPm.id)).toBe(true);
  });

  it('prevents adding duplicate payment method names', async () => {
    await paymentMethodService.addPaymentMethod('Credit Card');
    await expect(paymentMethodService.addPaymentMethod('Credit Card')).rejects.toThrow();
  });

  it('updates an existing payment method', async () => {
    const created = await paymentMethodService.addPaymentMethod('Voucher', false);
    const updated = await paymentMethodService.updatePaymentMethod(created.id, 'Meal Voucher', true);

    expect(updated.name).toBe('Meal Voucher');
    expect(updated.allowInstallments).toBe(true);
  });

  it('prevents updating payment method to duplicate name', async () => {
    await paymentMethodService.addPaymentMethod('Credit Card');
    const created = await paymentMethodService.addPaymentMethod('Voucher', false);
    await expect(paymentMethodService.updatePaymentMethod(created.id, 'Credit Card')).rejects.toThrow();
  });

  it('deletes a custom payment method', async () => {
    const created = await paymentMethodService.addPaymentMethod('Custom Voucher', false);
    const deleteResult = await paymentMethodService.deletePaymentMethod(created.id);
    expect(deleteResult).toBe(true);

    const methods = await paymentMethodService.getPaymentMethods();
    expect(methods.some((pm) => pm.id === created.id)).toBe(false);
  });

  it('resets payment methods to empty list', async () => {
    await paymentMethodService.addPaymentMethod('Temporary Card');
    const resetList = await paymentMethodService.resetToDefaults();

    expect(resetList.length).toBe(0);
  });

  it('reorders payment methods correctly and maintains the custom sort order', async () => {
    const pm1 = await paymentMethodService.addPaymentMethod('Cash', false);
    const pm2 = await paymentMethodService.addPaymentMethod('Credit Card', true);
    const pm3 = await paymentMethodService.addPaymentMethod('Debit Card', false);

    const reordered = await paymentMethodService.reorderPaymentMethods([pm3.id, pm1.id, pm2.id]);
    expect(reordered.map((p) => p.id)).toEqual([pm3.id, pm1.id, pm2.id]);

    const syncList = paymentMethodService.getPaymentMethodsSync();
    expect(syncList.map((p) => p.id)).toEqual([pm3.id, pm1.id, pm2.id]);
  });

  it('toggles payment method enabled state and filters enabled methods correctly', async () => {
    const pm = await paymentMethodService.addPaymentMethod('Cheque', false);
    expect(pm.enabled).toBe(true);

    const toggled = await paymentMethodService.togglePaymentMethodEnabled(pm.id, false);
    expect(toggled.enabled).toBe(false);

    const all = await paymentMethodService.getPaymentMethods();
    expect(all.some((p) => p.id === pm.id && p.enabled === false)).toBe(true);

    const enabledOnly = await paymentMethodService.getEnabledPaymentMethods();
    expect(enabledOnly.some((p) => p.id === pm.id)).toBe(false);

    const enabledSync = paymentMethodService.getEnabledPaymentMethodsSync();
    expect(enabledSync.some((p) => p.id === pm.id)).toBe(false);

    await paymentMethodService.togglePaymentMethodEnabled(pm.id, true);
    const reEnabled = await paymentMethodService.getEnabledPaymentMethods();
    expect(reEnabled.some((p) => p.id === pm.id && p.enabled === true)).toBe(true);
  });
});
