import { Subscription } from '../types';
import { generateId } from '../utils/idGenerator';
import { isJsonResponse } from './apiClient';
import { tursoService } from './tursoService';

const LOCAL_SUBS_KEY = 'finances_local_subscriptions';

class SubscriptionService {
  private localMemorySubs: Subscription[] = [];

  constructor() {
    this.loadLocalCache();
  }

  private loadLocalCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(LOCAL_SUBS_KEY);
        if (saved) {
          this.localMemorySubs = JSON.parse(saved);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load local subscriptions', e);
    }
    this.localMemorySubs = [];
    this.saveLocalCache();
  }

  private saveLocalCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(this.localMemorySubs));
      }
    } catch (e) {
      console.warn('Failed to save local subscriptions', e);
    }
  }

  public async getSubscriptions(): Promise<Subscription[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/subscriptions', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const rawItems: any[] = await res.json();
          const items: Subscription[] = rawItems.map((s) => ({
            ...s,
            frequency: (s.frequency === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual',
            billingMonth: s.billingMonth != null ? Number(s.billingMonth) : undefined,
          }));
          this.localMemorySubs = items;
          this.saveLocalCache();
          return items;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM subscriptions ORDER BY title ASC');
        const items: Subscription[] = res.rows.map((row: any) => ({
          id: String(row.id),
          title: String(row.title),
          amount: Number(row.amount),
          currencyId: String(row.currency_id || row.currency || 'BRL'),
          categoryId: row.category_id ? String(row.category_id) : undefined,
          paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
          bankId: row.bank_id ? String(row.bank_id) : undefined,
          store: row.store ? String(row.store) : undefined,
          frequency: String(row.frequency || 'monthly') as 'monthly' | 'annual',
          billingDay: Number(row.billing_day) || 1,
          billingMonth: row.billing_month != null ? Number(row.billing_month) : undefined,
          active: Boolean(row.active),
          notes: row.notes ? String(row.notes) : undefined,
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at),
        }));

        this.localMemorySubs = items;
        this.saveLocalCache();
        return items;
      } catch (err) {
        console.warn('Failed to fetch subscriptions from Turso client:', err);
      }
    }

    return this.localMemorySubs;
  }

  public getSubscriptionsSync(): Subscription[] {
    return [...this.localMemorySubs];
  }

  public async addSubscription(
    subData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Subscription> {
    const now = new Date().toISOString();
    const freq = subData.frequency === 'annual' ? 'annual' : 'monthly';
    const bMonth = freq === 'annual' && subData.billingMonth != null ? Math.min(Math.max(Number(subData.billingMonth), 1), 12) : undefined;
    const newSub: Subscription = {
      ...subData,
      id: generateId('sub'),
      frequency: freq,
      billingDay: Math.min(Math.max(Number(subData.billingDay) || 1, 1), 31),
      billingMonth: bMonth,
      active: subData.active !== undefined ? subData.active : true,
      createdAt: now,
      updatedAt: now,
    };

    this.localMemorySubs = [newSub, ...this.localMemorySubs];
    this.saveLocalCache();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify(newSub),
        });
        if (isJsonResponse(res)) {
          const created: Subscription = await res.json();
          return created;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      const insertSql = `INSERT INTO subscriptions (id, title, amount, currency_id, category_id, payment_method_id, bank_id, store, frequency, billing_day, billing_month, active, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const insertArgs = [
        newSub.id,
        newSub.title,
        newSub.amount,
        newSub.currencyId,
        newSub.categoryId || null,
        newSub.paymentMethodId || null,
        newSub.bankId || null,
        newSub.store || null,
        newSub.frequency || 'monthly',
        newSub.billingDay,
        newSub.billingMonth || null,
        newSub.active ? 1 : 0,
        newSub.notes || '',
        newSub.createdAt,
        newSub.updatedAt,
      ];

      try {
        await client.execute({
          sql: insertSql,
          args: insertArgs,
        });
      } catch (err: any) {
        if (
          err?.message?.includes('frequency') ||
          err?.message?.includes('billing_month') ||
          err?.message?.includes('no such column') ||
          err?.message?.includes('has no column named')
        ) {
          try {
            try { await client.execute("ALTER TABLE subscriptions ADD COLUMN frequency TEXT NOT NULL DEFAULT 'monthly'"); } catch (e) {}
            try { await client.execute('ALTER TABLE subscriptions ADD COLUMN billing_month INTEGER'); } catch (e) {}
            await client.execute({
              sql: insertSql,
              args: insertArgs,
            });
          } catch (retryErr) {
            console.error('Failed to sync added subscription to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync added subscription to Turso:', err);
        }
      }
    }

    return newSub;
  }

  public async updateSubscription(
    id: string,
    subData: Partial<Omit<Subscription, 'id' | 'createdAt'>>
  ): Promise<Subscription> {
    const existing = this.localMemorySubs.find((s) => s.id === id);
    if (!existing) {
      throw new Error('Subscription not found');
    }

    const now = new Date().toISOString();
    const frequency = subData.frequency !== undefined ? subData.frequency : (existing.frequency || 'monthly');
    const billingMonth = frequency === 'annual'
      ? (subData.billingMonth !== undefined ? (subData.billingMonth != null ? Math.min(Math.max(Number(subData.billingMonth), 1), 12) : undefined) : existing.billingMonth)
      : undefined;

    const updatedSub: Subscription = {
      ...existing,
      ...subData,
      frequency,
      billingDay:
        subData.billingDay !== undefined
          ? Math.min(Math.max(Number(subData.billingDay) || 1, 1), 31)
          : existing.billingDay,
      billingMonth,
      updatedAt: now,
    };

    this.localMemorySubs = this.localMemorySubs.map((s) => (s.id === id ? updatedSub : s));
    this.saveLocalCache();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify(updatedSub),
        });
        if (isJsonResponse(res)) {
          const updated: Subscription = await res.json();
          return updated;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      const updateSql = `UPDATE subscriptions
            SET title = ?, amount = ?, currency_id = ?, category_id = ?, payment_method_id = ?, bank_id = ?, store = ?, frequency = ?, billing_day = ?, billing_month = ?, active = ?, notes = ?, updated_at = ?
            WHERE id = ?`;
      const updateArgs = [
        updatedSub.title,
        updatedSub.amount,
        updatedSub.currencyId,
        updatedSub.categoryId || null,
        updatedSub.paymentMethodId || null,
        updatedSub.bankId || null,
        updatedSub.store || null,
        updatedSub.frequency || 'monthly',
        updatedSub.billingDay,
        updatedSub.billingMonth || null,
        updatedSub.active ? 1 : 0,
        updatedSub.notes || '',
        updatedSub.updatedAt,
        id,
      ];

      try {
        await client.execute({
          sql: updateSql,
          args: updateArgs,
        });
      } catch (err: any) {
        if (
          err?.message?.includes('frequency') ||
          err?.message?.includes('billing_month') ||
          err?.message?.includes('no such column') ||
          err?.message?.includes('has no column named')
        ) {
          try {
            try { await client.execute("ALTER TABLE subscriptions ADD COLUMN frequency TEXT NOT NULL DEFAULT 'monthly'"); } catch (e) {}
            try { await client.execute('ALTER TABLE subscriptions ADD COLUMN billing_month INTEGER'); } catch (e) {}
            await client.execute({
              sql: updateSql,
              args: updateArgs,
            });
          } catch (retryErr) {
            console.error('Failed to sync updated subscription to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync updated subscription to Turso:', err);
        }
      }
    }

    return updatedSub;
  }

  public async toggleSubscriptionActive(id: string, active: boolean): Promise<Subscription> {
    return this.updateSubscription(id, { active });
  }

  public async deleteSubscription(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          this.localMemorySubs = this.localMemorySubs.filter((s) => s.id !== id);
          this.saveLocalCache();
          return true;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'DELETE FROM subscriptions WHERE id = ?',
          args: [id],
        });
      } catch (err) {
        console.error('Failed to delete subscription from Turso:', err);
      }
    }

    this.localMemorySubs = this.localMemorySubs.filter((s) => s.id !== id);
    this.saveLocalCache();

    return true;
  }

  public removeCategoryReferences(catId: string): void {
    this.localMemorySubs = this.localMemorySubs.map((sub) => {
      if (sub.categoryId === catId) {
        return { ...sub, categoryId: undefined };
      }
      return sub;
    });
    this.saveLocalCache();
  }

  public removePaymentMethodReferences(pmId: string): void {
    this.localMemorySubs = this.localMemorySubs.map((sub) => {
      if (sub.paymentMethodId === pmId) {
        return { ...sub, paymentMethodId: undefined };
      }
      return sub;
    });
    this.saveLocalCache();
  }

  public removeBankReferences(bankId: string): void {
    this.localMemorySubs = this.localMemorySubs.map((sub) => {
      if (sub.bankId === bankId) {
        return { ...sub, bankId: undefined };
      }
      return sub;
    });
    this.saveLocalCache();
  }
}

export const subscriptionService = new SubscriptionService();
