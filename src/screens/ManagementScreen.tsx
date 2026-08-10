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
import { BankItem, CategoryItem, PaymentMethodItem, TransactionType } from '../types';
import {
  AVAILABLE_CATEGORY_ICONS,
  PRESET_CATEGORY_COLORS,
  categoryService,
} from '../services/categoryService';
import { paymentMethodService } from '../services/paymentMethodService';
import { bankService } from '../services/bankService';
import {
  Activity,
  Book,
  Briefcase,
  Building2,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Gift,
  Heart,
  Home,
  Key,
  Laptop,
  Layers,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  Repeat,
  RotateCcw,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
  Tv,
  Utensils,
  X,
  Zap,
} from 'lucide-react-native';
import theme from '../theme';

export type ManagementSectionId = 'categories' | 'payment_methods' | 'banks';

export interface ManagementSectionConfig {
  id: ManagementSectionId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

export const MANAGEMENT_SECTIONS: ManagementSectionConfig[] = [
  {
    id: 'categories',
    label: 'Categories',
    subtitle: 'Organize, add & edit expense and income categories',
    icon: ({ size, color }) => <Layers size={size} color={color} />,
  },
  {
    id: 'payment_methods',
    label: 'Ways of Payment',
    subtitle: 'Manage payment methods for your income and expenses',
    icon: ({ size, color }) => <CreditCard size={size} color={color} />,
  },
  {
    id: 'banks',
    label: 'Banks',
    subtitle: 'Manage banks associated with your expenses',
    icon: ({ size, color }) => <Building2 size={size} color={color} />,
  },
];

interface ManagementScreenProps {
  onCategoriesUpdated?: () => void;
  initialSection?: ManagementSectionId;
}

export const ManagementScreen: React.FC<ManagementScreenProps> = ({
  onCategoriesUpdated,
  initialSection = 'categories',
}) => {
  const [activeSection, setActiveSection] = useState<ManagementSectionId>(initialSection);
  const [activeCategoryType, setActiveCategoryType] = useState<TransactionType>('expense');
  
  // Data State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState(PRESET_CATEGORY_COLORS[0]);
  const [iconInput, setIconInput] = useState(AVAILABLE_CATEGORY_ICONS[0].iconName);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payment Method Modal State
  const [pmModalVisible, setPmModalVisible] = useState(false);
  const [editingPm, setEditingPm] = useState<PaymentMethodItem | null>(null);
  const [pmNameInput, setPmNameInput] = useState('');
  const [pmSaving, setPmSaving] = useState(false);
  const [pmErrorMsg, setPmErrorMsg] = useState<string | null>(null);

  // Bank Modal State
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState<BankItem | null>(null);
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankErrorMsg, setBankErrorMsg] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cats, pms, bks] = await Promise.all([
        categoryService.getCategories(),
        paymentMethodService.getPaymentMethods(),
        bankService.getBanks(),
      ]);
      setCategories(cats);
      setPaymentMethods(pms);
      setBanks(bks);
    } catch (e) {
      console.warn('Error loading management data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesData = async () => {
    try {
      const items = await categoryService.getCategories();
      setCategories(items);
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  };

  const loadPaymentMethodsData = async () => {
    try {
      const items = await paymentMethodService.getPaymentMethods();
      setPaymentMethods(items);
    } catch (e) {
      console.warn('Error loading payment methods:', e);
    }
  };

  const loadBanksData = async () => {
    try {
      const items = await bankService.getBanks();
      setBanks(items);
    } catch (e) {
      console.warn('Error loading banks:', e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ── Category Handlers ──
  const openAddCatModal = () => {
    setEditingCategory(null);
    setNameInput('');
    setColorInput(
      activeCategoryType === 'expense' ? PRESET_CATEGORY_COLORS[0] : PRESET_CATEGORY_COLORS[4]
    );
    setIconInput(
      activeCategoryType === 'expense'
        ? AVAILABLE_CATEGORY_ICONS[0].iconName
        : AVAILABLE_CATEGORY_ICONS[10].iconName
    );
    setErrorMsg(null);
    setModalVisible(true);
  };

  const openEditCatModal = (cat: CategoryItem) => {
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
          type: activeCategoryType,
        });
      } else {
        await categoryService.addCategory({
          name: nameInput.trim(),
          color: colorInput,
          icon: iconInput,
          type: activeCategoryType,
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

  const handleResetCatDefaults = async () => {
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

  // ── Payment Method Handlers ──
  const openAddPmModal = () => {
    setEditingPm(null);
    setPmNameInput('');
    setPmErrorMsg(null);
    setPmModalVisible(true);
  };

  const openEditPmModal = (pm: PaymentMethodItem) => {
    setEditingPm(pm);
    setPmNameInput(pm.name);
    setPmErrorMsg(null);
    setPmModalVisible(true);
  };

  const handleSavePm = async () => {
    if (!pmNameInput.trim()) {
      setPmErrorMsg('Please enter a payment method name.');
      return;
    }
    setPmSaving(true);
    setPmErrorMsg(null);
    try {
      if (editingPm) {
        await paymentMethodService.updatePaymentMethod(editingPm.id, pmNameInput.trim());
      } else {
        await paymentMethodService.addPaymentMethod(pmNameInput.trim());
      }
      await loadPaymentMethodsData();
      if (onCategoriesUpdated) onCategoriesUpdated();
      setPmModalVisible(false);
    } catch (err: any) {
      setPmErrorMsg(err?.message || 'Failed to save payment method.');
    } finally {
      setPmSaving(false);
    }
  };

  const handleDeletePm = (pm: PaymentMethodItem) => {
    const performDelete = async () => {
      try {
        await paymentMethodService.deletePaymentMethod(pm.id);
        await loadPaymentMethodsData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete payment method');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete payment method "${pm.name}"? Existing transactions will retain the name.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Payment Method',
        `Delete payment method "${pm.name}"? Existing transactions will retain the name.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleResetPmDefaults = async () => {
    const performReset = async () => {
      try {
        await paymentMethodService.resetToDefaults();
        await loadPaymentMethodsData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to reset payment methods');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Reset payment methods to defaults? Your custom payment methods will be lost.')) {
        performReset();
      }
    } else {
      Alert.alert(
        'Reset Defaults',
        'Reset payment methods to defaults? Your custom payment methods will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  // ── Bank Handlers ──
  const openAddBankModal = () => {
    setEditingBank(null);
    setBankNameInput('');
    setBankErrorMsg(null);
    setBankModalVisible(true);
  };

  const openEditBankModal = (bank: BankItem) => {
    setEditingBank(bank);
    setBankNameInput(bank.name);
    setBankErrorMsg(null);
    setBankModalVisible(true);
  };

  const handleSaveBank = async () => {
    if (!bankNameInput.trim()) {
      setBankErrorMsg('Please enter a bank name.');
      return;
    }
    setBankSaving(true);
    setBankErrorMsg(null);
    try {
      if (editingBank) {
        await bankService.updateBank(editingBank.id, bankNameInput.trim());
      } else {
        await bankService.addBank(bankNameInput.trim());
      }
      await loadBanksData();
      if (onCategoriesUpdated) onCategoriesUpdated();
      setBankModalVisible(false);
    } catch (err: any) {
      setBankErrorMsg(err?.message || 'Failed to save bank.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleDeleteBank = (bank: BankItem) => {
    const performDelete = async () => {
      try {
        await bankService.deleteBank(bank.id);
        await loadBanksData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete bank');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete bank "${bank.name}"? Existing transactions will retain the name.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Bank',
        `Delete bank "${bank.name}"? Existing transactions will retain the name.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleResetBankDefaults = async () => {
    const performReset = async () => {
      try {
        await bankService.resetToDefaults();
        await loadBanksData();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } catch (err: any) {
        alert(err?.message || 'Failed to reset banks');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Reset banks to defaults? Your custom banks will be lost.')) {
        performReset();
      }
    } else {
      Alert.alert(
        'Reset Defaults',
        'Reset banks to defaults? Your custom banks will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeCategoryType);
  const activeConfig = MANAGEMENT_SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Top Level Segmented Navigation Bar ── */}
      <View style={styles.topNavWrapper}>
        <View style={styles.topNavTitleRow}>
          <SlidersHorizontal size={22} color={theme.colors.accent} />
          <Text style={styles.mainTitle}>Management Hub</Text>
        </View>
        <Text style={styles.mainSubtitle}>
          Select a section below to configure your financial settings
        </Text>

        <View style={styles.segmentedBar}>
          {MANAGEMENT_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            const count = sec.id === 'categories' ? categories.length : sec.id === 'payment_methods' ? paymentMethods.length : banks.length;
            const Icon = sec.icon;

            return (
              <TouchableOpacity
                key={sec.id}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setActiveSection(sec.id)}
                activeOpacity={0.7}
              >
                <Icon size={18} color={isActive ? theme.colors.accent : theme.colors.textSecondary} />
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {sec.label}
                </Text>
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Dynamic Section Header & Primary Actions ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{activeConfig.label}</Text>
          <Text style={styles.subtitle}>{activeConfig.subtitle}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={
              activeSection === 'categories'
                ? handleResetCatDefaults
                : activeSection === 'payment_methods'
                ? handleResetPmDefaults
                : handleResetBankDefaults
            }
          >
            <RotateCcw size={14} color={theme.colors.textSecondary} />
            <Text style={styles.resetBtnText}>Reset Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={
              activeSection === 'categories'
                ? openAddCatModal
                : activeSection === 'payment_methods'
                ? openAddPmModal
                : openAddBankModal
            }
          >
            <Plus size={16} color={theme.colors.background} />
            <Text style={styles.addBtnText}>
              {activeSection === 'categories'
                ? 'New Category'
                : activeSection === 'payment_methods'
                ? 'New Method'
                : 'New Bank'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Section Content: Categories ── */}
      {activeSection === 'categories' && (
        <>
          {/* Sub-tabs for Income / Expense */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeCategoryType === 'expense' && styles.tabActiveExpense]}
              onPress={() => setActiveCategoryType('expense')}
            >
              <TrendingDown
                size={18}
                color={activeCategoryType === 'expense' ? theme.colors.danger : theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeCategoryType === 'expense' && styles.tabTextActiveExpense,
                ]}
              >
                Expense Categories ({categories.filter((c) => c.type === 'expense').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeCategoryType === 'income' && styles.tabActiveIncome]}
              onPress={() => setActiveCategoryType('income')}
            >
              <TrendingUp
                size={18}
                color={activeCategoryType === 'income' ? theme.colors.success : theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeCategoryType === 'income' && styles.tabTextActiveIncome,
                ]}
              >
                Income Categories ({categories.filter((c) => c.type === 'income').length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid */}
          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No categories found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "New Category" to create your first {activeCategoryType} category.
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
                      onPress={() => openEditCatModal(cat)}
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
        </>
      )}

      {/* ── Section Content: Payment Methods ── */}
      {activeSection === 'payment_methods' && (
        <>
          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>Loading payment methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No payment methods found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "New Method" to create your first way of payment.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {paymentMethods.map((pm) => (
                <View key={pm.id} style={styles.catCard}>
                  <View style={styles.catInfo}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${theme.colors.accent}25`, borderColor: theme.colors.accent },
                      ]}
                    >
                      <CreditCard size={20} color={theme.colors.accent} />
                    </View>

                    <View style={styles.catTextGroup}>
                      <View style={styles.nameRow}>
                        <Text style={styles.catName}>{pm.name}</Text>
                        {pm.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.catMeta}>Payment Method</Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openEditPmModal(pm)}
                    >
                      <Pencil size={15} color={theme.colors.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconBtn, styles.deleteIconBtn]}
                      onPress={() => handleDeletePm(pm)}
                    >
                      <Trash2 size={15} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Section Content: Banks ── */}
      {activeSection === 'banks' && (
        <>
          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>Loading banks...</Text>
            </View>
          ) : banks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No banks found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "New Bank" to create your first bank.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {banks.map((bank) => (
                <View key={bank.id} style={styles.catCard}>
                  <View style={styles.catInfo}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${theme.colors.accent}25`, borderColor: theme.colors.accent },
                      ]}
                    >
                      <Building2 size={20} color={theme.colors.accent} />
                    </View>

                    <View style={styles.catTextGroup}>
                      <View style={styles.nameRow}>
                        <Text style={styles.catName}>{bank.name}</Text>
                        {bank.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.catMeta}>Bank</Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openEditBankModal(bank)}
                    >
                      <Pencil size={15} color={theme.colors.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconBtn, styles.deleteIconBtn]}
                      onPress={() => handleDeleteBank(bank)}
                    >
                      <Trash2 size={15} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Add/Edit Category Modal */}
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
                  {editingCategory
                    ? 'Edit Category'
                    : `New ${activeCategoryType === 'income' ? 'Income' : 'Expense'} Category`}
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
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          activeCategoryType === 'income' ? theme.colors.successBg : theme.colors.dangerBg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          activeCategoryType === 'income' ? theme.colors.success : theme.colors.danger,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {activeCategoryType.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.saveSubmitBtn,
                  {
                    backgroundColor:
                      activeCategoryType === 'income' ? theme.colors.success : theme.colors.accent,
                  },
                ]}
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

      {/* Add/Edit Payment Method Modal */}
      <Modal
        visible={pmModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingPm ? 'Edit Payment Method' : 'New Payment Method'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingPm ? 'Rename this way of payment' : 'Add a new way of payment'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPmModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Payment Method Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Pix, Apple Pay, Cash"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={pmNameInput}
                  onChangeText={setPmNameInput}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preview</Text>
                <View style={styles.previewBox}>
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${theme.colors.accent}25`, borderColor: theme.colors.accent },
                    ]}
                  >
                    <CreditCard size={22} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.previewName}>
                    {pmNameInput.trim() || 'Payment Method Name'}
                  </Text>
                </View>
              </View>

              {pmErrorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{pmErrorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveSubmitBtn, { backgroundColor: theme.colors.accent }]}
                onPress={handleSavePm}
                disabled={pmSaving}
              >
                {pmSaving ? (
                  <ActivityIndicator color={theme.colors.background} />
                ) : (
                  <Text style={styles.saveSubmitText}>
                    {editingPm ? 'Save Changes' : 'Create Payment Method'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Bank Modal */}
      <Modal
        visible={bankModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBankModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingBank ? 'Edit Bank' : 'New Bank'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingBank ? 'Rename this bank' : 'Add a new bank'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBankModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bank Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Nubank, Itaú, Bradesco"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={bankNameInput}
                  onChangeText={setBankNameInput}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preview</Text>
                <View style={styles.previewBox}>
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${theme.colors.accent}25`, borderColor: theme.colors.accent },
                    ]}
                  >
                    <Building2 size={22} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.previewName}>
                    {bankNameInput.trim() || 'Bank Name'}
                  </Text>
                </View>
              </View>

              {bankErrorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{bankErrorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveSubmitBtn, { backgroundColor: theme.colors.accent }]}
                onPress={handleSaveBank}
                disabled={bankSaving}
              >
                {bankSaving ? (
                  <ActivityIndicator color={theme.colors.background} />
                ) : (
                  <Text style={styles.saveSubmitText}>
                    {editingBank ? 'Save Changes' : 'Create Bank'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  topNavWrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.md,
  },
  topNavTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  mainTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  segmentText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: theme.colors.accent,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  badgeText: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: theme.colors.accent,
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
    fontSize: 22,
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
