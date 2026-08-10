import { PaymentMethodItem } from '../types';
import { tursoService } from './tursoService';

const PAYMENT_METHODS_STORAGE_KEY = 'finances_custom_payment_methods';

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: 'pm-1', name: 'Credit Card', isDefault: true, allowInstallments: true },
  { id: 'pm-2', name: 'Debit Card', isDefault: true, allowInstallments: false },
  { id: 'pm-3', name: 'Money Transfer', isDefault: true, allowInstallments: false },
];

class PaymentMethodService {
  private paymentMethods: PaymentMethodItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): PaymentMethodItem[] {
    if (typeof window === 'undefined') {
      this.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
      return this.paymentMethods;
    }

    try {
      const stored = localStorage.getItem(PAYMENT_METHODS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.paymentMethods = parsed;
          return this.paymentMethods;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored payment methods:', e);
    }

    this.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
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
    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          const items: PaymentMethodItem[] = await res.json();
          this.paymentMethods = items;
          this.saveToLocalStorage();
          return [...this.paymentMethods];
        }
      }
    } catch (e) {
      // Fall through to direct LibSQL client execution below
    }

    // 2. Try direct LibSQL client if available
    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM payment_methods ORDER BY name ASC');
        if (res.rows && res.rows.length > 0) {
          const dbItems: PaymentMethodItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            isDefault: Boolean(row.is_default),
            allowInstallments: Boolean(row.allow_installments),
          }));
          this.paymentMethods = dbItems;
          this.saveToLocalStorage();
          return [...this.paymentMethods];
        } else {
          // Table is empty, insert default payment methods to database
          for (const pm of DEFAULT_PAYMENT_METHODS) {
            await client.execute({
              sql: `INSERT INTO payment_methods (id, name, is_default, allow_installments) VALUES (?, ?, ?, ?)`,
              args: [pm.id, pm.name, pm.isDefault ? 1 : 0, pm.allowInstallments ? 1 : 0],
            });
          }
          this.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
          this.saveToLocalStorage();
          return [...this.paymentMethods];
        }
      } catch (e) {
        console.warn('Could not fetch payment methods from Turso DB, using local cache:', e);
      }
    }

    return this.loadFromLocalStorage();
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
      id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      isDefault: false,
      allowInstallments: Boolean(allowInstallments),
    };

    this.paymentMethods = [...this.paymentMethods, newMethod];
    this.saveToLocalStorage();

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ name: trimmed, allowInstallments: Boolean(allowInstallments) }),
        });
        if (res.ok) {
          const created: PaymentMethodItem = await res.json();
          return created;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Persist to Turso Cloud DB directly if client connected
    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: 'INSERT INTO payment_methods (id, name, is_default, allow_installments) VALUES (?, ?, ?, ?)',
          args: [newMethod.id, newMethod.name, 0, allowInstallments ? 1 : 0],
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

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, name: trimmed, allowInstallments: updated.allowInstallments }),
        });
        if (res.ok) {
          const updatedPm: PaymentMethodItem = await res.json();
          return updatedPm;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Update in Turso DB directly if client connected
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
    this.paymentMethods = this.paymentMethods.filter((pm) => pm.id !== id);
    this.saveToLocalStorage();

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/payment-methods?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          return true;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Delete from Turso DB directly if client connected
    const client = tursoService.getClient();
    if (client) {
      try {
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
    this.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
    this.saveToLocalStorage();

    // 1. Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment-methods?action=reset', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          const resetItems: PaymentMethodItem[] = await res.json();
          this.paymentMethods = resetItems;
          this.saveToLocalStorage();
          return [...this.paymentMethods];
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Reset in Turso DB directly if client connected
    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute('DELETE FROM payment_methods');
        for (const pm of DEFAULT_PAYMENT_METHODS) {
          await client.execute({
            sql: `INSERT INTO payment_methods (id, name, is_default, allow_installments) VALUES (?, ?, ?, ?)`,
            args: [pm.id, pm.name, pm.isDefault ? 1 : 0, pm.allowInstallments ? 1 : 0],
          });
        }
      } catch (err) {
        console.error('Failed to reset payment methods in Turso DB:', err);
      }
    }

    return [...this.paymentMethods];
  }
}

export const paymentMethodService = new PaymentMethodService();
