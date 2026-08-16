import { currencyService } from '../currencyService';

describe('currencyService', () => {
  it('returns default enabled currencies (BRL and USD)', async () => {
    const currencies = await currencyService.getCurrencies();
    expect(currencies.length).toBeGreaterThanOrEqual(2);
    expect(currencies.some((c) => c.code === 'BRL')).toBe(true);
    expect(currencies.some((c) => c.code === 'USD')).toBe(true);
  });

  it('adds a new valid currency successfully', async () => {
    const added = await currencyService.addCurrency('EUR');
    expect(added.code).toBe('EUR');
    expect(added.symbol).toBe('€');

    const currencies = await currencyService.getCurrencies();
    expect(currencies.some((c) => c.code === 'EUR')).toBe(true);
  });

  it('rejects adding an invalid currency option', async () => {
    await expect(currencyService.addCurrency('INVALID_CODE')).rejects.toThrow();
  });

  it('rejects adding a currency that is already enabled', async () => {
    await expect(currencyService.addCurrency('BRL')).rejects.toThrow();
  });

  it('removes an enabled currency', async () => {
    const removed = await currencyService.removeCurrency('EUR');
    expect(removed).toBe(true);

    const currencies = await currencyService.getCurrencies();
    expect(currencies.some((c) => c.code === 'EUR')).toBe(false);
  });

  it('enforces minimum 1 currency rule on deletion', async () => {
    const currencies = await currencyService.getCurrencies();
    // Remove until only 1 remains
    for (const c of currencies) {
      if (currencyService.getCurrenciesSync().length > 1) {
        try {
          await currencyService.removeCurrency(c.code);
        } catch (e) {
          // ignore
        }
      }
    }

    expect(currencyService.getCurrenciesSync().length).toBe(1);

    const lastCurrency = currencyService.getCurrenciesSync()[0];
    await expect(currencyService.removeCurrency(lastCurrency.code)).rejects.toThrow(
      'At least one currency must remain enabled.'
    );
  });

  it('reorders currencies correctly and maintains the custom sort order', async () => {
    // Ensure we have BRL and USD and EUR
    try {
      await currencyService.addCurrency('EUR');
    } catch (e) {}
    try {
      await currencyService.addCurrency('BRL');
    } catch (e) {}
    try {
      await currencyService.addCurrency('USD');
    } catch (e) {}

    const reordered = await currencyService.reorderCurrencies(['USD', 'EUR', 'BRL']);
    const codes = reordered.map((c) => c.code);
    expect(codes.indexOf('USD')).toBeLessThan(codes.indexOf('EUR'));
    expect(codes.indexOf('EUR')).toBeLessThan(codes.indexOf('BRL'));

    const syncList = currencyService.getCurrenciesSync();
    const syncCodes = syncList.map((c) => c.code);
    expect(syncCodes.indexOf('USD')).toBeLessThan(syncCodes.indexOf('EUR'));
    expect(syncCodes.indexOf('EUR')).toBeLessThan(syncCodes.indexOf('BRL'));
  });
});
