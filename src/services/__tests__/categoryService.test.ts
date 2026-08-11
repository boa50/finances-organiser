import { categoryService } from '../categoryService';

describe('categoryService', () => {
  beforeEach(async () => {
    await categoryService.resetToDefaults();
  });

  it('starts with empty list when reset', async () => {
    const categories = await categoryService.getCategories('expense');
    expect(categories.length).toBe(0);
  });

  it('adds a new category and allows deleting it', async () => {
    const initialCategories = await categoryService.getCategories('expense');
    const initialCount = initialCategories.length;

    const newCat = await categoryService.addCategory({
      name: 'Test Custom Expense',
      icon: 'utensils',
      color: '#FF0000',
      type: 'expense',
    });

    expect(newCat.name).toBe('Test Custom Expense');
    expect(newCat.id).toBeDefined();

    const afterAdd = await categoryService.getCategories('expense');
    expect(afterAdd.length).toBe(initialCount + 1);
    expect(afterAdd.some((c) => c.id === newCat.id)).toBe(true);

    const deleteResult = await categoryService.deleteCategory(newCat.id);
    expect(deleteResult).toBe(true);

    const afterDelete = await categoryService.getCategories('expense');
    expect(afterDelete.length).toBe(initialCount);
    expect(afterDelete.some((c) => c.id === newCat.id)).toBe(false);
  });

  it('prevents adding duplicate category names for the same type', async () => {
    await categoryService.addCategory({
      name: 'Food & Dining',
      icon: 'utensils',
      color: '#EF4444',
      type: 'expense',
    });

    await expect(
      categoryService.addCategory({
        name: 'Food & Dining',
        icon: 'utensils',
        color: '#EF4444',
        type: 'expense',
      })
    ).rejects.toThrow();
  });

  it('updates an existing category successfully', async () => {
    const created = await categoryService.addCategory({
      name: 'Old Category Name',
      icon: 'star',
      color: '#000000',
      type: 'expense',
    });

    const updated = await categoryService.updateCategory(created.id, {
      name: 'New Category Name',
      color: '#123456',
    });

    expect(updated.name).toBe('New Category Name');
    expect(updated.color).toBe('#123456');
  });

  it('prevents updating category to an existing category name of same type', async () => {
    await categoryService.addCategory({
      name: 'Existing Category',
      icon: 'utensils',
      color: '#EF4444',
      type: 'expense',
    });

    const customCat = await categoryService.addCategory({
      name: 'My Special Expense',
      icon: 'star',
      color: '#000000',
      type: 'expense',
    });

    await expect(
      categoryService.updateCategory(customCat.id, {
        name: 'Existing Category',
      })
    ).rejects.toThrow();
  });
});
