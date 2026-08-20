import React, { useCallback, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryItem, TransactionType } from '../../types';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EntityManagementCard } from '../../components/management';
import {
  AppCard,
  AppDraggableList,
  AppEmptyState,
  AppSegmentedControl,
  AppTextInput,
  AppText,
  RenderDraggableItemInfo,
} from '../../components/ui';
import { Plus, Search } from 'lucide-react-native';
import theme, { useTheme } from '../../theme';

interface CategoryManagementTabProps {
  categories: CategoryItem[];
  activeCategoryType: TransactionType;
  setActiveCategoryType: (type: TransactionType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (cat: CategoryItem) => void;
  onDeleteCategory: (cat: CategoryItem) => void;
  onToggleCategory?: (cat: CategoryItem, enabled: boolean) => void;
  onReorderCategories?: (reorderedCategories: CategoryItem[]) => void;
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
  onToggleCategory,
  onReorderCategories,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isSearching = searchQuery.trim().length > 0;

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.type === activeCategoryType &&
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [categories, activeCategoryType, searchQuery]);

  const typeLabel = activeCategoryType === 'income' ? t('common.income') : t('common.expense');

  const renderItem = useCallback(
    ({ item, isDragging, dragHandleProps }: RenderDraggableItemInfo<CategoryItem>) => {
      return (
        <View style={styles.cardWrapper}>
          <EntityManagementCard
            name={item.name}
            subtitle={item.type === 'income' ? t('common.income') : t('common.expense')}
            color={item.color}
            icon={<CategoryIcon iconName={item.icon} color={item.color} size={20} />}
            onEdit={() => onOpenEditModal(item)}
            onDelete={() => onDeleteCategory(item)}
            enabled={item.enabled !== false}
            onToggleEnabled={onToggleCategory ? (val) => onToggleCategory(item, val) : undefined}
            isDraggable={!isSearching}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
          />
        </View>
      );
    },
    [onOpenEditModal, onDeleteCategory, onToggleCategory, isSearching, t]
  );

  return (
    <View style={styles.tabContainer}>
      <View style={styles.filterSection}>
        <AppCard style={styles.filterCard} variant="glass" padding="lg">
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
                style={({ pressed }) => [
                  styles.createBtn,
                  { backgroundColor: theme.colors.accent },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={onOpenAddModal}
              >
                <Plus size={16} color={theme.colors.white} />
                <AppText style={[styles.createBtnText, { color: theme.colors.white }]}>
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

      <ScrollView
        style={styles.listWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      >
        <AppDraggableList<CategoryItem>
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onReorder={(newItems) => onReorderCategories?.(newItems)}
          disabled={isSearching}
          disabledMessage={t('management.reorderDisabledSearching')}
          ListEmptyComponent={
            <AppEmptyState
              title={t('management.noCategoriesFound', { type: typeLabel })}
              description={t('management.noCategoriesDesc')}
            />
          }
        />
      </ScrollView>
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
    gap: theme.spacing.md,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
  },
  createBtnText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  listWrapper: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: theme.spacing['4xl'],
    paddingBottom: 110,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    paddingVertical: theme.spacing.xxs,
  },
});
