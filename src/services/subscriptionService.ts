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
          const items: Subscription[] = await res.json();
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
          currency: String(row.currency),
          categoryId: row.category_id ? String(row.category_id) : undefined,
          paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : undefined,
          bankId: row.bank_id ? String(row.bank_id) : undefined,
          store: row.store ? String(row.store) : undefined,
          billingDay: Number(row.billing_day) || 1,
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

  public async addSubscription(
    subData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Subscription> {
    const now = new Date().toISOString();
    const newSub: Subscription = {
      ...subData,
      id: generateId('sub'),
      billingDay: Math.min(Math.max(Number(subData.billingDay) || 1, 1), 31),
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
          body: JSON.stringify(subData),
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
      try {
        await client.execute({
          sql: `INSERT INTO subscriptions (id, title, amount, currency, category_id, payment_method_id, bank_id, store, billing_day, active, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newSub.id,
            newSub.title,
            newSub.amount,
            newSub.currency,
            newSub.categoryId || null,
            newSub.paymentMethodId || null,
            newSub.bankId || null,
            newSub.store || null,
            newSub.billingDay,
            newSub.active ? 1 : 0,
            newSub.notes || '',
            newSub.createdAt,
            newSub.updatedAt,
          ],
        });
      } catch (err) {
        console.error('Failed to sync added subscription to Turso:', err);
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
    const updatedSub: Subscription = {
      ...existing,
      ...subData,
      billingDay:
        subData.billingDay !== undefined
          ? Math.min(Math.max(Number(subData.billingDay) || 1, 1), 31)
          : existing.billingDay,
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
      try {
        await client.execute({
          sql: `UPDATE subscriptions
                SET title = ?, amount = ?, currency = ?, category_id = ?, payment_method_id = ?, bank_id = ?, store = ?, billing_day = ?, active = ?, notes = ?, updated_at = ?
                WHERE id = ?`,
          args: [
            updatedSub.title,
            updatedSub.amount,
            updatedSub.currency,
            updatedSub.categoryId || null,
            updatedSub.paymentMethodId || null,
            updatedSub.bankId || null,
            updatedSub.store || null,
            updatedSub.billingDay,
            updatedSub.active ? 1 : 0,
            updatedSub.notes || '',
            updatedSub.updatedAt,
            id,
          ],
        });
      } catch (err) {
        console.error('Failed to sync updated subscription to Turso:', err);
      }
    }

    return updatedSub;
  }

  public async toggleSubscriptionActive(id: string, active: boolean): Promise<Subscription> {
    return this.updateSubscription(id, { active });
  }

  public async deleteSubscription(id: string): Promise<boolean> {
    this.localMemorySubs = this.localMemorySubs.filter((s) => s.id !== id);
    this.saveLocalCache();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
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
