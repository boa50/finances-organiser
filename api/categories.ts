import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist, DEFAULT_CATEGORIES } from './_db';

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

    // GET /api/categories - Fetch categories
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM categories ORDER BY name ASC');
      if (!result.rows || result.rows.length === 0) {
        // Insert default categories if table is empty
        for (const cat of DEFAULT_CATEGORIES) {
          await client.execute({
            sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0],
          });
        }
        return res.status(200).json(DEFAULT_CATEGORIES);
      }

      const categories = result.rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        icon: String(row.icon),
        color: String(row.color),
        type: row.type,
        isDefault: Boolean(row.is_default),
      }));
      return res.status(200).json(categories);
    }

    // POST /api/categories - Add a new category or reset defaults
    if (req.method === 'POST') {
      const { action, name, icon, color, type } = req.body || {};

      if (action === 'reset' || req.query.action === 'reset') {
        await client.execute('DELETE FROM categories');
        for (const cat of DEFAULT_CATEGORIES) {
          await client.execute({
            sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [cat.id, cat.name, cat.icon, cat.color, cat.type, 1],
          });
        }
        return res.status(200).json(DEFAULT_CATEGORIES);
      }

      if (!name || !icon || !color || !type) {
        return res.status(400).json({ error: 'Missing required category fields' });
      }

      const id = 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      await client.execute({
        sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id, name.trim(), icon, color, type, 0],
      });

      const newCat = {
        id,
        name: name.trim(),
        icon,
        color,
        type,
        isDefault: false,
      };
      return res.status(201).json(newCat);
    }

    // PUT /api/categories - Update a category
    if (req.method === 'PUT') {
      const { id, name, icon, color, type } = req.body || {};
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

    // DELETE /api/categories - Delete a category
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for category deletion' });
      }

      await client.execute({
        sql: 'DELETE FROM categories WHERE id = ?',
        args: [String(id)],
      });
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling categories API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
