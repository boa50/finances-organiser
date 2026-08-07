import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support CORS for cross-origin requests if needed
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

  try {
    const client = getTursoClient(req);
    if (!client) {
      return res.status(200).json({
        success: false,
        isConnected: false,
        message: 'Turso Database URL or Auth Token not provided.',
      });
    }

    const testRes = await client.execute('SELECT 1 as ping');
    if (testRes.rows && testRes.rows.length > 0) {
      await ensureTablesExist(client);
      return res.status(200).json({
        success: true,
        isConnected: true,
        message: 'Successfully connected to Turso Cloud Database!',
      });
    }

    return res.status(500).json({
      success: false,
      isConnected: false,
      message: 'Database query executed but returned unexpected payload.',
    });
  } catch (error: any) {
    console.error('Turso health check error:', error);
    return res.status(500).json({
      success: false,
      isConnected: false,
      message: error?.message || 'Failed to connect to Turso Cloud Database.',
    });
  }
}
