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
      currency: 'BRL',
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
      currency: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-10',
    });

    const updated = await tursoService.updateTransaction(tx.id, {
      type: 'expense',
      title: 'Supermarket Groceries',
      amount: 200,
      currency: 'BRL',
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
        currency: 'BRL',
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
      currency: 'BRL',
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
      currency: 'BRL',
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
      currency: 'BRL',
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
      currency: 'BRL',
      categoryId: 'cat-test-1',
      date: '2026-08-01',
    });

    const cleared = await tursoService.clearAllTransactions();
    expect(cleared.length).toBe(0);

    const remaining = await tursoService.getTransactions();
    expect(remaining.length).toBe(0);
  });
});
