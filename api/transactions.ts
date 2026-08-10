import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-turso-db-url, x-turso-auth-token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
        date: String(row.date),
        notes: row.notes ? String(row.notes) : undefined,
        createdAt: String(row.created_at || row.date),
      }));
      return res.status(200).json(transactions);
    }

    // POST /api/transactions - Add a new transaction
    if (req.method === 'POST') {
      const { type, title, amount, currency, category, paymentMethod, bank, store, date, notes } = req.body || {};
      if (!type || !title || amount === undefined || !currency || !category || !date) {
        return res.status(400).json({ error: 'Missing required transaction fields' });
      }

      const id = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const createdAt = new Date().toISOString();
      const pmVal = type === 'expense' && paymentMethod ? String(paymentMethod).trim() : null;
      const bankVal = type === 'expense' && bank ? String(bank).trim() : null;
      const storeVal = type === 'expense' && store ? String(store).trim() : null;

      await client.execute({
        sql: `INSERT INTO transactions (id, type, title, amount, currency, category, payment_method, bank, store, date, notes, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, type, title, Number(amount), currency, category, pmVal, bankVal, storeVal, date, notes || '', createdAt],
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
        date,
        notes: notes || undefined,
        createdAt,
      };
      return res.status(201).json(newTx);
    }

    // PUT /api/transactions - Update an existing transaction
    if (req.method === 'PUT') {
      const { id, type, title, amount, currency, category, paymentMethod, bank, store, date, notes } = req.body || {};
      if (!id || !type || !title || amount === undefined || !currency || !category || !date) {
        return res.status(400).json({ error: 'Missing required transaction fields for update' });
      }

      const pmVal = type === 'expense' && paymentMethod ? String(paymentMethod).trim() : null;
      const bankVal = type === 'expense' && bank ? String(bank).trim() : null;
      const storeVal = type === 'expense' && store ? String(store).trim() : null;

      await client.execute({
        sql: `UPDATE transactions
              SET type = ?, title = ?, amount = ?, currency = ?, category = ?, payment_method = ?, bank = ?, store = ?, date = ?, notes = ?
              WHERE id = ?`,
        args: [type, title, Number(amount), currency, category, pmVal, bankVal, storeVal, date, notes || '', id],
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
        date,
        notes: notes || undefined,
      };
      return res.status(200).json(updatedTx);
    }

    // DELETE /api/transactions - Delete one or all transactions
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for deletion' });
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
