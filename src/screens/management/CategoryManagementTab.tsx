import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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
  const filteredCategories = categories.filter(
    (c) =>
      c.type === activeCategoryType &&
      c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <View style={styles.tabContainer}>
      <AppCard style={styles.filterCard} padding="lg">
        <View style={styles.topControls}>
          <AppSegmentedControl<TransactionType>
            options={[
              {
              label: 'Incomes',
              value: 'income',
              selectedBackgroundColor: theme.colors.successBg,
              selectedBorderColor: theme.colors.success,
              selectedTextColor: theme.colors.success,
            },
            {
              label: 'Expenses',
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
                New {activeCategoryType === 'income' ? 'Income' : 'Expense'} Category
              </AppText>
            </Pressable>
          </View>
        </View>

        <AppTextInput
          placeholder={`Search ${activeCategoryType} categories...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search size={16} color={theme.colors.textTertiary} />}
        />
      </AppCard>

      {filteredCategories.length === 0 ? (
        <AppEmptyState
          title={`No ${activeCategoryType} categories found`}
          description="Try creating a new category or adjusting your search query."
        />
      ) : (
        <View style={styles.grid}>
          {filteredCategories.map((cat) => (
            <EntityManagementCard
              key={cat.id}
              name={cat.name}
              subtitle={cat.type}
              color={cat.color}
              icon={<CategoryIcon iconName={cat.icon} color={cat.color} size={20} />}
              onEdit={() => onOpenEditModal(cat)}
              onDelete={() => onDeleteCategory(cat)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    gap: theme.spacing.lg,
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
  grid: {
    gap: theme.spacing.sm,
  },
});
