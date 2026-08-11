import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';
import { generateId } from '../src/utils/idGenerator';

import { setCorsHeaders } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const client = getTursoClient(req);
  if (!client) {
    return res.status(400).json({ error: 'Turso client not configured' });
  }

  try {
    await ensureTablesExist(client);

    // GET /api/transactions - Fetch all transactions
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM transactions ORDER BY date DESC');
      const transactions = result.rows.map((row: any) => ({
        id: String(row.id),
        type: row.type,
        title: String(row.title),
        amount: Number(row.amount),
        currency: String(row.currency),
        category: String(row.category),
        paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
        bank: row.bank ? String(row.bank) : undefined,
        store: row.store ? String(row.store) : undefined,
        installments: Number(row.installments) || 0,
        installmentNumber: Number(row.installment_number) || 0,
        installmentGroupId: row.installment_group_id ? String(row.installment_group_id) : undefined,
        date: String(row.date),
        notes: row.notes ? String(row.notes) : undefined,
        createdAt: String(row.created_at || row.date),
      }));
      return res.status(200).json(transactions);
    }

    // POST /api/transactions - Add a new transaction
    if (req.method === 'POST') {
      const { type, title, amount, currency, category, paymentMethod, bank, store, installments, installmentNumber, installmentGroupId, date, notes } = req.body || {};
      if (!type || !title || amount === undefined || !currency || !category || !date) {
        return res.status(400).json({ error: 'Missing required transaction fields' });
      }

      const id = generateId('tx');
      const createdAt = new Date().toISOString();
      const pmVal = type === 'expense' && paymentMethod ? String(paymentMethod).trim() : null;
      const bankVal = type === 'expense' && bank ? String(bank).trim() : null;
      const storeVal = type === 'expense' && store ? String(store).trim() : null;
      const instVal = type === 'expense' ? (Number(installments) || 0) : 0;
      const instNumVal = type === 'expense' ? (Number(installmentNumber) || 0) : 0;
      const instGroupIdVal = type === 'expense' && installmentGroupId ? String(installmentGroupId).trim() : null;

      await client.execute({
        sql: `INSERT INTO transactions (id, type, title, amount, currency, category, payment_method, bank, store, installments, installment_number, installment_group_id, date, notes, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, type, title, Number(amount), currency, category, pmVal, bankVal, storeVal, instVal, instNumVal, instGroupIdVal, date, notes || '', createdAt],
      });

      const newTx = {
        id,
        type,
        title,
        amount: Number(amount),
        currency,
        category,
        paymentMethod: pmVal || undefined,
        bank: bankVal || undefined,
        store: storeVal || undefined,
        installments: instVal || undefined,
        installmentNumber: instNumVal || undefined,
        installmentGroupId: instGroupIdVal || undefined,
        date,
        notes: notes || undefined,
        createdAt,
      };
      return res.status(201).json(newTx);
    }

    // PUT /api/transactions - Update an existing transaction
    if (req.method === 'PUT') {
      const { id, type, title, amount, currency, category, paymentMethod, bank, store, installments, installmentNumber, installmentGroupId, date, notes } = req.body || {};
      if (!id || !type || !title || amount === undefined || !currency || !category || !date) {
        return res.status(400).json({ error: 'Missing required transaction fields for update' });
      }

      const pmVal = type === 'expense' && paymentMethod ? String(paymentMethod).trim() : null;
      const bankVal = type === 'expense' && bank ? String(bank).trim() : null;
      const storeVal = type === 'expense' && store ? String(store).trim() : null;
      const instVal = type === 'expense' ? (Number(installments) || 0) : 0;
      const instNumVal = type === 'expense' ? (Number(installmentNumber) || 0) : 0;
      const instGroupIdVal = type === 'expense' && installmentGroupId ? String(installmentGroupId).trim() : null;

      await client.execute({
        sql: `UPDATE transactions
              SET type = ?, title = ?, amount = ?, currency = ?, category = ?, payment_method = ?, bank = ?, store = ?, installments = ?, installment_number = ?, installment_group_id = ?, date = ?, notes = ?
              WHERE id = ?`,
        args: [type, title, Number(amount), currency, category, pmVal, bankVal, storeVal, instVal, instNumVal, instGroupIdVal, date, notes || '', id],
      });

      const updatedTx = {
        id,
        type,
        title,
        amount: Number(amount),
        currency,
        category,
        paymentMethod: pmVal || undefined,
        bank: bankVal || undefined,
        store: storeVal || undefined,
        installments: instVal || undefined,
        installmentNumber: instNumVal || undefined,
        installmentGroupId: instGroupIdVal || undefined,
        date,
        notes: notes || undefined,
      };
      return res.status(200).json(updatedTx);
    }

    // DELETE /api/transactions - Delete one, group, or all transactions
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
