import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankItem, CategoryItem, CurrencyInfo, PaymentMethodItem, TransactionType } from '../../types';
import {
  AVAILABLE_CATEGORY_ICONS,
  PRESET_CATEGORY_COLORS,
  categoryService,
} from '../../services/categoryService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { bankService } from '../../services/bankService';
import { currencyService } from '../../services/currencyService';
import { confirmAction } from '../../utils/dialogs';
import { AppLoadingView, AppSectionHeader, AppSegmentedControl } from '../../components/ui';
import theme from '../../theme';

import { CategoryManagementTab } from './CategoryManagementTab';
import { PaymentMethodManagementTab } from './PaymentMethodManagementTab';
import { BankManagementTab } from './BankManagementTab';
import { CurrencyManagementTab } from './CurrencyManagementTab';

import { CategoryEditModal } from './CategoryEditModal';
import { PaymentMethodEditModal } from './PaymentMethodEditModal';
import { BankEditModal } from './BankEditModal';
import { CurrencyAddModal } from './CurrencyAddModal';

export type ManagementSectionId = 'categories' | 'payment_methods' | 'banks' | 'currencies';

interface ManagementScreenProps {
  onCategoriesUpdated?: () => void;
  onCurrenciesUpdated?: () => void;
  initialSection?: ManagementSectionId;
}

export const ManagementScreen: React.FC<ManagementScreenProps> = ({
  onCategoriesUpdated,
  onCurrenciesUpdated,
  initialSection = 'categories',
}) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<ManagementSectionId>(initialSection);
  const [activeCategoryType, setActiveCategoryType] = useState<TransactionType>('expense');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
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

  // Currency Modal State
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [currencyErrorMsg, setCurrencyErrorMsg] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cats, pms, bks, currs] = await Promise.all([
        categoryService.getCategories(),
        paymentMethodService.getPaymentMethods(),
        bankService.getBanks(),
        currencyService.getCurrencies(),
      ]);
      setCategories(cats);
      setPaymentMethods(pms);
      setBanks(bks);
      setCurrencies(currs);
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

  const loadCurrenciesData = async () => {
    try {
      const items = await currencyService.getCurrencies();
      setCurrencies(items);
    } catch (e) {
      console.warn('Error loading currencies:', e);
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
      setErrorMsg(t('management.nameRequired'));
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
      setErrorMsg(err?.message || t('management.saveCategoryError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    confirmAction({
      title: t('management.deleteCategoryTitle'),
      message: t('management.deleteCategoryMsg', { name: cat.name }),
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
      setPmErrorMsg(t('management.pmNameRequired'));
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
      setPmErrorMsg(err?.message || t('management.savePmError'));
    } finally {
      setPmSaving(false);
    }
  };

  const handleDeletePm = async (pm: PaymentMethodItem) => {
    confirmAction({
      title: t('management.deletePmTitle'),
      message: t('management.deletePmMsg', { name: pm.name }),
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
      setBankErrorMsg(t('management.bankNameRequired'));
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
      setBankErrorMsg(err?.message || t('management.saveBankError'));
    } finally {
      setBankSaving(false);
    }
  };

  const handleDeleteBank = async (bank: BankItem) => {
    confirmAction({
      title: t('management.deleteBankTitle'),
      message: t('management.deleteBankMsg', { name: bank.name }),
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

  // ── Currency Handlers ──
  const openAddCurrencyModal = () => {
    setCurrencyErrorMsg(null);
    setCurrencyModalVisible(true);
  };

  const handleAddCurrency = async (code: string) => {
    setCurrencySaving(true);
    setCurrencyErrorMsg(null);

    try {
      await currencyService.addCurrency(code);
      await loadCurrenciesData();
      onCurrenciesUpdated?.();
      setCurrencyModalVisible(false);
    } catch (err: any) {
      setCurrencyErrorMsg(err?.message || t('management.addCurrencyError'));
    } finally {
      setCurrencySaving(false);
    }
  };

  const handleDeleteCurrency = async (currency: CurrencyInfo) => {
    const localizedName = t(`currencies.${currency.code}`, { defaultValue: currency.name });
    confirmAction({
      title: t('management.removeCurrencyTitle'),
      message: t('management.removeCurrencyMsg', { code: currency.code, name: localizedName }),
      destructive: true,
      onConfirm: async () => {
        try {
          await currencyService.removeCurrency(currency.code);
          await loadCurrenciesData();
          onCurrenciesUpdated?.();
        } catch (err: any) {
          confirmAction({
            title: t('management.cannotRemoveCurrencyTitle'),
            message: err?.message || t('management.removeCurrencyError'),
            destructive: false,
            onConfirm: () => {},
          });
        }
      },
    });
  };

  if (loading) {
    return <AppLoadingView message={t('management.loadingSettings')} />;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.fixedHeader}>
          <AppSectionHeader
            title={t('management.title')}
            subtitle={t('management.subtitle')}
          />

          <AppSegmentedControl<ManagementSectionId>
            options={[
              { label: t('management.categoriesTab'), value: 'categories' },
              { label: t('management.pmTab'), value: 'payment_methods' },
              { label: t('management.banksTab'), value: 'banks' },
              { label: t('management.currenciesTab'), value: 'currencies' },
            ]}
            selectedValue={activeSection}
            onSelect={(sec) => {
              setActiveSection(sec);
              setSearchQuery('');
            }}
          />
        </View>

        <View style={styles.tabContent}>
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
            />
          )}

          {activeSection === 'currencies' && (
            <CurrencyManagementTab
              currencies={currencies}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenAddModal={openAddCurrencyModal}
              onDeleteCurrency={handleDeleteCurrency}
            />
          )}
        </View>
      </View>

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

      <CurrencyAddModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
        enabledCurrencies={currencies}
        saving={currencySaving}
        errorMsg={currencyErrorMsg}
        onAddCurrency={handleAddCurrency}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fixedHeader: {
    paddingHorizontal: theme.spacing['4xl'],
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.lg,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  tabContent: {
    flex: 1,
    width: '100%',
  },
});
