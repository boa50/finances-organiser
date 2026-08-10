import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist, DEFAULT_BANKS } from './_db';

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

    // GET /api/banks - Fetch banks
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM banks ORDER BY name ASC');
      if (!result.rows || result.rows.length === 0) {
        for (const bank of DEFAULT_BANKS) {
          await client.execute({
            sql: `INSERT INTO banks (id, name, is_default) VALUES (?, ?, ?)`,
            args: [bank.id, bank.name, bank.isDefault ? 1 : 0],
          });
        }
        return res.status(200).json(DEFAULT_BANKS);
      }

      const banks = result.rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        isDefault: Boolean(row.is_default),
      }));
      return res.status(200).json(banks);
    }

    // POST /api/banks - Add a new bank or reset defaults
    if (req.method === 'POST') {
      const { action, name } = req.body || {};

      if (action === 'reset' || req.query.action === 'reset') {
        await client.execute('DELETE FROM banks');
        for (const bank of DEFAULT_BANKS) {
          await client.execute({
            sql: `INSERT INTO banks (id, name, is_default) VALUES (?, ?, ?)`,
            args: [bank.id, bank.name, 1],
          });
        }
        return res.status(200).json(DEFAULT_BANKS);
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

      const id = 'bank-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      await client.execute({
        sql: `INSERT INTO banks (id, name, is_default) VALUES (?, ?, 0)`,
        args: [id, trimmedName],
      });

      const newBank = {
        id,
        name: trimmedName,
        isDefault: false,
      };
      return res.status(201).json(newBank);
    }

    // PUT /api/banks - Update bank
    if (req.method === 'PUT') {
      const { id, name } = req.body || {};
      if (!id || !name || !name.trim()) {
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

      await client.execute({
        sql: `UPDATE banks SET name = ? WHERE id = ?`,
        args: [trimmedName, id],
      });

      const updatedBank = {
        id,
        name: trimmedName,
      };
      return res.status(200).json(updatedBank);
    }

    // DELETE /api/banks - Delete bank
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing id for bank deletion' });
      }

      await client.execute({
        sql: 'DELETE FROM banks WHERE id = ?',
        args: [String(id)],
      });
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling banks API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
