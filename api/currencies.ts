import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';
import { VALID_CURRENCIES, getCurrencyInfo } from '../src/utils/currencies';
import { setCorsHeaders } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const client = getTursoClient(req);
  if (!client) {
    return res.status(400).json({ error: 'Turso client not configured' });
  }

  try {
    await ensureTablesExist(client);

    // GET /api/currencies - Fetch available currencies
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM currencies ORDER BY display_order ASC');
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json([]);
      }

      const currencies = result.rows.map((row: any) => ({
        code: String(row.id),
        symbol: String(row.symbol),
        name: String(row.name),
        flag: String(row.flag),
      }));
      return res.status(200).json(currencies);
    }

    // POST /api/currencies - Enable a new currency
    if (req.method === 'POST') {
      const codeInput = req.body?.code || req.body?.id;
      if (!codeInput || typeof codeInput !== 'string') {
        return res.status(400).json({ error: 'Currency code is required' });
      }

      let code = codeInput.trim().toUpperCase();
      if (code === 'WON') code = 'KRW';
      if (code === 'COL') code = 'COP';

      const info = VALID_CURRENCIES.find((c) => c.code === code);
      if (!info) {
        return res.status(400).json({ error: `Currency "${code}" is not a valid currency option.` });
      }

      // Check duplicate
      const dupCheck = await client.execute({
        sql: 'SELECT id FROM currencies WHERE UPPER(id) = ?',
        args: [code],
      });
      if (dupCheck.rows && dupCheck.rows.length > 0) {
        return res.status(400).json({ error: `Currency "${code}" is already enabled.` });
      }

      // Determine display order
      const countRes = await client.execute('SELECT COUNT(*) as cnt FROM currencies');
      const order = Number(countRes.rows[0]?.cnt || 0);

      await client.execute({
        sql: `INSERT INTO currencies (id, symbol, name, flag, display_order) VALUES (?, ?, ?, ?, ?)`,
        args: [info.code, info.symbol, info.name, info.flag, order],
      });

      return res.status(201).json(info);
    }

    // DELETE /api/currencies - Remove an available currency
    if (req.method === 'DELETE') {
      const rawId = req.query.id || req.body?.id || req.query.code || req.body?.code;
      if (!rawId || typeof rawId !== 'string') {
        return res.status(400).json({ error: 'Missing currency code for deletion' });
      }

      let targetId = String(rawId).trim().toUpperCase();
      if (targetId === 'WON') targetId = 'KRW';
      if (targetId === 'COL') targetId = 'COP';

      // 1. Enforce minimum 1 currency constraint
      const countRes = await client.execute('SELECT COUNT(*) as cnt FROM currencies');
      const totalCurrencies = Number(countRes.rows[0]?.cnt || 0);
      if (totalCurrencies <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only available currency. At least one currency must remain enabled.' });
      }

      // 2. Enforce referential integrity (transactions and subscriptions)
      const txCheck = await client.execute({
        sql: 'SELECT COUNT(*) as cnt FROM transactions WHERE currency_id = ?',
        args: [targetId],
      });
      const txCount = Number(txCheck.rows[0]?.cnt || 0);

      const subCheck = await client.execute({
        sql: 'SELECT COUNT(*) as cnt FROM subscriptions WHERE currency_id = ?',
        args: [targetId],
      });
      const subCount = Number(subCheck.rows[0]?.cnt || 0);

      if (txCount > 0 || subCount > 0) {
        return res.status(400).json({
          error: `Cannot remove ${targetId} because it is referenced by existing transactions or subscriptions.`,
        });
      }

      await client.execute({
        sql: 'DELETE FROM currencies WHERE id = ?',
        args: [targetId],
      });

      return res.status(200).json({ success: true, id: targetId });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Error handling currencies API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
