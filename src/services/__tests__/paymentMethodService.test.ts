import { paymentMethodService } from '../paymentMethodService';

describe('paymentMethodService', () => {
  beforeEach(async () => {
    await paymentMethodService.resetToDefaults();
  });

  it('loads default payment methods', async () => {
    const methods = await paymentMethodService.getPaymentMethods();
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.some((pm) => pm.name === 'Credit Card')).toBe(true);
  });

  it('adds a new payment method with allowInstallments flag', async () => {
    const newPm = await paymentMethodService.addPaymentMethod('Store Card', true);
    expect(newPm.name).toBe('Store Card');
    expect(newPm.allowInstallments).toBe(true);

    const methods = await paymentMethodService.getPaymentMethods();
    expect(methods.some((pm) => pm.id === newPm.id)).toBe(true);
  });

  it('prevents adding duplicate payment method names', async () => {
    await expect(paymentMethodService.addPaymentMethod('Credit Card')).rejects.toThrow();
  });

  it('updates an existing payment method', async () => {
    const created = await paymentMethodService.addPaymentMethod('Voucher', false);
    const updated = await paymentMethodService.updatePaymentMethod(created.id, 'Meal Voucher', true);

    expect(updated.name).toBe('Meal Voucher');
    expect(updated.allowInstallments).toBe(true);
  });

  it('prevents updating payment method to duplicate name', async () => {
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

  it('resets payment methods to default list', async () => {
    await paymentMethodService.addPaymentMethod('Temporary Card');
    const resetList = await paymentMethodService.resetToDefaults();

    expect(resetList.some((pm) => pm.name === 'Temporary Card')).toBe(false);
    expect(resetList.some((pm) => pm.name === 'Credit Card')).toBe(true);
  });
});
