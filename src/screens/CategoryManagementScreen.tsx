import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryItem, TransactionType } from '../types';
import {
  AVAILABLE_CATEGORY_ICONS,
  PRESET_CATEGORY_COLORS,
  categoryService,
} from '../services/categoryService';
import {
  Activity,
  Book,
  Briefcase,
  Car,
  Coffee,
  Dumbbell,
  Gift,
  Heart,
  Home,
  Key,
  Laptop,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  Repeat,
  RotateCcw,
  Shield,
  ShoppingBag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Tv,
  Utensils,
  X,
  Zap,
} from 'lucide-react-native';
import theme from '../theme';

interface CategoryManagementScreenProps {
  onCategoriesUpdated?: () => void;
}

export const CategoryManagementScreen: React.FC<CategoryManagementScreenProps> = ({
  onCategoriesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState(PRESET_CATEGORY_COLORS[0]);
  const [iconInput, setIconInput] = useState(AVAILABLE_CATEGORY_ICONS[0].iconName);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCategoriesData = async () => {
    setLoading(true);
    try {
      const items = await categoryService.getCategories();
      setCategories(items);
    } catch (e) {
      console.warn('Error loading categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setNameInput('');
    setColorInput(
      activeTab === 'expense' ? PRESET_CATEGORY_COLORS[0] : PRESET_CATEGORY_COLORS[4]
    );
    setIconInput(
      activeTab === 'expense' ? AVAILABLE_CATEGORY_ICONS[0].iconName : AVAILABLE_CATEGORY_ICONS[10].iconName
    );
    setErrorMsg(null);
    setModalVisible(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setNameInput(cat.name);
    setColorInput(cat.color);
    setIconInput(cat.icon);
    setErrorMsg(null);
    setModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!nameInput.trim()) {
      setErrorMsg('Please enter a category name.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: nameInput.trim(),
          color: colorInput,
          icon: iconInput,
          type: activeTab,
        });
      } else {
        await categoryService.addCategory({
          name: nameInput.trim(),
          color: colorInput,
          icon: iconInput,
          type: activeTab,
        });
      }

      await loadCategoriesData();
      if (onCategoriesUpdated) onCategoriesUpdated();
      setModalVisible(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    const performDelete = async () => {
      try {
        await categoryService.deleteCategory(cat.id);
        await loadCategoriesData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete category');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete category "${cat.name}"? Existing transactions will retain the name.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Delete category "${cat.name}"? Existing transactions will retain the name.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleResetDefaults = async () => {
    const performReset = async () => {
      setLoading(true);
      try {
        await categoryService.resetToDefaults();
        await loadCategoriesData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to reset categories');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Reset all categories to factory defaults? Your custom categories will be lost.')) {
        performReset();
      }
    } else {
      Alert.alert(
        'Reset Defaults',
        'Reset all categories to factory defaults? Your custom categories will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Category Manager</Text>
          <Text style={styles.subtitle}>
            Organize, add & edit your expense and income categories
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetDefaults}>
            <RotateCcw size={14} color={theme.colors.textSecondary} />
            <Text style={styles.resetBtnText}>Reset Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Plus size={16} color={theme.colors.background} />
            <Text style={styles.addBtnText}>New Category</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.tabActiveExpense]}
          onPress={() => setActiveTab('expense')}
        >
          <TrendingDown
            size={18}
            color={activeTab === 'expense' ? theme.colors.danger : theme.colors.textTertiary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'expense' && styles.tabTextActiveExpense,
            ]}
          >
            Expense Categories ({categories.filter((c) => c.type === 'expense').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.tabActiveIncome]}
          onPress={() => setActiveTab('income')}
        >
          <TrendingUp
            size={18}
            color={activeTab === 'income' ? theme.colors.success : theme.colors.textTertiary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'income' && styles.tabTextActiveIncome,
            ]}
          >
            Income Categories ({categories.filter((c) => c.type === 'income').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Grid */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No categories found</Text>
          <Text style={styles.emptySubtitle}>
            Tap "New Category" to create your first {activeTab} category.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredCategories.map((cat) => (
            <View key={cat.id} style={styles.catCard}>
              <View style={styles.catInfo}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: `${cat.color}25`, borderColor: cat.color },
                  ]}
                >
                  <CategoryIcon iconName={cat.icon} color={cat.color} size={20} />
                </View>

                <View style={styles.catTextGroup}>
                  <View style={styles.nameRow}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    {cat.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.catMeta}>
                    {cat.type === 'income' ? 'Income Category' : 'Expense Category'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => openEditModal(cat)}
                >
                  <Pencil size={15} color={theme.colors.accent} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconBtn, styles.deleteIconBtn]}
                  onPress={() => handleDeleteCategory(cat)}
                >
                  <Trash2 size={15} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingCategory ? 'Edit Category' : `New ${activeTab === 'income' ? 'Income' : 'Expense'} Category`}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Choose a title, custom color accent, and icon badge
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Category Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Subscriptions, Pet Care, Bonuses"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoCapitalize="words"
                />
              </View>

              {/* Color Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Color Theme</Text>
                <View style={styles.colorGrid}>
                  {PRESET_CATEGORY_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        colorInput === c && styles.colorDotSelected,
                      ]}
                      onPress={() => setColorInput(c)}
                    />
                  ))}
                </View>
              </View>

              {/* Icon Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Icon Badge</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconList}>
                  {AVAILABLE_CATEGORY_ICONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.iconChip,
                        iconInput === item.iconName && {
                          backgroundColor: `${colorInput}30`,
                          borderColor: colorInput,
                        },
                      ]}
                      onPress={() => setIconInput(item.iconName)}
                    >
                      <Text style={styles.emojiText}>{item.emoji}</Text>
                      <Text
                        style={[
                          styles.iconChipText,
                          iconInput === item.iconName && { color: colorInput, fontWeight: '700' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Live Preview */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preview</Text>
                <View style={styles.previewBox}>
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${colorInput}25`, borderColor: colorInput },
                    ]}
                  >
                    <CategoryIcon iconName={iconInput} color={colorInput} size={22} />
                  </View>
                  <Text style={styles.previewName}>
                    {nameInput.trim() || 'Category Name'}
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: activeTab === 'income' ? theme.colors.successBg : theme.colors.dangerBg }]}>
                    <Text style={{ color: activeTab === 'income' ? theme.colors.success : theme.colors.danger, fontSize: 11, fontWeight: '700' }}>
                      {activeTab.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.saveSubmitBtn, { backgroundColor: activeTab === 'income' ? theme.colors.success : theme.colors.accent }]}
                onPress={handleSaveCategory}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.background} />
                ) : (
                  <Text style={styles.saveSubmitText}>
                    {editingCategory ? 'Save Category' : 'Create Category'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const CategoryIcon: React.FC<{ iconName: string; color: string; size?: number }> = ({
  iconName,
  color,
  size = 20,
}) => {
  switch (iconName) {
    case 'utensils':
      return <Utensils size={size} color={color} />;
    case 'home':
      return <Home size={size} color={color} />;
    case 'car':
      return <Car size={size} color={color} />;
    case 'zap':
      return <Zap size={size} color={color} />;
    case 'tv':
      return <Tv size={size} color={color} />;
    case 'shopping-bag':
      return <ShoppingBag size={size} color={color} />;
    case 'activity':
      return <Activity size={size} color={color} />;
    case 'book':
      return <Book size={size} color={color} />;
    case 'plane':
      return <Plane size={size} color={color} />;
    case 'repeat':
      return <Repeat size={size} color={color} />;
    case 'briefcase':
      return <Briefcase size={size} color={color} />;
    case 'laptop':
      return <Laptop size={size} color={color} />;
    case 'trending-up':
      return <TrendingUp size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    case 'key':
      return <Key size={size} color={color} />;
    case 'coffee':
      return <Coffee size={size} color={color} />;
    case 'dumbbell':
      return <Dumbbell size={size} color={color} />;
    case 'shield':
      return <Shield size={size} color={color} />;
    case 'heart':
      return <Heart size={size} color={color} />;
    default:
      return <MoreHorizontal size={size} color={color} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing['4xl'],
    gap: theme.spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 9,
    borderRadius: theme.radii.base,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  resetBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 9,
    borderRadius: theme.radii.base,
    backgroundColor: theme.colors.accent,
  },
  addBtnText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.base,
  },
  tabActiveExpense: {
    backgroundColor: theme.colors.dangerBg,
    borderWidth: 1,
    borderColor: theme.colors.dangerBgLight,
  },
  tabActiveIncome: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tabText: {
    color: theme.colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActiveExpense: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  tabTextActiveIncome: {
    color: theme.colors.success,
    fontWeight: '700',
  },
  loaderBox: {
    padding: theme.spacing['7xl'],
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  emptyBox: {
    padding: theme.spacing['7xl'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    gap: theme.spacing.base,
  },
  catCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderAccent,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catTextGroup: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  catName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  defaultBadge: {
    backgroundColor: theme.colors.surfaceHighlight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.sm,
  },
  defaultText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  catMeta: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    backgroundColor: theme.colors.dangerBgLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['4xl'],
    maxWidth: 520,
    width: '100%',
    maxHeight: '90%',
    padding: theme.spacing['5xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing['2xl'],
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing.xxs,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    gap: theme.spacing['2xl'],
  },
  formGroup: {
    gap: theme.spacing.md,
  },
  formLabel: {
    color: theme.colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    borderRadius: theme.radii.base,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    fontSize: 14,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.base,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  iconList: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  emojiText: {
    fontSize: 14,
  },
  iconChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.base,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  saveSubmitBtn: {
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  saveSubmitText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
