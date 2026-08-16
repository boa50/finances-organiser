import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CurrencyInfo } from '../../types';
import {
  AppCard,
  AppDraggableList,
  AppText,
  AppEmptyState,
  AppTextInput,
  AppSwitch,
  RenderDraggableItemInfo,
} from '../../components/ui';
import theme from '../../theme';
import { GripVertical, Plus, Search, Trash2 } from 'lucide-react-native';

interface CurrencyManagementTabProps {
  currencies: CurrencyInfo[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAddModal: () => void;
  onDeleteCurrency: (currency: CurrencyInfo) => void;
  onToggleCurrency?: (currency: CurrencyInfo, enabled: boolean) => void;
  onReorderCurrencies?: (reordered: CurrencyInfo[]) => void;
}

export const CurrencyManagementTab: React.FC<CurrencyManagementTabProps> = ({
  currencies,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onDeleteCurrency,
  onToggleCurrency,
  onReorderCurrencies,
}) => {
  const { t } = useTranslation();
  const isSearching = searchQuery.trim().length > 0;

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return currencies.filter((c) => {
      const localizedName = t(`currencies.${c.code}`, { defaultValue: c.name }).toLowerCase();
      return (
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        localizedName.includes(query)
      );
    });
  }, [currencies, searchQuery, t]);

  const canDelete = currencies.length > 1;

  const renderItem = useCallback(
    ({ item: currency, isDragging, dragHandleProps }: RenderDraggableItemInfo<CurrencyInfo>) => {
      const localizedName = t(`currencies.${currency.code}`, { defaultValue: currency.name });
      const isEnabled = currency.enabled !== false;

      return (
        <View style={styles.cardWrapper}>
          <AppCard
            variant="outlined"
            style={[
              styles.card,
              isDragging && styles.cardDragging,
              !isEnabled && styles.cardDisabled,
            ]}
          >
            <View style={styles.leftCol}>
              {!isSearching && (
                <View
                  {...dragHandleProps}
                  style={[
                    styles.dragHandle,
                    dragHandleProps?.style,
                    isDragging && styles.dragHandleActive,
                  ]}
                  accessibilityLabel={`Reorder ${currency.code}`}
                  accessibilityRole="button"
                >
                  <GripVertical
                    size={18}
                    color={isDragging ? theme.colors.accent : theme.colors.textMuted}
                  />
                </View>
              )}
              <View style={styles.cardInfo}>
                <AppText style={styles.flagText}>{currency.flag || '🌐'}</AppText>
                <View style={styles.textContainer}>
                  <AppText style={[styles.codeText, !isEnabled && styles.codeTextDisabled]}>
                    {currency.code}
                  </AppText>
                  <AppText style={styles.nameText}>{localizedName}</AppText>
                </View>
                <AppText style={styles.symbolBadge}>{currency.symbol}</AppText>
              </View>
            </View>

            <View style={styles.rightCol}>
              {onToggleCurrency && (
                <AppSwitch
                  value={isEnabled}
                  onValueChange={(val) => onToggleCurrency(currency, val)}
                  accessibilityLabel={isEnabled ? `Disable ${currency.code}` : `Enable ${currency.code}`}
                  style={styles.switch}
                />
              )}
              <Pressable
                onPress={() => onDeleteCurrency(currency)}
                disabled={!canDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  !canDelete && styles.deleteButtonDisabled,
                  pressed && canDelete && { opacity: 0.7 },
                ]}
                accessibilityLabel={`Delete ${currency.code}`}
              >
                <Trash2
                  size={18}
                  color={canDelete ? theme.colors.danger : theme.colors.textMuted}
                />
              </Pressable>
            </View>
          </AppCard>
        </View>
      );
    },
    [canDelete, onDeleteCurrency, onToggleCurrency, isSearching, t]
  );

  return (
    <View style={styles.tabContainer}>
      <View style={styles.filterSection}>
        <AppCard style={styles.filterCard} padding="lg">
          <View style={styles.topControls}>
            <Pressable
              style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
              onPress={onOpenAddModal}
            >
              <Plus size={16} color={theme.colors.white} />
              <AppText style={styles.createBtnText}>{t('management.addCurrency')}</AppText>
            </Pressable>
          </View>

          <AppTextInput
            placeholder={t('management.searchCurrencies')}
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
        <AppDraggableList<CurrencyInfo>
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          onReorder={(newItems) => onReorderCurrencies?.(newItems)}
          disabled={isSearching}
          disabledMessage={t('management.reorderDisabledSearching')}
          ListEmptyComponent={
            <AppEmptyState
              title={t('management.noCurrenciesFound')}
              description={
                searchQuery ? t('management.noCurrenciesSearchDesc') : t('management.noCurrenciesDesc')
              }
              actionTitle={searchQuery ? undefined : t('management.addCurrency')}
              onActionPress={searchQuery ? undefined : onOpenAddModal}
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
    gap: theme.spacing.lg,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardDragging: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceHighlight,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  dragHandle: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  dragHandleActive: {
    backgroundColor: `${theme.colors.accent}15`,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  flagText: {
    fontSize: theme.fontSize['2xl'],
  },
  textContainer: {
    flex: 1,
  },
  codeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  nameText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  symbolBadge: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.md,
  },
  cardDisabled: {
    opacity: 0.65,
  },
  codeTextDisabled: {
    color: theme.colors.textSecondary,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  deleteButtonDisabled: {
    opacity: 0.3,
  },
});
