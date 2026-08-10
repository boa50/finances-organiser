import { CategoryItem, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/currencies';
import { tursoService } from './tursoService';

const CATEGORIES_STORAGE_KEY = 'finances_custom_categories';

// Standard icon options for users when creating or editing categories
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

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  ...EXPENSE_CATEGORIES.map((c, i) => ({
    id: `cat-exp-${i}`,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: 'expense' as TransactionType,
    isDefault: true,
  })),
  ...INCOME_CATEGORIES.map((c, i) => ({
    id: `cat-inc-${i}`,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: 'income' as TransactionType,
    isDefault: true,
  })),
];

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
    this.categories = [...DEFAULT_CATEGORIES];
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
    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'GET',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
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
      // Fall through to LibSQL client execution below
    }

    // If Turso is connected, attempt to load from Turso categories table
    const client = tursoService.getClient();
    if (client) {
      try {
        const res = await client.execute('SELECT * FROM categories ORDER BY name ASC');
        if (res.rows && res.rows.length > 0) {
          const dbCategories: CategoryItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            icon: String(row.icon),
            color: String(row.color),
            type: row.type as TransactionType,
            isDefault: Boolean(row.is_default),
          }));
          this.categories = dbCategories;
          this.saveToCache();
        } else {
          // Table is empty, insert default categories to database
          for (const cat of DEFAULT_CATEGORIES) {
            await client.execute({
              sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
                    VALUES (?, ?, ?, ?, ?, ?)`,
              args: [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0],
            });
          }
          this.categories = [...DEFAULT_CATEGORIES];
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

  public async addCategory(cat: Omit<CategoryItem, 'id'>): Promise<CategoryItem> {
    const existing = this.categories.find(
      (c) => c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() && c.type === cat.type
    );
    if (existing) {
      throw new Error(`A ${cat.type} category named "${cat.name.trim()}" already exists.`);
    }

    const newCategory: CategoryItem = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: cat.name.trim(),
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isDefault: false,
    };

    this.categories = [...this.categories, newCategory];
    this.saveToCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify(cat),
        });
        if (res.ok) {
          const created: CategoryItem = await res.json();
          return created;
        }
      }
    } catch (e) {
      // Fall through
    }

    // Persist to Turso Cloud DB if connected directly
    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            newCategory.id,
            newCategory.name,
            newCategory.icon,
            newCategory.color,
            newCategory.type,
            0,
          ],
        });
      } catch (err) {
        console.error('Failed to sync added category to Turso DB:', err);
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

    // Check duplicate name
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
    };

    this.categories[index] = nextCategory;
    this.saveToCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: tursoService.getApiHeaders(),
          body: JSON.stringify({ id, ...updated }),
        });
        if (res.ok) {
          const updatedCat: CategoryItem = await res.json();
          return updatedCat;
        }
      }
    } catch (e) {
      // Fall through
    }

    // Update in Turso DB if connected directly
    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute({
          sql: `UPDATE categories SET name = ?, icon = ?, color = ?, type = ? WHERE id = ?`,
          args: [
            nextCategory.name,
            nextCategory.icon,
            nextCategory.color,
            nextCategory.type,
            nextCategory.id,
          ],
        });
      } catch (err) {
        console.error('Failed to sync category update to Turso DB:', err);
      }
    }

    return nextCategory;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveToCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
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

    const client = tursoService.getClient();
    if (client) {
      try {
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
    this.categories = [...DEFAULT_CATEGORIES];
    this.saveToCache();

    // Try Vercel Serverless API first
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/categories?action=reset', {
          method: 'POST',
          headers: tursoService.getApiHeaders(),
        });
        if (res.ok) {
          const resetItems: CategoryItem[] = await res.json();
          this.categories = resetItems;
          this.saveToCache();
          return [...this.categories];
        }
      }
    } catch (e) {
      // Fall through
    }

    const client = tursoService.getClient();
    if (client) {
      try {
        await client.execute('DELETE FROM categories');
        for (const cat of DEFAULT_CATEGORIES) {
          await client.execute({
            sql: `INSERT INTO categories (id, name, icon, color, type, is_default)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [cat.id, cat.name, cat.icon, cat.color, cat.type, 1],
          });
        }
      } catch (err) {
        console.error('Failed to reset categories in Turso DB:', err);
      }
    }

    return [...this.categories];
  }
}

export const categoryService = new CategoryService();
