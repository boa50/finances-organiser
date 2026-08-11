import { PaymentMethodItem } from '../types';
import { tursoService } from './tursoService';
import { subscriptionService } from './subscriptionService';
import { generateId } from '../utils/idGenerator';
import { isJsonResponse } from './apiClient';

const PAYMENT_METHODS_STORAGE_KEY = 'finances_custom_payment_methods';

import { DEFAULT_PAYMENT_METHODS } from '../constants/defaults';
export { DEFAULT_PAYMENT_METHODS };

class PaymentMethodService {
  private paymentMethods: PaymentMethodItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): PaymentMethodItem[] {
    if (typeof window === 'undefined') {
      this.paymentMethods = [];
      return this.paymentMethods;
    }

    try {
      const stored = localStorage.getItem(PAYMENT_METHODS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.paymentMethods = parsed;
          return this.paymentMethods;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored payment methods:', e);
    }

    this.paymentMethods = [];
    this.saveToLocalStorage();
    return this.paymentMethods;
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(this.paymentMethods));
    } catch (e) {
      console.warn('Failed to save payment methods to localStorage:', e);
    }
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
        const res = await client.execute('SELECT * FROM payment_methods ORDER BY name ASC');
        if (res.rows) {
          const dbItems: PaymentMethodItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            allowInstallments: Boolean(row.allow_installments),
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

  public async addPaymentMethod(name: string, allowInstallments: boolean = false): Promise<PaymentMethodItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Payment method name cannot be empty.');
    }

    const current = await this.getPaymentMethods();
    if (current.some((pm) => pm.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A payment method named "${trimmed}" already exists.`);
    }

    const newMethod: PaymentMethodItem = {
      id: generateId('pm'),
      name: trimmed,
      allowInstallments: Boolean(allowInstallments),
    };

    this.paymentMethods = [...this.paymentMethods, newMethod];
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ name: trimmed, allowInstallments: Boolean(allowInstallments) }),
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
          sql: 'INSERT INTO payment_methods (id, name, allow_installments) VALUES (?, ?, ?)',
          args: [newMethod.id, newMethod.name, allowInstallments ? 1 : 0],
        });
      } catch (err) {
        console.error('Failed to sync added payment method to Turso DB:', err);
      }
    }

    return newMethod;
  }

  public async updatePaymentMethod(id: string, name: string, allowInstallments?: boolean): Promise<PaymentMethodItem> {
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
    };

    this.paymentMethods[index] = updated;
    this.saveToLocalStorage();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, name: trimmed, allowInstallments: updated.allowInstallments }),
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
          sql: 'UPDATE payment_methods SET name = ?, allow_installments = ? WHERE id = ?',
          args: [trimmed, updated.allowInstallments ? 1 : 0, id],
        });
      } catch (err) {
        console.error('Failed to sync payment method update to Turso DB:', err);
      }
    }

    return updated;
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
