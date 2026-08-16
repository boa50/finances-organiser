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

    // GET /api/payment-methods - Fetch payment methods
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM payment_methods ORDER BY display_order ASC, name ASC');
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json([]);
      }

      const paymentMethods = result.rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        allowInstallments: Boolean(row.allow_installments),
        displayOrder: Number(row.display_order ?? 0),
      }));
      return res.status(200).json(paymentMethods);
    }

    // POST /api/payment-methods - Add a new payment method or reset defaults
    if (req.method === 'POST') {
      const { action, name, allowInstallments } = req.body || {};

      if (action === 'reset' || req.query.action === 'reset') {
        await client.execute('DELETE FROM payment_methods');
        return res.status(200).json([]);
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Payment method name is required' });
      }

      const trimmedName = name.trim();

      // Check duplicate
      const dupCheck = await client.execute({
        sql: 'SELECT id FROM payment_methods WHERE LOWER(name) = LOWER(?)',
        args: [trimmedName],
      });
      if (dupCheck.rows && dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `A payment method named "${trimmedName}" already exists.` });
      }

      const id = generateId('pm');
      const allowInstVal = Boolean(allowInstallments);

      const countRes = await client.execute('SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM payment_methods');
      const displayOrder = Number(countRes.rows[0]?.next_order ?? 0);

      await client.execute({
        sql: `INSERT INTO payment_methods (id, name, allow_installments, display_order) VALUES (?, ?, ?, ?)`,
        args: [id, trimmedName, allowInstVal ? 1 : 0, displayOrder],
      });

      const newPm = {
        id,
        name: trimmedName,
        allowInstallments: allowInstVal,
        displayOrder,
      };
      return res.status(201).json(newPm);
    }

    // PUT /api/payment-methods - Update payment method or reorder
    if (req.method === 'PUT') {
      const { action, orderedIds, id, name, allowInstallments } = req.body || {};

      if (action === 'reorder' || Array.isArray(orderedIds)) {
        if (!Array.isArray(orderedIds)) {
          return res.status(400).json({ error: 'orderedIds array is required for reordering' });
        }
        for (let index = 0; index < orderedIds.length; index++) {
          await client.execute({
            sql: 'UPDATE payment_methods SET display_order = ? WHERE id = ?',
            args: [index, String(orderedIds[index])],
          });
        }
        return res.status(200).json({ success: true, count: orderedIds.length });
      }

      if (!id || !name || !name.trim()) {
        return res.status(400).json({ error: 'Missing required fields for payment method update' });
      }

      const trimmedName = name.trim();

      // Check duplicate for other id
      const dupCheck = await client.execute({
        sql: 'SELECT id FROM payment_methods WHERE LOWER(name) = LOWER(?) AND id != ?',
        args: [trimmedName, id],
      });
      if (dupCheck.rows && dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `A payment method named "${trimmedName}" already exists.` });
      }

      const allowInstVal = Boolean(allowInstallments);

      await client.execute({
        sql: `UPDATE payment_methods SET name = ?, allow_installments = ? WHERE id = ?`,
        args: [trimmedName, allowInstVal ? 1 : 0, id],
      });

      const updatedPm = {
        id,
        name: trimmedName,
        allowInstallments: allowInstVal,
      };
      return res.status(200).json(updatedPm);
    }

    // DELETE /api/payment-methods - Delete payment method and nullify references
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for payment method deletion' });
      }

      const targetId = String(id);
      await client.execute({
        sql: 'UPDATE transactions SET payment_method_id = NULL WHERE payment_method_id = ?',
        args: [targetId],
      });
      await client.execute({
        sql: 'UPDATE subscriptions SET payment_method_id = NULL WHERE payment_method_id = ?',
        args: [targetId],
      });
      await client.execute({
        sql: 'DELETE FROM payment_methods WHERE id = ?',
        args: [targetId],
      });
      return res.status(200).json({ success: true, id: targetId });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling payment methods API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
