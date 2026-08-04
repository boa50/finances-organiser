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
      if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${cat.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleResetDefaults = () => {
    const performReset = async () => {
      try {
        await categoryService.resetToDefaults();
        await loadCategoriesData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to reset categories');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Reset all categories back to initial default values?')) {
        performReset();
      }
    } else {
      Alert.alert(
        'Reset to Defaults',
        'Reset all categories back to default values?',
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
            <RotateCcw size={14} color="#94A3B8" />
            <Text style={styles.resetBtnText}>Reset Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Plus size={16} color="#0F172A" />
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
            color={activeTab === 'expense' ? '#F43F5E' : '#64748B'}
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
            color={activeTab === 'income' ? '#10B981' : '#64748B'}
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
          <ActivityIndicator size="large" color="#38BDF8" />
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
                  <Pencil size={15} color="#38BDF8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconBtn, styles.deleteIconBtn]}
                  onPress={() => handleDeleteCategory(cat)}
                >
                  <Trash2 size={15} color="#F43F5E" />
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
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Category Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Subscriptions, Pet Care, Bonuses"
                  placeholderTextColor="#64748B"
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
                  <View style={[styles.typeBadge, { backgroundColor: activeTab === 'income' ? '#10B98120' : '#F43F5E20' }]}>
                    <Text style={{ color: activeTab === 'income' ? '#10B981' : '#F43F5E', fontSize: 11, fontWeight: '700' }}>
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
                style={[styles.saveSubmitBtn, { backgroundColor: activeTab === 'income' ? '#10B981' : '#38BDF8' }]}
                onPress={handleSaveCategory}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.saveSubmitText}>
                    {editingCategory ? 'Save Category Changes' : 'Create Category'}
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

export const CategoryIcon: React.FC<{ iconName: string; color: string; size?: number }> = ({
  iconName,
  color,
  size = 18,
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
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#38BDF8',
  },
  addBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActiveExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  tabActiveIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActiveExpense: {
    color: '#F43F5E',
    fontWeight: '700',
  },
  tabTextActiveIncome: {
    color: '#10B981',
    fontWeight: '700',
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyBox: {
    padding: 40,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    gap: 10,
  },
  catCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catTextGroup: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  catMeta: {
    color: '#64748B',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
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
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    maxWidth: 520,
    width: '100%',
    maxHeight: '90%',
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    fontSize: 14,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  iconList: {
    gap: 8,
    paddingVertical: 4,
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiText: {
    fontSize: 14,
  },
  iconChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#F43F5E',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '600',
  },
  saveSubmitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveSubmitText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
});
