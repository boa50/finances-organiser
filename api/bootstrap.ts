import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTursoClient, ensureTablesExist } from './_db';
import { normalizeTransactionDate } from '../src/utils/financials';
import { setCorsHeaders } from './_helpers';

function mapRowToTransaction(row: any) {
  return {
    id: String(row.id),
    type: row.type,
    title: String(row.title),
    amount: Number(row.amount),
    currencyId: String(row.currency_id || row.currency || 'BRL'),
    categoryId: row.category_id ? String(row.category_id) : undefined,
    paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
    bankId: row.bank_id ? String(row.bank_id) : undefined,
    store: row.store ? String(row.store) : undefined,
    installments: Number(row.installments) || 0,
    installmentNumber: Number(row.installment_number) || 0,
    installmentGroupId: row.installment_group_id ? String(row.installment_group_id) : undefined,
    subscriptionId: row.subscription_id ? String(row.subscription_id) : undefined,
    date: normalizeTransactionDate(String(row.date)),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || row.date),
  };
}

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

    const { since } = req.query;
    const sinceStr = since ? String(since).trim().slice(0, 10) : null;

    const [
      currenciesRes,
      categoriesRes,
      paymentMethodsRes,
      banksRes,
      countRes,
      txRes,
    ] = await Promise.all([
      client.execute('SELECT * FROM currencies ORDER BY display_order ASC'),
      client.execute('SELECT * FROM categories ORDER BY display_order ASC, name ASC'),
      client.execute('SELECT * FROM payment_methods ORDER BY display_order ASC, name ASC'),
      client.execute('SELECT * FROM banks ORDER BY display_order ASC, name ASC'),
      client.execute('SELECT COUNT(*) as total FROM transactions'),
      client.execute(
        sinceStr
          ? {
              sql: 'SELECT transactions.* FROM transactions WHERE substr(transactions.date, 1, 10) >= ? ORDER BY transactions.date DESC, transactions.created_at DESC',
              args: [sinceStr],
            }
          : {
              sql: 'SELECT transactions.* FROM transactions ORDER BY transactions.date DESC, transactions.created_at DESC LIMIT 100',
              args: [],
            }
      ),
    ]);

    const currencies = (currenciesRes.rows || []).map((row: any) => ({
      code: String(row.id),
      symbol: String(row.symbol),
      name: String(row.name),
      flag: String(row.flag),
      displayOrder: Number(row.display_order ?? 0),
      enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
    }));

    const categories = (categoriesRes.rows || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      icon: String(row.icon),
      color: String(row.color),
      type: row.type,
      displayOrder: Number(row.display_order ?? 0),
      enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
    }));

    const paymentMethods = (paymentMethodsRes.rows || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      allowInstallments: Boolean(row.allow_installments),
      displayOrder: Number(row.display_order ?? 0),
      enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
    }));

    const banks = (banksRes.rows || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      displayOrder: Number(row.display_order ?? 0),
      enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
    }));

    const totalCount = Number(countRes.rows[0]?.total || 0);
    const recentTransactions = (txRes.rows || []).map(mapRowToTransaction);

    return res.status(200).json({
      currencies,
      categories,
      paymentMethods,
      banks,
      recentTransactions,
      totalCount,
    });
  } catch (error: any) {
    console.error('Error handling bootstrap API:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
