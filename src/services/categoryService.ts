import { CategoryItem, TransactionType } from '../types';
import { tursoService } from './tursoService';
import { subscriptionService } from './subscriptionService';
import { generateId } from '../utils/idGenerator';
import { isJsonResponse } from './apiClient';

const CATEGORIES_STORAGE_KEY = 'finances_custom_categories';

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'utensils', label: 'Food / Dining', iconName: 'utensils' },
  { id: 'home', label: 'Housing', iconName: 'home' },
  { id: 'car', label: 'Transport', iconName: 'car' },
  { id: 'zap', label: 'Utilities', iconName: 'zap' },
  { id: 'tv', label: 'Entertainment', iconName: 'tv' },
  { id: 'shopping-bag', label: 'Shopping', iconName: 'shopping-bag' },
  { id: 'activity', label: 'Health', iconName: 'activity' },
  { id: 'book', label: 'Education', iconName: 'book' },
  { id: 'plane', label: 'Travel', iconName: 'plane' },
  { id: 'repeat', label: 'Subscriptions', iconName: 'repeat' },
  { id: 'briefcase', label: 'Salary', iconName: 'briefcase' },
  { id: 'laptop', label: 'Freelance', iconName: 'laptop' },
  { id: 'trending-up', label: 'Investments', iconName: 'trending-up' },
  { id: 'gift', label: 'Gifts', iconName: 'gift' },
  { id: 'key', label: 'Rent Income', iconName: 'key' },
  { id: 'coffee', label: 'Coffee / Cafe', iconName: 'coffee' },
  { id: 'dumbbell', label: 'Fitness', iconName: 'dumbbell' },
  { id: 'shield', label: 'Insurance', iconName: 'shield' },
  { id: 'heart', label: 'Personal Care', iconName: 'heart' },
  { id: 'gift-bonus', label: 'Bonus', iconName: 'gift' },
  { id: 'more-horizontal', label: 'Other', iconName: 'more-horizontal' },
];

export const PRESET_CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#F43F5E', '#64748B',
  '#059669', '#14B8A6', '#0284C7', '#7C3AED',
];

import { DEFAULT_CATEGORIES } from '../constants/defaults';
export { DEFAULT_CATEGORIES };

class CategoryService {
  private categories: CategoryItem[] = [];

  constructor() {
    this.loadCategories();
  }

