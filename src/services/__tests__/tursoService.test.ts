import { tursoService } from '../tursoService';

describe('tursoService', () => {
  beforeEach(async () => {
    await tursoService.clearAllTransactions();
  });

  it('adds a transaction and retrieves it', async () => {
    const newTx = await tursoService.addTransaction({
      type: 'expense',
      title: 'Coffee',
      amount: 12.5,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-11',
    });

    expect(newTx.id).toBeDefined();
    expect(newTx.title).toBe('Coffee');

    const transactions = await tursoService.getTransactions();
    expect(transactions.some((t) => t.id === newTx.id)).toBe(true);
  });

  it('updates an existing transaction', async () => {
    const tx = await tursoService.addTransaction({
      type: 'expense',
      title: 'Groceries',
      amount: 150,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-10',
    });

    const updated = await tursoService.updateTransaction(tx.id, {
      type: 'expense',
      title: 'Supermarket Groceries',
      amount: 200,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-10',
    });

    expect(updated.title).toBe('Supermarket Groceries');
    expect(updated.amount).toBe(200);

    const transactions = await tursoService.getTransactions();
    const found = transactions.find((t) => t.id === tx.id);
    expect(found?.title).toBe('Supermarket Groceries');
  });

  it('throws error when updating non-existent transaction', async () => {
    await expect(
      tursoService.updateTransaction('non-existent-id', {
        type: 'expense',
        title: 'Ghost',
        amount: 50,
        currencyId: 'BRL',
        categoryId: 'cat-test-1',
        date: '2026-08-10',
      })
    ).rejects.toThrow('Transaction not found');
  });

  it('deletes a single transaction', async () => {
    const tx = await tursoService.addTransaction({
      type: 'income',
      title: 'Freelance Work',
      amount: 800,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-01',
    });

    const deleteResult = await tursoService.deleteTransaction(tx.id);
    expect(deleteResult).toBe(true);

    const transactions = await tursoService.getTransactions();
    expect(transactions.some((t) => t.id === tx.id)).toBe(false);
  });

  it('deletes all transactions in an installment group', async () => {
    const groupId = 'group-laptop-123';

    const tx1 = await tursoService.addTransaction({
      type: 'expense',
      title: 'Laptop (1/2)',
      amount: 1500,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      installments: 2,
      installmentNumber: 1,
      installmentGroupId: groupId,
      date: '2026-08-01',
    });

    const tx2 = await tursoService.addTransaction({
      type: 'expense',
      title: 'Laptop (2/2)',
      amount: 1500,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      installments: 2,
      installmentNumber: 2,
      installmentGroupId: groupId,
      date: '2026-09-01',
    });

    const deleteGroupResult = await tursoService.deleteTransactionGroup(groupId, tx1);
    expect(deleteGroupResult).toBe(true);

    const transactions = await tursoService.getTransactions();
    expect(transactions.some((t) => t.id === tx1.id)).toBe(false);
    expect(transactions.some((t) => t.id === tx2.id)).toBe(false);
  });

  it('clears all transactions', async () => {
    await tursoService.addTransaction({
      type: 'expense',
      title: 'Rent',
      amount: 1200,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-01',
    });

    const cleared = await tursoService.clearAllTransactions();
    expect(cleared.length).toBe(0);

    const remaining = await tursoService.getTransactions();
    expect(remaining.length).toBe(0);
  });

  it('duplicates a single transaction with identical values and current day date', async () => {
    const tx = await tursoService.addTransaction({
      type: 'expense',
      title: 'Groceries',
      amount: 250,
      currencyId: 'BRL',
      categoryId: 'cat-test-1',
      paymentMethodId: 'pm-1',
      bankId: 'bank-1',
      store: 'Supermarket',
      notes: 'Weekly groceries',
      date: '2026-05-10',
    });

    const duplicated = await tursoService.duplicateTransaction(tx);
    expect(duplicated.length).toBe(1);
    expect(duplicated[0].id).toBeDefined();
    expect(duplicated[0].id).not.toBe(tx.id);
    expect(duplicated[0].type).toBe(tx.type);
    expect(duplicated[0].title).toBe(tx.title);
    expect(duplicated[0].amount).toBe(tx.amount);
    expect(duplicated[0].currencyId).toBe(tx.currencyId);
    expect(duplicated[0].categoryId).toBe(tx.categoryId);
    expect(duplicated[0].paymentMethodId).toBe(tx.paymentMethodId);
    expect(duplicated[0].bankId).toBe(tx.bankId);
    expect(duplicated[0].store).toBe(tx.store);
    expect(duplicated[0].notes).toBe(tx.notes);

    const todayDate = new Date();
    const expectedMonth = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
    expect(duplicated[0].date.startsWith(expectedMonth)).toBe(true);

    const allTx = await tursoService.getTransactions();
    expect(allTx.some((t) => t.id === duplicated[0].id)).toBe(true);
  });

  it('duplicates all installments in a multi-installment transaction group', async () => {
    const originalGroupId = 'group-phone-123';

    const tx1 = await tursoService.addTransaction({
      type: 'expense',
      title: 'Phone (1/3)',
      amount: 1000,
      currencyId: 'BRL',
      categoryId: 'cat-tech',
      paymentMethodId: 'pm-card',
      bankId: 'bank-itau',
      store: 'Electronics Store',
      notes: 'New phone',
      installments: 3,
      installmentNumber: 1,
      installmentGroupId: originalGroupId,
      date: '2026-01-15',
    });

    await tursoService.addTransaction({
      type: 'expense',
      title: 'Phone (2/3)',
      amount: 1000,
      currencyId: 'BRL',
      categoryId: 'cat-tech',
      paymentMethodId: 'pm-card',
      bankId: 'bank-itau',
      store: 'Electronics Store',
      notes: 'New phone',
      installments: 3,
      installmentNumber: 2,
      installmentGroupId: originalGroupId,
      date: '2026-02-15',
    });

    await tursoService.addTransaction({
      type: 'expense',
      title: 'Phone (3/3)',
      amount: 1000,
      currencyId: 'BRL',
      categoryId: 'cat-tech',
      paymentMethodId: 'pm-card',
      bankId: 'bank-itau',
      store: 'Electronics Store',
      notes: 'New phone',
      installments: 3,
      installmentNumber: 3,
      installmentGroupId: originalGroupId,
      date: '2026-03-15',
    });

    const duplicatedList = await tursoService.duplicateTransaction(tx1);
    expect(duplicatedList.length).toBe(3);

    const newGroupId = duplicatedList[0].installmentGroupId;
    expect(newGroupId).toBeDefined();
    expect(newGroupId).not.toBe(originalGroupId);

    duplicatedList.forEach((inst, index) => {
      expect(inst.installmentGroupId).toBe(newGroupId);
      expect(inst.installments).toBe(3);
      expect(inst.installmentNumber).toBe(index + 1);
      expect(inst.title).toBe(`Phone (${index + 1}/3)`);
      expect(inst.amount).toBe(1000);
      expect(inst.currencyId).toBe('BRL');
      expect(inst.categoryId).toBe('cat-tech');
      expect(inst.paymentMethodId).toBe('pm-card');
      expect(inst.bankId).toBe('bank-itau');
      expect(inst.store).toBe('Electronics Store');
      expect(inst.notes).toBe('New phone');
    });

    const allTx = await tursoService.getTransactions();
    expect(allTx.length).toBe(6);
  });

  it('throws error when duplicating non-existent transaction', async () => {
    await expect(
      tursoService.duplicateTransaction({
        id: 'non-existent-tx-id',
        type: 'expense',
        title: 'Ghost',
        amount: 100,
        currencyId: 'BRL',
        date: '2026-08-01',
        createdAt: '2026-08-01',
      })
    ).rejects.toThrow('Transaction not found');
  });
});
