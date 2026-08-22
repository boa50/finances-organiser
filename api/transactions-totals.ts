import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';
import { setCorsHeaders } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = getTursoClient(req);
  if (!client) {
    return res.status(400).json({ error: 'Turso client not configured' });
  }

  try {
    await ensureTablesExist(client);

    const result = await client.execute(`
      SELECT currency_id, type, SUM(amount) as total
      FROM transactions
      GROUP BY currency_id, type
    `);

    const byCurrency: Record<string, { income: number; expense: number }> = {};

    for (const row of result.rows) {
      const curr = String(row.currency_id || 'BRL');
      const type = String(row.type);
      const total = Number(row.total || 0);

      if (!byCurrency[curr]) {
        byCurrency[curr] = { income: 0, expense: 0 };
      }

      if (type === 'income') {
        byCurrency[curr].income += total;
      } else if (type === 'expense') {
        byCurrency[curr].expense += total;
      }
    }

    return res.status(200).json({ byCurrency });
  } catch (error: any) {
    console.error('Error handling transactions-totals API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
