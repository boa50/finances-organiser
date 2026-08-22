import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';
import { generateId } from '../src/utils/idGenerator';
import { normalizeTransactionDate } from '../src/utils/financials';

import { setCorsHeaders } from './_helpers';

function mapRowToTransaction(row: any) {
  return {
    id: String(row.id),
    type: row.type,
    title: String(row.title),
    amount: Number(row.amount),
    currencyId: String(row.currency_id || row.currency || 'BRL'),
    categoryId: row.category_id ? String(row.category_id) : undefined,
    paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
    bankId: row.bank_id ? String(row.bank_id) : undefined,
    store: row.store ? String(row.store) : undefined,
    installments: Number(row.installments) || 0,
    installmentNumber: Number(row.installment_number) || 0,
    installmentGroupId: row.installment_group_id ? String(row.installment_group_id) : undefined,
    subscriptionId: row.subscription_id ? String(row.subscription_id) : undefined,
    date: normalizeTransactionDate(String(row.date)),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || row.date),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const client = getTursoClient(req);
  if (!client) {
    return res.status(400).json({ error: 'Turso client not configured' });
  }

  try {
    await ensureTablesExist(client);

    // GET /api/transactions - Fetch transactions with optional pagination, since filter, and search
    if (req.method === 'GET') {
      const { since, limit, offset, search, type, count, totals } = req.query;

      if (totals === 'true') {
        const result = await client.execute(`
          SELECT currency_id, type, SUM(amount) as total
          FROM transactions
          GROUP BY currency_id, type
        `);
        const byCurrency: Record<string, { income: number; expense: number }> = {};
        for (const row of result.rows) {
          const curr = String(row.currency_id || 'BRL');
          const rowType = String(row.type);
          const total = Number(row.total || 0);
          if (!byCurrency[curr]) {
            byCurrency[curr] = { income: 0, expense: 0 };
          }
          if (rowType === 'income') {
            byCurrency[curr].income += total;
          } else if (rowType === 'expense') {
            byCurrency[curr].expense += total;
          }
        }
        return res.status(200).json({ byCurrency });
      }

      const whereClauses: string[] = [];
      const args: any[] = [];

      if (since) {
        const sinceStr = String(since).trim().slice(0, 10);
        whereClauses.push('substr(transactions.date, 1, 10) >= ?');
        args.push(sinceStr);
      }

      if (type && type !== 'all') {
        whereClauses.push('transactions.type = ?');
        args.push(String(type));
      }

      if (search && String(search).trim()) {
        const s = `%${String(search).trim()}%`;
        whereClauses.push('(transactions.title LIKE ? OR transactions.store LIKE ? OR transactions.notes LIKE ? OR categories.name LIKE ?)');
        args.push(s, s, s, s);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      if (count === 'true') {
        const countRes = await client.execute({
          sql: `SELECT COUNT(*) as total FROM transactions LEFT JOIN categories ON transactions.category_id = categories.id ${whereSql}`,
          args: [...args],
        });
        const total = Number(countRes.rows[0]?.total || 0);
        return res.status(200).json({ total });
      }

      const isPaginated = limit !== undefined || search !== undefined;

      if (isPaginated) {
        const limitNum = Math.max(1, Number(limit) || 50);
        const offsetNum = Math.max(0, Number(offset) || 0);

        const countRes = await client.execute({
          sql: `SELECT COUNT(*) as total FROM transactions LEFT JOIN categories ON transactions.category_id = categories.id ${whereSql}`,
          args: [...args],
        });
        const total = Number(countRes.rows[0]?.total || 0);

        const dataRes = await client.execute({
          sql: `SELECT transactions.* FROM transactions LEFT JOIN categories ON transactions.category_id = categories.id ${whereSql} ORDER BY transactions.date DESC, transactions.created_at DESC LIMIT ? OFFSET ?`,
          args: [...args, limitNum, offsetNum],
        });

        const transactions = dataRes.rows.map(mapRowToTransaction);
        const hasMore = offsetNum + transactions.length < total;

        return res.status(200).json({
          transactions,
          total,
          hasMore,
        });
      }

      const result = await client.execute({
        sql: `SELECT transactions.* FROM transactions LEFT JOIN categories ON transactions.category_id = categories.id ${whereSql} ORDER BY transactions.date DESC, transactions.created_at DESC`,
        args,
      });
      const transactions = result.rows.map(mapRowToTransaction);
      return res.status(200).json(transactions);
    }

    // POST /api/transactions - Add a new transaction
    if (req.method === 'POST') {
      const { type, title, amount, currencyId, currency, categoryId, paymentMethodId, bankId, store, installments, installmentNumber, installmentGroupId, subscriptionId, date, notes } = req.body || {};
      const currVal = currencyId || currency;
      if (!type || !title || amount === undefined || !currVal || !date) {
        return res.status(400).json({ error: 'Missing required transaction fields' });
      }

      const normDate = normalizeTransactionDate(date);
      const id = generateId('tx');
      const createdAt = new Date().toISOString();
      const catIdVal = categoryId ? String(categoryId).trim() : null;
      const pmIdVal = type === 'expense' && paymentMethodId ? String(paymentMethodId).trim() : null;
      const bankIdVal = type === 'expense' && bankId ? String(bankId).trim() : null;
      const storeVal = type === 'expense' && store ? String(store).trim() : null;
      const instVal = type === 'expense' ? (Number(installments) || 0) : 0;
      const instNumVal = type === 'expense' ? (Number(installmentNumber) || 0) : 0;
      const instGroupIdVal = type === 'expense' && installmentGroupId ? String(installmentGroupId).trim() : null;
      const subIdVal = subscriptionId ? String(subscriptionId).trim() : null;

      await client.execute({
        sql: `INSERT INTO transactions (id, type, title, amount, currency_id, category_id, payment_method_id, bank_id, store, installments, installment_number, installment_group_id, subscription_id, date, notes, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, type, title, Number(amount), currVal, catIdVal, pmIdVal, bankIdVal, storeVal, instVal, instNumVal, instGroupIdVal, subIdVal, normDate, notes || '', createdAt],
      });

      const newTx = {
        id,
        type,
        title,
        amount: Number(amount),
        currencyId: currVal,
        categoryId: catIdVal || undefined,
        paymentMethodId: pmIdVal || undefined,
        bankId: bankIdVal || undefined,
        store: storeVal || undefined,
        installments: instVal || undefined,
        installmentNumber: instNumVal || undefined,
        installmentGroupId: instGroupIdVal || undefined,
        subscriptionId: subIdVal || undefined,
        date: normDate,
        notes: notes || undefined,
        createdAt,
      };
      return res.status(201).json(newTx);
    }

    // PUT /api/transactions - Update an existing transaction
    if (req.method === 'PUT') {
      const { id, type, title, amount, currencyId, currency, categoryId, paymentMethodId, bankId, store, installments, installmentNumber, installmentGroupId, subscriptionId, date, notes } = req.body || {};
      const currVal = currencyId || currency;
      if (!id || !type || !title || amount === undefined || !currVal || !date) {
        return res.status(400).json({ error: 'Missing required transaction fields for update' });
      }

      const normDate = normalizeTransactionDate(date);
      const catIdVal = categoryId ? String(categoryId).trim() : null;
      const pmIdVal = type === 'expense' && paymentMethodId ? String(paymentMethodId).trim() : null;
      const bankIdVal = type === 'expense' && bankId ? String(bankId).trim() : null;
      const storeVal = type === 'expense' && store ? String(store).trim() : null;
      const instVal = type === 'expense' ? (Number(installments) || 0) : 0;
      const instNumVal = type === 'expense' ? (Number(installmentNumber) || 0) : 0;
      const instGroupIdVal = type === 'expense' && installmentGroupId ? String(installmentGroupId).trim() : null;
      const subIdVal = subscriptionId ? String(subscriptionId).trim() : null;

      await client.execute({
        sql: `UPDATE transactions
              SET type = ?, title = ?, amount = ?, currency_id = ?, category_id = ?, payment_method_id = ?, bank_id = ?, store = ?, installments = ?, installment_number = ?, installment_group_id = ?, subscription_id = ?, date = ?, notes = ?
              WHERE id = ?`,
        args: [type, title, Number(amount), currVal, catIdVal, pmIdVal, bankIdVal, storeVal, instVal, instNumVal, instGroupIdVal, subIdVal, normDate, notes || '', id],
      });

      const updatedTx = {
        id,
        type,
        title,
        amount: Number(amount),
        currencyId: currVal,
        categoryId: catIdVal || undefined,
        paymentMethodId: pmIdVal || undefined,
        bankId: bankIdVal || undefined,
        store: storeVal || undefined,
        installments: instVal || undefined,
        installmentNumber: instNumVal || undefined,
        installmentGroupId: instGroupIdVal || undefined,
        subscriptionId: subIdVal || undefined,
        date: normDate,
        notes: notes || undefined,
      };
      return res.status(200).json(updatedTx);
    }

    // DELETE /api/transactions
    if (req.method === 'DELETE') {
      const groupId = req.query.groupId || req.body?.groupId;
      if (groupId) {
        await client.execute({
          sql: 'DELETE FROM transactions WHERE installment_group_id = ?',
          args: [String(groupId)],
        });
        return res.status(200).json({ success: true, groupId });
      }

      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id or groupId for deletion' });
      }

      if (id === 'all') {
        await client.execute('DELETE FROM transactions');
        return res.status(200).json({ success: true, message: 'All transactions cleared' });
      }

      await client.execute({
        sql: 'DELETE FROM transactions WHERE id = ?',
        args: [String(id)],
      });
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling transactions API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
