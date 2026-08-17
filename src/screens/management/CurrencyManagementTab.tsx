import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CurrencyInfo } from '../../types';
import { EntityManagementCard } from '../../components/management';
import {
  AppCard,
  AppDraggableList,
  AppText,
  AppEmptyState,
  AppTextInput,
  RenderDraggableItemInfo,
} from '../../components/ui';
import theme from '../../theme';
import { Plus, Search } from 'lucide-react-native';

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

      return (
        <View style={styles.cardWrapper}>
          <EntityManagementCard
            name={currency.code}
            subtitle={localizedName}
            icon={<AppText style={styles.flagText}>{currency.flag || '🌐'}</AppText>}
            badge={<AppText style={styles.symbolBadge}>{currency.symbol}</AppText>}
            onDelete={() => onDeleteCurrency(currency)}
            canDelete={canDelete}
            enabled={currency.enabled !== false}
            onToggleEnabled={onToggleCurrency ? (val) => onToggleCurrency(currency, val) : undefined}
            isDraggable={!isSearching}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
          />
        </View>
      );
    },
    [canDelete, onDeleteCurrency, onToggleCurrency, isSearching, t]
  );

  return (
    <View style={styles.tabContainer}>
      <View style={styles.filterSection}>
        <AppCard style={styles.filterCard} variant="glass" padding="lg">
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
    gap: theme.spacing.md,
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
    borderRadius: theme.radii.pill,
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
    paddingBottom: 110,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    paddingVertical: theme.spacing.xxs,
  },
  flagText: {
    fontSize: theme.fontSize.xl,
  },
  symbolBadge: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
});
