import { bankService } from '../bankService';

describe('bankService', () => {
  beforeEach(async () => {
    await bankService.resetToDefaults();
  });

  it('starts with empty list when reset', async () => {
    const banks = await bankService.getBanks();
    expect(banks.length).toBe(0);
  });

  it('adds a new bank', async () => {
    const newBank = await bankService.addBank('Santander');
    expect(newBank.name).toBe('Santander');

    const banks = await bankService.getBanks();
    expect(banks.some((b) => b.id === newBank.id)).toBe(true);
  });

  it('prevents adding duplicate bank names', async () => {
    await bankService.addBank('Nubank');
    await expect(bankService.addBank('Nubank')).rejects.toThrow();
  });

  it('updates an existing bank', async () => {
    const created = await bankService.addBank('Old Bank');
    const updated = await bankService.updateBank(created.id, 'New Bank');

    expect(updated.name).toBe('New Bank');
  });

  it('prevents updating bank to duplicate name', async () => {
    await bankService.addBank('Nubank');
    const created = await bankService.addBank('Old Bank');
    await expect(bankService.updateBank(created.id, 'Nubank')).rejects.toThrow();
  });

  it('deletes a custom bank', async () => {
    const created = await bankService.addBank('Temp Bank');
    const deleteResult = await bankService.deleteBank(created.id);
    expect(deleteResult).toBe(true);

    const banks = await bankService.getBanks();
    expect(banks.some((b) => b.id === created.id)).toBe(false);
  });

  it('resets banks to empty list', async () => {
    await bankService.addBank('Extra Bank');
    const resetList = await bankService.resetToDefaults();

    expect(resetList.length).toBe(0);
  });
});
