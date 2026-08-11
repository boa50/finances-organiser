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

    // GET /api/subscriptions
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM subscriptions ORDER BY title ASC');
      const subscriptions = result.rows.map((row: any) => ({
        id: String(row.id),
        title: String(row.title),
        amount: Number(row.amount),
        currencyId: String(row.currency_id || row.currency || 'BRL'),
        categoryId: row.category_id ? String(row.category_id) : undefined,
        paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
        bankId: row.bank_id ? String(row.bank_id) : undefined,
        store: row.store ? String(row.store) : undefined,
        billingDay: Number(row.billing_day) || 1,
        active: Boolean(row.active),
        notes: row.notes ? String(row.notes) : undefined,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }));
      return res.status(200).json(subscriptions);
    }

    // POST /api/subscriptions
    if (req.method === 'POST') {
      const { title, amount, currencyId, currency, categoryId, paymentMethodId, bankId, store, billingDay, active, notes } = req.body || {};
      const currVal = currencyId || currency;
      if (!title || amount === undefined || !currVal) {
        return res.status(400).json({ error: 'Missing required subscription fields' });
      }

      const id = generateId('sub');
      const now = new Date().toISOString();
      const bDay = Math.min(Math.max(Number(billingDay) || 1, 1), 31);
      const isActive = active !== undefined ? Boolean(active) : true;

      const catIdVal = categoryId ? String(categoryId).trim() : null;
      const pmIdVal = paymentMethodId ? String(paymentMethodId).trim() : null;
      const bankIdVal = bankId ? String(bankId).trim() : null;
      const storeVal = store ? String(store).trim() : null;

      await client.execute({
        sql: `INSERT INTO subscriptions (id, title, amount, currency_id, category_id, payment_method_id, bank_id, store, billing_day, active, notes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          title.trim(),
          Number(amount),
          String(currVal).trim(),
          catIdVal,
          pmIdVal,
          bankIdVal,
          storeVal,
          bDay,
          isActive ? 1 : 0,
          notes ? String(notes).trim() : '',
          now,
          now,
        ],
      });

      const newSub = {
        id,
        title: title.trim(),
        amount: Number(amount),
        currencyId: String(currVal).trim(),
        categoryId: catIdVal || undefined,
        paymentMethodId: pmIdVal || undefined,
        bankId: bankIdVal || undefined,
        store: storeVal || undefined,
        billingDay: bDay,
        active: isActive,
        notes: notes ? String(notes).trim() : undefined,
        createdAt: now,
        updatedAt: now,
      };

      return res.status(201).json(newSub);
    }

    // PUT /api/subscriptions
    if (req.method === 'PUT') {
      const { id, title, amount, currencyId, currency, categoryId, paymentMethodId, bankId, store, billingDay, active, notes } = req.body || {};
      const currVal = currencyId || currency;
      if (!id || !title || amount === undefined || !currVal) {
        return res.status(400).json({ error: 'Missing required subscription fields for update' });
      }

      const now = new Date().toISOString();
      const bDay = Math.min(Math.max(Number(billingDay) || 1, 1), 31);
      const isActive = active !== undefined ? Boolean(active) : true;

      const catIdVal = categoryId ? String(categoryId).trim() : null;
      const pmIdVal = paymentMethodId ? String(paymentMethodId).trim() : null;
      const bankIdVal = bankId ? String(bankId).trim() : null;
      const storeVal = store ? String(store).trim() : null;

      await client.execute({
        sql: `UPDATE subscriptions
              SET title = ?, amount = ?, currency_id = ?, category_id = ?, payment_method_id = ?, bank_id = ?, store = ?, billing_day = ?, active = ?, notes = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          title.trim(),
          Number(amount),
          String(currVal).trim(),
          catIdVal,
          pmIdVal,
          bankIdVal,
          storeVal,
          bDay,
          isActive ? 1 : 0,
          notes ? String(notes).trim() : '',
          now,
          id,
        ],
      });

      const updatedSub = {
        id,
        title: title.trim(),
        amount: Number(amount),
        currencyId: String(currVal).trim(),
        categoryId: catIdVal || undefined,
        paymentMethodId: pmIdVal || undefined,
        bankId: bankIdVal || undefined,
        store: storeVal || undefined,
        billingDay: bDay,
        active: isActive,
        notes: notes ? String(notes).trim() : undefined,
        updatedAt: now,
      };

      return res.status(200).json(updatedSub);
    }

    // DELETE /api/subscriptions
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for subscription deletion' });
      }

      await client.execute({
        sql: 'DELETE FROM subscriptions WHERE id = ?',
        args: [String(id)],
      });

      return res.status(200).json({ success: true, id: String(id) });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling subscriptions API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
