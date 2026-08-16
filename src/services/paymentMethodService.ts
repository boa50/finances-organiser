import { PaymentMethodItem } from '../types';
import { tursoService } from './tursoService';
import { subscriptionService } from './subscriptionService';
import { generateId } from '../utils/idGenerator';
import { isJsonResponse } from './apiClient';
import { getLocalStorageItem, setLocalStorageItem } from './localStorageHelper';

const PAYMENT_METHODS_STORAGE_KEY = 'finances_custom_payment_methods';

import { DEFAULT_PAYMENT_METHODS } from '../constants/defaults';
export { DEFAULT_PAYMENT_METHODS };

class PaymentMethodService {
  private paymentMethods: PaymentMethodItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): PaymentMethodItem[] {
    this.paymentMethods = getLocalStorageItem<PaymentMethodItem[]>(PAYMENT_METHODS_STORAGE_KEY, []);
    return this.paymentMethods;
  }

  private saveToLocalStorage(): void {
    setLocalStorageItem(PAYMENT_METHODS_STORAGE_KEY, this.paymentMethods);
  }

  public async getPaymentMethods(): Promise<PaymentMethodItem[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const items: PaymentMethodItem[] = await res.json();
          this.paymentMethods = items;
          this.saveToLocalStorage();
          return [...this.paymentMethods];
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM payment_methods ORDER BY display_order ASC, name ASC');
        if (res.rows) {
          const dbItems: PaymentMethodItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            allowInstallments: Boolean(row.allow_installments),
            displayOrder: Number(row.display_order ?? 0),
            enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
          }));
          this.paymentMethods = dbItems;
          this.saveToLocalStorage();
          return [...this.paymentMethods];
        }
      } catch (e) {
        console.warn('Could not fetch payment methods from Turso DB, using local cache:', e);
      }
    }

    return [...this.paymentMethods];
  }

  public getPaymentMethodsSync(): PaymentMethodItem[] {
    return [...this.paymentMethods];
  }

  public async getEnabledPaymentMethods(): Promise<PaymentMethodItem[]> {
    const all = await this.getPaymentMethods();
    return all.filter((pm) => pm.enabled !== false);
  }

  public getEnabledPaymentMethodsSync(): PaymentMethodItem[] {
    const all = this.getPaymentMethodsSync();
    return all.filter((pm) => pm.enabled !== false);
  }

  public async reorderPaymentMethods(orderedIds: string[]): Promise<PaymentMethodItem[]> {
    const idToOrder = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      idToOrder.set(id, index);
    });

    this.paymentMethods = this.paymentMethods.map((pm) => {
      if (idToOrder.has(pm.id)) {
        return { ...pm, displayOrder: idToOrder.get(pm.id)! };
      }
      return pm;
    });

    this.paymentMethods.sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ action: 'reorder', orderedIds }),
        });
        if (isJsonResponse(res)) {
          return this.getPaymentMethods();
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        for (let index = 0; index < orderedIds.length; index++) {
          await client.execute({
            sql: 'UPDATE payment_methods SET display_order = ? WHERE id = ?',
            args: [index, orderedIds[index]],
          });
        }
      } catch (err) {
        console.error('Failed to sync payment method reorder to Turso DB:', err);
      }
    }

    return this.getPaymentMethods();
  }

  public async addPaymentMethod(
    name: string,
    allowInstallments: boolean = false,
    enabled: boolean = true
  ): Promise<PaymentMethodItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Payment method name cannot be empty.');
    }

    const current = await this.getPaymentMethods();
    if (current.some((pm) => pm.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A payment method named "${trimmed}" already exists.`);
    }

    const nextOrder = this.paymentMethods.length > 0
      ? Math.max(...this.paymentMethods.map((pm) => pm.displayOrder ?? 0)) + 1
      : 0;

    const isEnabled = enabled !== undefined ? Boolean(enabled) : true;

    const newMethod: PaymentMethodItem = {
      id: generateId('pm'),
      name: trimmed,
      allowInstallments: Boolean(allowInstallments),
      displayOrder: nextOrder,
      enabled: isEnabled,
    };

    this.paymentMethods = [...this.paymentMethods, newMethod];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ name: trimmed, allowInstallments: Boolean(allowInstallments), enabled: isEnabled }),
        });
        if (isJsonResponse(res)) {
          const created: PaymentMethodItem = await res.json();
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
          sql: 'INSERT INTO payment_methods (id, name, allow_installments, display_order, enabled) VALUES (?, ?, ?, ?, ?)',
          args: [newMethod.id, newMethod.name, allowInstallments ? 1 : 0, nextOrder, isEnabled ? 1 : 0],
        });
      } catch (err: any) {
        if (err?.message?.includes('no such column: enabled')) {
          try {
            await client.execute('ALTER TABLE payment_methods ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
            await client.execute({
              sql: 'INSERT INTO payment_methods (id, name, allow_installments, display_order, enabled) VALUES (?, ?, ?, ?, ?)',
              args: [newMethod.id, newMethod.name, allowInstallments ? 1 : 0, nextOrder, isEnabled ? 1 : 0],
            });
          } catch (retryErr) {
            console.error('Failed to sync added payment method to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync added payment method to Turso DB:', err);
        }
      }
    }

    return newMethod;
  }

  public async updatePaymentMethod(
    id: string,
    name: string,
    allowInstallments?: boolean,
    enabled?: boolean
  ): Promise<PaymentMethodItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Payment method name cannot be empty.');
    }

    const current = await this.getPaymentMethods();
    if (current.some((pm) => pm.id !== id && pm.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A payment method named "${trimmed}" already exists.`);
    }

    const index = this.paymentMethods.findIndex((pm) => pm.id === id);
    if (index === -1) {
      throw new Error('Payment method not found.');
    }

    const updated: PaymentMethodItem = {
      ...this.paymentMethods[index],
      name: trimmed,
      allowInstallments: allowInstallments !== undefined ? Boolean(allowInstallments) : Boolean(this.paymentMethods[index].allowInstallments),
      enabled: enabled !== undefined ? Boolean(enabled) : (this.paymentMethods[index].enabled !== false),
    };

    this.paymentMethods[index] = updated;
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, name: trimmed, allowInstallments: updated.allowInstallments, enabled: updated.enabled }),
        });
        if (isJsonResponse(res)) {
          const updatedPm: PaymentMethodItem = await res.json();
          return updatedPm;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'UPDATE payment_methods SET name = ?, allow_installments = ?, enabled = ? WHERE id = ?',
          args: [trimmed, updated.allowInstallments ? 1 : 0, updated.enabled ? 1 : 0, id],
        });
      } catch (err: any) {
        if (err?.message?.includes('no such column: enabled')) {
          try {
            await client.execute('ALTER TABLE payment_methods ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
            await client.execute({
              sql: 'UPDATE payment_methods SET name = ?, allow_installments = ?, enabled = ? WHERE id = ?',
              args: [trimmed, updated.allowInstallments ? 1 : 0, updated.enabled ? 1 : 0, id],
            });
          } catch (retryErr) {
            console.error('Failed to sync payment method update to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync payment method update to Turso DB:', err);
        }
      }
    }

    return updated;
  }

  public async togglePaymentMethodEnabled(id: string, nextState?: boolean): Promise<PaymentMethodItem> {
    const index = this.paymentMethods.findIndex((pm) => pm.id === id);
    if (index === -1) {
      throw new Error('Payment method not found.');
    }

    const current = this.paymentMethods[index];
    const newEnabled = nextState !== undefined ? nextState : !(current.enabled !== false);
    return this.updatePaymentMethod(id, current.name, current.allowInstallments, newEnabled);
  }

  public async deletePaymentMethod(id: string): Promise<boolean> {
    const target = this.paymentMethods.find((p) => p.id === id);
    const pmName = target?.name;

    this.paymentMethods = this.paymentMethods.filter((pm) => pm.id !== id);
    this.saveToLocalStorage();

    tursoService.removePaymentMethodReferences(id);
    subscriptionService.removePaymentMethodReferences(id);

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/payment-methods?id=${encodeURIComponent(id)}`, {
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
          sql: 'UPDATE transactions SET payment_method_id = NULL WHERE payment_method_id = ?',
          args: [id],
        });
        await client.execute({
          sql: 'UPDATE subscriptions SET payment_method_id = NULL WHERE payment_method_id = ?',
          args: [id],
        });
        await client.execute({
          sql: 'DELETE FROM payment_methods WHERE id = ?',
          args: [id],
        });
      } catch (err) {
        console.error('Failed to delete payment method from Turso DB:', err);
      }
    }

    return true;
  }

  public async resetToDefaults(): Promise<PaymentMethodItem[]> {
    this.paymentMethods = [];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/payment-methods?action=reset', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
        });
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute('DELETE FROM payment_methods');
      } catch (err) {
        console.error('Failed to reset payment methods in Turso DB:', err);
      }
    }

    return [];
  }
}

export const paymentMethodService = new PaymentMethodService();
