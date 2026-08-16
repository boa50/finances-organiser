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

    // GET /api/categories - Fetch categories
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json([]);
      }

      const categories = result.rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        icon: String(row.icon),
        color: String(row.color),
        type: row.type,
        displayOrder: Number(row.display_order ?? 0),
      }));
      return res.status(200).json(categories);
    }

    // POST /api/categories - Add a new category or reset defaults
    if (req.method === 'POST') {
      const { action, name, icon, color, type } = req.body || {};

      if (action === 'reset' || req.query.action === 'reset') {
        await client.execute('DELETE FROM categories');
        return res.status(200).json([]);
      }

      if (!name || !icon || !color || !type) {
        return res.status(400).json({ error: 'Missing required category fields' });
      }

      const id = generateId('cat');
      const countRes = await client.execute({
        sql: 'SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM categories WHERE type = ?',
        args: [type],
      });
      const displayOrder = Number(countRes.rows[0]?.next_order ?? 0);

      await client.execute({
        sql: `INSERT INTO categories (id, name, icon, color, type, display_order)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id, name.trim(), icon, color, type, displayOrder],
      });

      const newCat = {
        id,
        name: name.trim(),
        icon,
        color,
        type,
        displayOrder,
      };
      return res.status(201).json(newCat);
    }

    // PUT /api/categories - Update a category or reorder categories
    if (req.method === 'PUT') {
      const { action, orderedIds, id, name, icon, color, type } = req.body || {};

      if (action === 'reorder' || Array.isArray(orderedIds)) {
        if (!Array.isArray(orderedIds)) {
          return res.status(400).json({ error: 'orderedIds array is required for reordering' });
        }
        for (let index = 0; index < orderedIds.length; index++) {
          await client.execute({
            sql: 'UPDATE categories SET display_order = ? WHERE id = ?',
            args: [index, String(orderedIds[index])],
          });
        }
        return res.status(200).json({ success: true, count: orderedIds.length });
      }

      if (!id || !name || !icon || !color || !type) {
        return res.status(400).json({ error: 'Missing required fields for category update' });
      }

      await client.execute({
        sql: `UPDATE categories SET name = ?, icon = ?, color = ?, type = ? WHERE id = ?`,
        args: [name.trim(), icon, color, type, id],
      });

      const updatedCat = {
        id,
        name: name.trim(),
        icon,
        color,
        type,
      };
      return res.status(200).json(updatedCat);
    }

    // DELETE /api/categories - Delete a category and set referencing transaction/subscription category_id to NULL
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for category deletion' });
      }

      const targetId = String(id);
      await client.execute({
        sql: 'UPDATE transactions SET category_id = NULL WHERE category_id = ?',
        args: [targetId],
      });
      await client.execute({
        sql: 'UPDATE subscriptions SET category_id = NULL WHERE category_id = ?',
        args: [targetId],
      });
      await client.execute({
        sql: 'DELETE FROM categories WHERE id = ?',
        args: [targetId],
      });
      return res.status(200).json({ success: true, id: targetId });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling categories API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
