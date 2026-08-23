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

  it('fetches recent transactions within given days window', async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const oldStr = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;

    await tursoService.addTransaction({
      type: 'expense',
      title: 'Recent Lunch',
      amount: 45,
      currencyId: 'BRL',
      date: todayStr,
    });

    await tursoService.addTransaction({
      type: 'expense',
      title: 'Old Purchase',
      amount: 200,
      currencyId: 'BRL',
      date: oldStr,
    });

    const recent = await tursoService.getRecentTransactions(60);
    expect(recent.some((t) => t.title === 'Recent Lunch')).toBe(true);
    expect(recent.some((t) => t.title === 'Old Purchase')).toBe(false);
  });

  it('fetches paginated transactions with limit and offset', async () => {
    for (let i = 1; i <= 5; i++) {
      await tursoService.addTransaction({
        type: 'expense',
        title: `Item ${i}`,
        amount: i * 10,
        currencyId: 'BRL',
        date: `2026-08-0${i}`,
      });
    }

    const page1 = await tursoService.getTransactionsPaginated(2, 0);
    expect(page1.transactions.length).toBe(2);
    expect(page1.total).toBe(5);
    expect(page1.hasMore).toBe(true);

    const page2 = await tursoService.getTransactionsPaginated(2, 2);
    expect(page2.transactions.length).toBe(2);
    expect(page2.total).toBe(5);
    expect(page2.hasMore).toBe(true);

    const page3 = await tursoService.getTransactionsPaginated(2, 4);
    expect(page3.transactions.length).toBe(1);
    expect(page3.total).toBe(5);
    expect(page3.hasMore).toBe(false);
  });

  it('searches remote transactions by query and type', async () => {
    await tursoService.addTransaction({
      type: 'expense',
      title: 'Coffee at Starbucks',
      amount: 15,
      currencyId: 'BRL',
      store: 'Starbucks',
      date: '2026-08-01',
    });

    await tursoService.addTransaction({
      type: 'income',
      title: 'Coffee Shop Dividend',
      amount: 500,
      currencyId: 'BRL',
      date: '2026-08-02',
    });

    await tursoService.addTransaction({
      type: 'expense',
      title: 'Grocery Store',
      amount: 120,
      currencyId: 'BRL',
      date: '2026-08-03',
    });

    const allCoffee = await tursoService.searchTransactionsRemote('Coffee', 'all');
    expect(allCoffee.transactions.length).toBe(2);

    const expenseCoffee = await tursoService.searchTransactionsRemote('Coffee', 'expense');
    expect(expenseCoffee.transactions.length).toBe(1);
    expect(expenseCoffee.transactions[0].title).toBe('Coffee at Starbucks');
  });

  it('returns total count of transactions', async () => {
    await tursoService.addTransaction({
      type: 'expense',
      title: 'Item A',
      amount: 10,
      currencyId: 'BRL',
      date: '2026-08-01',
    });
    await tursoService.addTransaction({
      type: 'expense',
      title: 'Item B',
      amount: 20,
      currencyId: 'BRL',
      date: '2026-08-02',
    });

    const count = await tursoService.getTransactionCount();
    expect(count).toBe(2);
  });

  it('returns lifetime aggregated totals grouped by currency', async () => {
    await tursoService.addTransaction({
      type: 'income',
      title: 'Salary BRL',
      amount: 5000,
      currencyId: 'BRL',
      date: '2026-08-01',
    });
    await tursoService.addTransaction({
      type: 'expense',
      title: 'Rent BRL',
      amount: 1500,
      currencyId: 'BRL',
      date: '2026-08-02',
    });
    await tursoService.addTransaction({
      type: 'income',
      title: 'Consulting USD',
      amount: 1000,
      currencyId: 'USD',
      date: '2026-08-03',
    });

    const totals = await tursoService.getTransactionTotals();
    expect(totals.byCurrency['BRL']).toEqual({ income: 5000, expense: 1500 });
    expect(totals.byCurrency['USD']).toEqual({ income: 1000, expense: 0 });
  });

  it('retrieves synchronous local recent transactions and local count', async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await tursoService.addTransaction({
      type: 'expense',
      title: 'Local Item',
      amount: 30,
      currencyId: 'BRL',
      date: todayStr,
    });

    const localRecent = tursoService.getLocalRecentTransactions(60);
    expect(localRecent.length).toBe(1);
    expect(localRecent[0].title).toBe('Local Item');

    const count = tursoService.getLocalTransactionCount();
    expect(count).toBe(1);
  });

  it('bootstraps app data via bootstrapAppData fallback', async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await tursoService.addTransaction({
      type: 'income',
      title: 'Bootstrap Salary',
      amount: 4000,
      currencyId: 'BRL',
      date: todayStr,
    });

    const result = await tursoService.bootstrapAppData(60);
    expect(result.recentTransactions.length).toBe(1);
    expect(result.recentTransactions[0].title).toBe('Bootstrap Salary');
    expect(result.totalCount).toBe(1);
  });

  it('prunes deleted transactions in the 60-day window upon syncing recent items', async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const oldDateStr = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;

    // Add old item outside 60-day window
    await tursoService.addTransaction({
      type: 'expense',
      title: 'Old Historical Item',
      amount: 100,
      currencyId: 'BRL',
      date: oldDateStr,
    });

    // Add recent item inside 60-day window
    const recentTx = await tursoService.addTransaction({
      type: 'expense',
      title: 'Recent Stale Item',
      amount: 50,
      currencyId: 'BRL',
      date: todayStr,
    });

    expect(tursoService.getLocalTransactionCount()).toBe(2);

    // Call internal sync with a new recent list that does NOT contain the stale item
    const newRecentTx = {
      id: 'fresh-123',
      type: 'income' as const,
      title: 'Fresh Salary',
      amount: 5000,
      currencyId: 'BRL',
      date: todayStr,
    };

    (tursoService as any).syncRecentIntoLocalCache([newRecentTx], 60);

    const localRecent = tursoService.getLocalRecentTransactions(60);
    expect(localRecent.length).toBe(1);
    expect(localRecent[0].title).toBe('Fresh Salary');

    // Older item outside 60-day window is preserved
    expect(tursoService.getLocalTransactionCount()).toBe(2);
  });

  it('handles referencedTransactionId when adding, updating, and querying transactions', async () => {
    const parentTx = await tursoService.addTransaction({
      type: 'expense',
      title: 'Original Purchase',
      amount: 300,
      currencyId: 'BRL',
      date: '2026-08-01',
    });

    const refundTx = await tursoService.addTransaction({
      type: 'income',
      title: 'Refund for Purchase',
      amount: 300,
      currencyId: 'BRL',
      referencedTransactionId: parentTx.id,
      date: '2026-08-05',
    });

    expect(refundTx.referencedTransactionId).toBe(parentTx.id);

    // Test synchronous getLocalTransactionById
    const localFound = tursoService.getLocalTransactionById(parentTx.id);
    expect(localFound).toBeDefined();
    expect(localFound?.title).toBe('Original Purchase');

    // Test getTransactionById
    const asyncFound = await tursoService.getTransactionById(parentTx.id);
    expect(asyncFound).toBeDefined();
    expect(asyncFound?.title).toBe('Original Purchase');

    // Test non-existent ID
    const notFound = await tursoService.getTransactionById('non-existent-tx-id');
    expect(notFound).toBeNull();

    // Test update with referencedTransactionId
    const updated = await tursoService.updateTransaction(refundTx.id, {
      type: 'income',
      title: 'Partial Refund',
      amount: 150,
      currencyId: 'BRL',
      referencedTransactionId: parentTx.id,
      date: '2026-08-05',
    });

    expect(updated.title).toBe('Partial Refund');
    expect(updated.referencedTransactionId).toBe(parentTx.id);
  });

  it('preserves referencedTransactionId when duplicating transactions', async () => {
    const originalRef = await tursoService.addTransaction({
      type: 'expense',
      title: 'Ref Source',
      amount: 100,
      currencyId: 'BRL',
      date: '2026-08-01',
    });

    const txToDuplicate = await tursoService.addTransaction({
      type: 'expense',
      title: 'Warranty Payment',
      amount: 25,
      currencyId: 'BRL',
      referencedTransactionId: originalRef.id,
      date: '2026-08-02',
    });

    const duplicates = await tursoService.duplicateTransaction(txToDuplicate);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].referencedTransactionId).toBe(originalRef.id);
  });

  it('runs ensureSchema and recovers from schema mismatch error via executeWithSchemaRetry', async () => {
    const ensureSpy = jest.spyOn(tursoService, 'ensureSchema').mockResolvedValue(true);

    let attempts = 0;
    const fakeClient = {
      execute: jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('SQLite error: no such column: referenced_transaction_id');
        }
        return { rows: [{ count: 1 }] };
      }),
    };

    (tursoService as any).client = fakeClient;
    (tursoService as any).schemaEnsured = true;

    const result = await (tursoService as any).executeWithSchemaRetry((client: any) =>
      client.execute('SELECT * FROM transactions')
    );

    expect(result).toEqual({ rows: [{ count: 1 }] });
    expect(attempts).toBe(2);
    expect(ensureSpy).toHaveBeenCalledWith(true);

    ensureSpy.mockRestore();
    (tursoService as any).client = null;
    (tursoService as any).schemaEnsured = false;
  });

  it('maps referenced_transaction_id from database row to referencedTransactionId property', () => {
    const rawRow = {
      id: 'tx-test-row-1',
      type: 'income',
      title: 'Salary Deposit',
      amount: 4500,
      currency_id: 'BRL',
      category_id: 'cat-income-1',
      payment_method_id: 'pm-1',
      bank_id: 'bank-1',
      store: null,
      installments: 0,
      installment_number: 0,
      installment_group_id: null,
      subscription_id: null,
      referenced_transaction_id: 'tx-parent-999',
      date: '2026-08-20',
      notes: 'Monthly pay',
      created_at: '2026-08-20T10:00:00.000Z',
    };

    const mapped = (tursoService as any).mapRowToTransaction(rawRow);
    expect(mapped.id).toBe('tx-test-row-1');
    expect(mapped.referencedTransactionId).toBe('tx-parent-999');
  });
});
