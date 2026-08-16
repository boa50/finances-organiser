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

    // GET /api/banks - Fetch banks
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM banks ORDER BY display_order ASC, name ASC');
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json([]);
      }

      const banks = result.rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        displayOrder: Number(row.display_order ?? 0),
        enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
      }));
      return res.status(200).json(banks);
    }

    // POST /api/banks - Add a new bank or reset defaults
    if (req.method === 'POST') {
      const { action, name, enabled } = req.body || {};

      if (action === 'reset' || req.query.action === 'reset') {
        await client.execute('DELETE FROM banks');
        return res.status(200).json([]);
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Bank name is required' });
      }

      const trimmedName = name.trim();

      // Check duplicate
      const dupCheck = await client.execute({
        sql: 'SELECT id FROM banks WHERE LOWER(name) = LOWER(?)',
        args: [trimmedName],
      });
      if (dupCheck.rows && dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `A bank named "${trimmedName}" already exists.` });
      }

      const id = generateId('bank');
      const isEnabled = enabled !== undefined ? (enabled ? 1 : 0) : 1;
      const countRes = await client.execute('SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM banks');
      const displayOrder = Number(countRes.rows[0]?.next_order ?? 0);

      await client.execute({
        sql: `INSERT INTO banks (id, name, display_order, enabled) VALUES (?, ?, ?, ?)`,
        args: [id, trimmedName, displayOrder, isEnabled],
      });

      const newBank = {
        id,
        name: trimmedName,
        displayOrder,
        enabled: isEnabled === 1,
      };
      return res.status(201).json(newBank);
    }

    // PUT /api/banks - Update bank or reorder
    if (req.method === 'PUT') {
      const { action, orderedIds, id, name, enabled } = req.body || {};

      if (action === 'reorder' || Array.isArray(orderedIds)) {
        if (!Array.isArray(orderedIds)) {
          return res.status(400).json({ error: 'orderedIds array is required for reordering' });
        }
        for (let index = 0; index < orderedIds.length; index++) {
          await client.execute({
            sql: 'UPDATE banks SET display_order = ? WHERE id = ?',
            args: [index, String(orderedIds[index])],
          });
        }
        return res.status(200).json({ success: true, count: orderedIds.length });
      }

      if (!id) {
        return res.status(400).json({ error: 'Missing bank id for update' });
      }

      // Check toggle only update
      if (enabled !== undefined && !name) {
        const isEnabledVal = enabled ? 1 : 0;
        await client.execute({
          sql: 'UPDATE banks SET enabled = ? WHERE id = ?',
          args: [isEnabledVal, id],
        });
        const currentRes = await client.execute({
          sql: 'SELECT * FROM banks WHERE id = ?',
          args: [id],
        });
        const row: any = currentRes.rows[0];
        if (row) {
          return res.status(200).json({
            id: String(row.id),
            name: String(row.name),
            displayOrder: Number(row.display_order ?? 0),
            enabled: isEnabledVal === 1,
          });
        }
        return res.status(200).json({ id, enabled: isEnabledVal === 1 });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Missing required fields for bank update' });
      }

      const trimmedName = name.trim();

      // Check duplicate for other id
      const dupCheck = await client.execute({
        sql: 'SELECT id FROM banks WHERE LOWER(name) = LOWER(?) AND id != ?',
        args: [trimmedName, id],
      });
      if (dupCheck.rows && dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `A bank named "${trimmedName}" already exists.` });
      }

      const isEnabledVal = enabled !== undefined ? (enabled ? 1 : 0) : 1;

      await client.execute({
        sql: `UPDATE banks SET name = ?, enabled = ? WHERE id = ?`,
        args: [trimmedName, isEnabledVal, id],
      });

      const updatedBank = {
        id,
        name: trimmedName,
        enabled: isEnabledVal === 1,
      };
      return res.status(200).json(updatedBank);
    }

    // DELETE /api/banks - Delete bank and nullify references
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for bank deletion' });
      }

      const targetId = String(id);
      await client.execute({
        sql: 'UPDATE transactions SET bank_id = NULL WHERE bank_id = ?',
        args: [targetId],
      });
      await client.execute({
        sql: 'UPDATE subscriptions SET bank_id = NULL WHERE bank_id = ?',
        args: [targetId],
      });
      await client.execute({
        sql: 'DELETE FROM banks WHERE id = ?',
        args: [targetId],
      });
      return res.status(200).json({ success: true, id: targetId });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling banks API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
