import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react-native';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { AppSegmentedControl } from './AppSegmentedControl';
import { AppButton } from './AppButton';
import { AppBadge } from './AppBadge';
import { AppModal } from './AppModal';
import { CategoryIcon } from '../CategoryIcon';
import theme, { useTheme } from '../../theme';

export interface MultiSelectItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense' | string;
}

export interface AppMultiSelectDropdownProps {
  items: MultiSelectItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  title?: string;
  subtitle?: string;
  triggerLabel?: string;
  showTypeFilter?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  triggerStyle?: StyleProp<ViewStyle>;
}

type FilterType = 'all' | 'expense' | 'income';

export const AppMultiSelectDropdown: React.FC<AppMultiSelectDropdownProps> = ({
  items,
  selectedIds,
  onChange,
  title,
  subtitle,
  triggerLabel,
  showTypeFilter = false,
  disabled = false,
  style,
  triggerStyle,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set(selectedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<FilterType>('all');

  const isFiltered = selectedIds.length > 0;

  const typeOptions: { label: string; value: FilterType }[] = useMemo(
    () => [
      { label: t('common.all'), value: 'all' },
      { label: t('common.expenses'), value: 'expense' },
      { label: t('common.incomes'), value: 'income' },
    ],
    [t]
  );

  const handleOpenModal = () => {
    if (disabled) return;
    setTempSelectedIds(new Set(selectedIds));
    setSearchQuery('');
    setActiveType('all');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleApply = () => {
    onChange(Array.from(tempSelectedIds));
    setModalVisible(false);
  };

  const handleResetToAll = () => {
    setTempSelectedIds(new Set());
    onChange([]);
    setModalVisible(false);
  };

  const toggleItem = (id: string) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (showTypeFilter && activeType !== 'all') {
        if (item.type !== activeType) return false;
      }
      if (query) {
        if (!item.name.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [items, showTypeFilter, activeType, searchQuery]);

  const handleSelectAllVisible = () => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const handleClearVisible = () => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((item) => next.delete(item.id));
      return next;
    });
  };

  const triggerDisplayText = useMemo(() => {
    if (triggerLabel) return triggerLabel;
    if (selectedIds.length === 0) {
      return t('analytics.allCategories');
    }
    return t('analytics.categoriesSelected', { count: selectedIds.length });
  }, [triggerLabel, selectedIds.length, t]);

  const selectedCountInModal = tempSelectedIds.size;

  return (
    <View style={[styles.container, style]}>
      {/* Dropdown Trigger Button */}
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: isFiltered
              ? theme.colors.accentBgStrong
              : theme.colors.surfaceRecessed,
            borderColor: isFiltered
              ? theme.colors.accent
              : theme.colors.borderSubtle,
          },
          disabled && styles.disabled,
          pressed && !disabled && { opacity: 0.8 },
          triggerStyle,
        ]}
        onPress={handleOpenModal}
        accessibilityRole="button"
        accessibilityLabel={triggerDisplayText}
      >
        <Filter
          size={14}
          color={isFiltered ? theme.colors.accent : theme.colors.textSecondary}
          strokeWidth={2}
        />
        <AppText
          style={[
            styles.triggerText,
            { color: isFiltered ? theme.colors.accent : theme.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {triggerDisplayText}
        </AppText>
        {isFiltered && (
          <AppBadge
            size="sm"
            variant="accent"
            label={String(selectedIds.length)}
          />
        )}
        <ChevronDown
          size={14}
          color={isFiltered ? theme.colors.accent : theme.colors.textMuted}
          strokeWidth={2}
        />
      </Pressable>

      {/* Multi-Select Filter Modal */}
      <AppModal
        visible={modalVisible}
        onClose={handleCloseModal}
        title={title || t('analytics.categoryFilterTitle')}
        subtitle={subtitle || t('analytics.categoryFilterSubtitle')}
        maxWidth={500}
      >
        <View style={styles.modalContent}>
          {/* Optional Type Filter Tabs */}
          {showTypeFilter && (
            <View style={styles.typeFilterWrapper}>
              <AppSegmentedControl<FilterType>
                options={typeOptions}
                selectedValue={activeType}
                onSelect={setActiveType}
                size="sm"
                fullWidth
              />
            </View>
          )}

          {/* Search Bar */}
          <AppTextInput
            size="sm"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('analytics.searchCategories')}
            icon={<Search size={14} color={theme.colors.textMuted} />}
            rightElement={
              searchQuery ? (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={theme.colors.textMuted} />
                </Pressable>
              ) : undefined
            }
          />

          {/* Selection Counter & Quick Select Actions */}
          <View style={styles.quickActionsRow}>
            <AppText style={[styles.counterText, { color: theme.colors.textSecondary }]}>
              {selectedCountInModal > 0
                ? t('analytics.categoriesSelected', { count: selectedCountInModal })
                : t('analytics.allCategories')}
            </AppText>
            <View style={styles.quickActionButtons}>
              <Pressable
                onPress={handleSelectAllVisible}
                style={({ pressed }) => [styles.quickActionBtn, pressed && { opacity: 0.7 }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <AppText style={[styles.quickActionText, { color: theme.colors.accent }]}>
                  {t('analytics.selectAll')}
                </AppText>
              </Pressable>
              <AppText style={[styles.quickActionDivider, { color: theme.colors.borderLight }]}>
                •
              </AppText>
              <Pressable
                onPress={handleClearVisible}
                style={({ pressed }) => [styles.quickActionBtn, pressed && { opacity: 0.7 }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <AppText style={[styles.quickActionText, { color: theme.colors.textMuted }]}>
                  {t('analytics.clearAll')}
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.itemsList}
            contentContainerStyle={styles.itemsListContent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AppText style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  {t('analytics.noCategoriesFound')}
                </AppText>
              </View>
            ) : (
              filteredItems.map((item) => {
                const isSelected = tempSelectedIds.has(item.id);

                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.itemRow,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.surfaceElevated
                          : theme.colors.surfaceRecessed,
                        borderColor: isSelected
                          ? theme.colors.accent
                          : theme.colors.borderSubtle,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => toggleItem(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={item.name}
                  >
                    <View style={styles.itemLeft}>
                      {/* Custom Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected
                              ? theme.colors.accent
                              : theme.colors.borderLight,
                            backgroundColor: isSelected
                              ? theme.colors.accent
                              : theme.colors.surfaceRecessed,
                          },
                        ]}
                      >
                        {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>

                      {/* Category Icon Badge */}
                      {item.icon && (
                        <View
                          style={[
                            styles.itemIconContainer,
                            {
                              backgroundColor: item.color
                                ? `${item.color}20`
                                : theme.colors.surfaceRecessed,
                            },
                          ]}
                        >
                          <CategoryIcon
                            iconName={item.icon}
                            color={item.color || theme.colors.textPrimary}
                            size={16}
                          />
                        </View>
                      )}

                      {/* Name */}
                      <AppText
                        style={[
                          styles.itemName,
                          {
                            color: isSelected
                              ? theme.colors.textPrimary
                              : theme.colors.textSecondary,
                            fontWeight: isSelected
                              ? theme.fontWeight.bold
                              : theme.fontWeight.medium,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </AppText>
                    </View>

                    {/* Category Type Indicator if in 'All' tab */}
                    {showTypeFilter && activeType === 'all' && item.type && (
                      <AppBadge
                        size="sm"
                        variant={item.type === 'income' ? 'success' : 'danger'}
                        label={item.type === 'income' ? t('common.income') : t('common.expense')}
                      />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <AppButton
              variant="ghost"
              title={t('analytics.resetFilter')}
              onPress={handleResetToAll}
              style={styles.footerBtn}
            />
            <AppButton
              variant="primary"
              title={t('analytics.applyFilter')}
              onPress={handleApply}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 34,
  },
  triggerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
  modalContent: {
    gap: theme.spacing.md,
  },
  typeFilterWrapper: {
    marginBottom: theme.spacing.xxs,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  counterText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  quickActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quickActionBtn: {
    paddingVertical: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.xs,
  },
  quickActionText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  quickActionDivider: {
    fontSize: theme.fontSize.xs,
  },
  itemsList: {
    maxHeight: 280,
  },
  itemsListContent: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: theme.fontSize.sm,
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
});