  private loadCategories() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (saved) {
          this.categories = JSON.parse(saved);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load categories from localStorage', e);
    }
    this.categories = [];
    this.saveToCache();
  }

  private saveToCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(this.categories));
      }
    } catch (e) {
      console.warn('Failed to save categories to localStorage', e);
    }
  }

  public async getCategories(type?: TransactionType): Promise<CategoryItem[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (isJsonResponse(res)) {
          const items: CategoryItem[] = await res.json();
          this.categories = items;
          this.saveToCache();
          if (type) {
            return this.categories.filter((c) => c.type === type);
          }
          return [...this.categories];
        }
      }
    } catch (e) {
      // Fallback below
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
        if (res.rows) {
          const dbCategories: CategoryItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            icon: String(row.icon),
            color: String(row.color),
            type: row.type as TransactionType,
            displayOrder: Number(row.display_order ?? 0),
            enabled: row.enabled === undefined || row.enabled === null ? true : Boolean(row.enabled),
          }));
          this.categories = dbCategories;
          this.saveToCache();
        }
      } catch (e) {
        console.warn('Could not fetch categories from Turso DB, using local cache:', e);
      }
    }

    if (type) {
      return this.categories.filter((c) => c.type === type);
    }
    return [...this.categories];
  }

  public getCategoriesSync(type?: TransactionType): CategoryItem[] {
    if (type) {
      return this.categories.filter((c) => c.type === type);
    }
    return [...this.categories];
  }

  public async getEnabledCategories(type?: TransactionType): Promise<CategoryItem[]> {
    const all = await this.getCategories(type);
    return all.filter((c) => c.enabled !== false);
  }

  public getEnabledCategoriesSync(type?: TransactionType): CategoryItem[] {
    const all = this.getCategoriesSync(type);
    return all.filter((c) => c.enabled !== false);
  }

  public async reorderCategories(orderedIds: string[], type?: TransactionType): Promise<CategoryItem[]> {
    const idToOrder = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      idToOrder.set(id, index);
    });

    this.categories = this.categories.map((c) => {
      if (idToOrder.has(c.id)) {
        return { ...c, displayOrder: idToOrder.get(c.id)! };
      }
      return c;
    });

    this.categories.sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    this.saveToCache();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ action: 'reorder', orderedIds, type }),
        });
        if (isJsonResponse(res)) {
          return this.getCategories(type);
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
            sql: 'UPDATE categories SET display_order = ? WHERE id = ?',
            args: [index, orderedIds[index]],
          });
        }
      } catch (err) {
        console.error('Failed to sync category reorder to Turso DB:', err);
      }
    }

    return this.getCategories(type);
  }

  public async addCategory(cat: Omit<CategoryItem, 'id'>): Promise<CategoryItem> {
    const existing = this.categories.find(
      (c) => c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() && c.type === cat.type
    );
    if (existing) {
      throw new Error(`A ${cat.type} category named "${cat.name.trim()}" already exists.`);
    }

    const sameTypeCategories = this.categories.filter((c) => c.type === cat.type);
    const nextOrder = sameTypeCategories.length > 0
      ? Math.max(...sameTypeCategories.map((c) => c.displayOrder ?? 0)) + 1
      : 0;

    const isEnabled = cat.enabled !== undefined ? Boolean(cat.enabled) : true;

    const newCategory: CategoryItem = {
      id: generateId('cat'),
      name: cat.name.trim(),
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      displayOrder: nextOrder,
      enabled: isEnabled,
    };

    this.categories = [...this.categories, newCategory];
    this.saveToCache();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ ...cat, enabled: isEnabled }),
        });
        if (isJsonResponse(res)) {
          const created: CategoryItem = await res.json();
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
          sql: `INSERT INTO categories (id, name, icon, color, type, display_order, enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newCategory.id,
            newCategory.name,
            newCategory.icon,
            newCategory.color,
            newCategory.type,
            newCategory.displayOrder ?? 0,
            newCategory.enabled ? 1 : 0,
          ],
        });
      } catch (err: any) {
        if (err?.message?.includes('no such column: enabled')) {
          try {
            await client.execute('ALTER TABLE categories ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
            await client.execute({
              sql: `INSERT INTO categories (id, name, icon, color, type, display_order, enabled)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
              args: [
                newCategory.id,
                newCategory.name,
                newCategory.icon,
                newCategory.color,
                newCategory.type,
                newCategory.displayOrder ?? 0,
                newCategory.enabled ? 1 : 0,
              ],
            });
          } catch (retryErr) {
            console.error('Failed to sync added category to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync added category to Turso DB:', err);
        }
      }
    }

    return newCategory;
  }

  public async updateCategory(
    id: string,
    updated: Partial<Omit<CategoryItem, 'id'>>
  ): Promise<CategoryItem> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }

    const current = this.categories[index];
    const newName = updated.name ? updated.name.trim() : current.name;
    const newType = updated.type || current.type;

    const duplicate = this.categories.find(
      (c) => c.id !== id && c.name.toLowerCase() === newName.toLowerCase() && c.type === newType
    );
    if (duplicate) {
      throw new Error(`Another ${newType} category with name "${newName}" already exists.`);
    }

    const nextCategory: CategoryItem = {
      ...current,
      name: newName,
      icon: updated.icon || current.icon,
      color: updated.color || current.color,
      type: newType,
      enabled: updated.enabled !== undefined ? Boolean(updated.enabled) : (current.enabled !== false),
    };

    this.categories[index] = nextCategory;
    this.saveToCache();

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, ...updated, enabled: nextCategory.enabled }),
        });
        if (isJsonResponse(res)) {
          const updatedCat: CategoryItem = await res.json();
          return updatedCat;
        }
      }
    } catch (e) {
      // Fallback
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: `UPDATE categories SET name = ?, icon = ?, color = ?, type = ?, enabled = ? WHERE id = ?`,
          args: [
            nextCategory.name,
            nextCategory.icon,
            nextCategory.color,
            nextCategory.type,
            nextCategory.enabled ? 1 : 0,
            nextCategory.id,
          ],
        });
      } catch (err: any) {
        if (err?.message?.includes('no such column: enabled')) {
          try {
            await client.execute('ALTER TABLE categories ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
            await client.execute({
              sql: `UPDATE categories SET name = ?, icon = ?, color = ?, type = ?, enabled = ? WHERE id = ?`,
              args: [
                nextCategory.name,
                nextCategory.icon,
                nextCategory.color,
                nextCategory.type,
                nextCategory.enabled ? 1 : 0,
                nextCategory.id,
              ],
            });
          } catch (retryErr) {
            console.error('Failed to sync category update to Turso DB after migration:', retryErr);
          }
        } else {
          console.error('Failed to sync category update to Turso DB:', err);
        }
      }
    }

    return nextCategory;
  }

  public async toggleCategoryEnabled(id: string, nextState?: boolean): Promise<CategoryItem> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }

    const current = this.categories[index];
    const newEnabled = nextState !== undefined ? nextState : !(current.enabled !== false);
    return this.updateCategory(id, { enabled: newEnabled });
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const target = this.categories.find((c) => c.id === id);
    const catName = target?.name;

    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveToCache();

    // Remove references in local memory
    tursoService.removeCategoryReferences(id);
    subscriptionService.removeCategoryReferences(id);

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
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
          sql: 'UPDATE transactions SET category_id = NULL WHERE category_id = ?',
          args: [id],
        });
        await client.execute({
          sql: 'UPDATE subscriptions SET category_id = NULL WHERE category_id = ?',
          args: [id],
        });
        await client.execute({
          sql: 'DELETE FROM categories WHERE id = ?',
          args: [id],
        });
      } catch (err) {
        console.error('Failed to delete category from Turso DB:', err);
      }
    }

    return true;
  }

  public async resetToDefaults(): Promise<CategoryItem[]> {
    this.categories = [];
    this.saveToCache();

    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/categories?action=reset', {
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
        await client.execute('DELETE FROM categories');
      } catch (err) {
        console.error('Failed to clear categories in Turso DB:', err);
      }
    }

    return [];
  }
}

export const categoryService = new CategoryService();
