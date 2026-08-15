import React, { useCallback, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { CategoryItem, TransactionType } from '../../types';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EntityManagementCard } from '../../components/EntityManagementCard';
import { AppCard, AppEmptyState, AppSegmentedControl, AppTextInput, AppText } from '../../components/ui';
import { Plus, Search } from 'lucide-react-native';
import theme from '../../theme';

interface CategoryManagementTabProps {
  categories: CategoryItem[];
  activeCategoryType: TransactionType;
  setActiveCategoryType: (type: TransactionType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (cat: CategoryItem) => void;
  onDeleteCategory: (cat: CategoryItem) => void;
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = ({
  categories,
  activeCategoryType,
  setActiveCategoryType,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteCategory,
}) => {
  const { t } = useTranslation();

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.type === activeCategoryType &&
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [categories, activeCategoryType, searchQuery]);

  const typeLabel = activeCategoryType === 'income' ? t('common.income') : t('common.expense');

  const renderItem = useCallback(({ item }: { item: CategoryItem }) => {
    return (
      <View style={styles.cardWrapper}>
        <EntityManagementCard
          name={item.name}
          subtitle={item.type === 'income' ? t('common.income') : t('common.expense')}
          color={item.color}
          icon={<CategoryIcon iconName={item.icon} color={item.color} size={20} />}
          onEdit={() => onOpenEditModal(item)}
          onDelete={() => onDeleteCategory(item)}
        />
      </View>
    );
  }, [onOpenEditModal, onDeleteCategory, t]);

  return (
    <View style={styles.tabContainer}>
      <View style={styles.filterSection}>
        <AppCard style={styles.filterCard} padding="lg">
          <View style={styles.topControls}>
            <AppSegmentedControl<TransactionType>
              options={[
                {
                  label: t('common.incomes'),
                  value: 'income',
                  selectedBackgroundColor: theme.colors.successBg,
                  selectedBorderColor: theme.colors.success,
                  selectedTextColor: theme.colors.success,
                },
                {
                  label: t('common.expenses'),
                  value: 'expense',
                  selectedBackgroundColor: theme.colors.dangerBg,
                  selectedBorderColor: theme.colors.danger,
                  selectedTextColor: theme.colors.danger,
                },
              ]}
              selectedValue={activeCategoryType}
              onSelect={setActiveCategoryType}
            />

            <View style={styles.actionButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
                onPress={onOpenAddModal}
              >
                <Plus size={16} color={theme.colors.white} />
                <AppText style={styles.createBtnText}>
                  {t('management.newCategory', { type: typeLabel })}
                </AppText>
              </Pressable>
            </View>
          </View>

          <AppTextInput
            placeholder={t('management.searchCategories', { type: typeLabel })}
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search size={16} color={theme.colors.textTertiary} />}
          />
        </AppCard>
      </View>

      <View style={styles.listWrapper}>
        <FlashList<CategoryItem>
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <AppEmptyState
              title={t('management.noCategoriesFound', { type: typeLabel })}
              description={t('management.noCategoriesDesc')}
            />
          }
          renderItem={renderItem}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: theme.spacing['4xl'],
    paddingBottom: theme.spacing.md,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  filterCard: {
    gap: theme.spacing.lg,
  },
  topControls: {
    gap: theme.spacing.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
  },
  createBtnText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  listWrapper: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: theme.spacing['4xl'],
    paddingBottom: 88,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    paddingVertical: theme.spacing.xxs,
  },
});
