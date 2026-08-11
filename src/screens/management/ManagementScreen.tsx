import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { BankItem, CategoryItem, PaymentMethodItem, TransactionType } from '../../types';
import {
  AVAILABLE_CATEGORY_ICONS,
  PRESET_CATEGORY_COLORS,
  categoryService,
} from '../../services/categoryService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { bankService } from '../../services/bankService';
import { confirmAction } from '../../utils/dialogs';
import { AppLoadingView, AppSectionHeader, AppSegmentedControl } from '../../components/ui';
import theme from '../../theme';

import { CategoryManagementTab } from './CategoryManagementTab';
import { PaymentMethodManagementTab } from './PaymentMethodManagementTab';
import { BankManagementTab } from './BankManagementTab';

import { CategoryEditModal } from './CategoryEditModal';
import { PaymentMethodEditModal } from './PaymentMethodEditModal';
import { BankEditModal } from './BankEditModal';

export type ManagementSectionId = 'categories' | 'payment_methods' | 'banks';

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
  const [searchQuery, setSearchQuery] = useState('');

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
  const [pmAllowInstallments, setPmAllowInstallments] = useState(false);
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
      onCategoriesUpdated?.();
      setModalVisible(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    confirmAction({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`,
      destructive: true,
      onConfirm: async () => {
        try {
          await categoryService.deleteCategory(cat.id);
          await loadCategoriesData();
          onCategoriesUpdated?.();
        } catch (err: any) {
          console.error('Failed to delete category:', err);
        }
      },
    });
  };

  const handleResetCatDefaults = async () => {
    confirmAction({
      title: 'Reset Default Categories',
      message: 'Restore all built-in default categories? Custom categories will be removed.',
      destructive: true,
      onConfirm: async () => {
        try {
          await categoryService.resetToDefaults();
          await loadCategoriesData();
          onCategoriesUpdated?.();
        } catch (err: any) {
          console.error('Failed to reset categories:', err);
        }
      },
    });
  };

  // ── Payment Method Handlers ──
  const openAddPmModal = () => {
    setEditingPm(null);
    setPmNameInput('');
    setPmAllowInstallments(false);
    setPmErrorMsg(null);
    setPmModalVisible(true);
  };

  const openEditPmModal = (pm: PaymentMethodItem) => {
    setEditingPm(pm);
    setPmNameInput(pm.name);
    setPmAllowInstallments(Boolean(pm.allowInstallments));
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
        await paymentMethodService.updatePaymentMethod(
          editingPm.id,
          pmNameInput.trim(),
          pmAllowInstallments
        );
      } else {
        await paymentMethodService.addPaymentMethod(
          pmNameInput.trim(),
          pmAllowInstallments
        );
      }

      await loadPaymentMethodsData();
      setPmModalVisible(false);
    } catch (err: any) {
      setPmErrorMsg(err?.message || 'Failed to save payment method.');
    } finally {
      setPmSaving(false);
    }
  };

  const handleDeletePm = async (pm: PaymentMethodItem) => {
    confirmAction({
      title: 'Delete Payment Method',
      message: `Are you sure you want to delete "${pm.name}"?`,
      destructive: true,
      onConfirm: async () => {
        try {
          await paymentMethodService.deletePaymentMethod(pm.id);
          await loadPaymentMethodsData();
        } catch (err: any) {
          console.error('Failed to delete payment method:', err);
        }
      },
    });
  };

  const handleResetPmDefaults = async () => {
    confirmAction({
      title: 'Reset Default Payment Methods',
      message: 'Restore all default payment methods? Custom methods will be removed.',
      destructive: true,
      onConfirm: async () => {
        try {
          await paymentMethodService.resetToDefaults();
          await loadPaymentMethodsData();
        } catch (err: any) {
          console.error('Failed to reset payment methods:', err);
        }
      },
    });
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
      setBankModalVisible(false);
    } catch (err: any) {
      setBankErrorMsg(err?.message || 'Failed to save bank.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleDeleteBank = async (bank: BankItem) => {
    confirmAction({
      title: 'Delete Bank',
      message: `Are you sure you want to delete "${bank.name}"?`,
      destructive: true,
      onConfirm: async () => {
        try {
          await bankService.deleteBank(bank.id);
          await loadBanksData();
        } catch (err: any) {
          console.error('Failed to delete bank:', err);
        }
      },
    });
  };

  const handleResetBankDefaults = async () => {
    confirmAction({
      title: 'Reset Default Banks',
      message: 'Restore all default banks? Custom banks will be removed.',
      destructive: true,
      onConfirm: async () => {
        try {
          await bankService.resetToDefaults();
          await loadBanksData();
        } catch (err: any) {
          console.error('Failed to reset banks:', err);
        }
      },
    });
  };

  if (loading) {
    return <AppLoadingView message="Loading management settings..." />;
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AppSectionHeader
          title="Management Center"
          subtitle="Configure expense & income categories, payment methods, and bank options"
        />

        <AppSegmentedControl<ManagementSectionId>
          options={[
            { label: 'Categories', value: 'categories' },
            { label: 'Payment Methods', value: 'payment_methods' },
            { label: 'Banks', value: 'banks' },
          ]}
          selectedValue={activeSection}
          onSelect={(sec) => {
            setActiveSection(sec);
            setSearchQuery('');
          }}
        />

        {activeSection === 'categories' && (
          <CategoryManagementTab
            categories={categories}
            activeCategoryType={activeCategoryType}
            setActiveCategoryType={setActiveCategoryType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenAddModal={openAddCatModal}
            onOpenEditModal={openEditCatModal}
            onDeleteCategory={handleDeleteCategory}
            onResetDefaults={handleResetCatDefaults}
          />
        )}

        {activeSection === 'payment_methods' && (
          <PaymentMethodManagementTab
            paymentMethods={paymentMethods}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenAddModal={openAddPmModal}
            onOpenEditModal={openEditPmModal}
            onDeletePm={handleDeletePm}
            onResetDefaults={handleResetPmDefaults}
          />
        )}

        {activeSection === 'banks' && (
          <BankManagementTab
            banks={banks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenAddModal={openAddBankModal}
            onOpenEditModal={openEditBankModal}
            onDeleteBank={handleDeleteBank}
            onResetDefaults={handleResetBankDefaults}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <CategoryEditModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editingCategory={editingCategory}
        activeCategoryType={activeCategoryType}
        nameInput={nameInput}
        setNameInput={setNameInput}
        colorInput={colorInput}
        setColorInput={setColorInput}
        iconInput={iconInput}
        setIconInput={setIconInput}
        saving={saving}
        errorMsg={errorMsg}
        onSave={handleSaveCategory}
      />

      <PaymentMethodEditModal
        visible={pmModalVisible}
        onClose={() => setPmModalVisible(false)}
        editingPm={editingPm}
        pmNameInput={pmNameInput}
        setPmNameInput={setPmNameInput}
        pmAllowInstallments={pmAllowInstallments}
        setPmAllowInstallments={setPmAllowInstallments}
        pmSaving={pmSaving}
        pmErrorMsg={pmErrorMsg}
        onSave={handleSavePm}
      />

      <BankEditModal
        visible={bankModalVisible}
        onClose={() => setBankModalVisible(false)}
        editingBank={editingBank}
        bankNameInput={bankNameInput}
        setBankNameInput={setBankNameInput}
        bankSaving={bankSaving}
        bankErrorMsg={bankErrorMsg}
        onSave={handleSaveBank}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing['4xl'],
    paddingBottom: 88,
    gap: theme.spacing['3xl'],
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
});
