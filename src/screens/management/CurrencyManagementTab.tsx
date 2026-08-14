import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CurrencyInfo } from '../../types';
import { AppCard, AppText, AppEmptyState, AppTextInput } from '../../components/ui';
import theme from '../../theme';
import { Plus, Search, Trash2 } from 'lucide-react-native';

interface CurrencyManagementTabProps {
  currencies: CurrencyInfo[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAddModal: () => void;
  onDeleteCurrency: (currency: CurrencyInfo) => void;
}

export const CurrencyManagementTab: React.FC<CurrencyManagementTabProps> = ({
  currencies,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onDeleteCurrency,
}) => {
  const filteredCurrencies = useMemo(() => {
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currencies, searchQuery]);

  const canDelete = currencies.length > 1;

  const renderItem = useCallback(({ item: currency }: { item: CurrencyInfo }) => {
    return (
      <View style={styles.cardWrapper}>
        <AppCard variant="outlined" style={styles.card}>
          <View style={styles.cardInfo}>
            <AppText style={styles.flagText}>{currency.flag || '🌐'}</AppText>
            <View style={styles.textContainer}>
              <AppText style={styles.codeText}>{currency.code}</AppText>
              <AppText style={styles.nameText}>{currency.name}</AppText>
            </View>
            <AppText style={styles.symbolBadge}>{currency.symbol}</AppText>
          </View>

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
        </AppCard>
      </View>
    );
  }, [canDelete, onDeleteCurrency]);

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
              <AppText style={styles.createBtnText}>Add Currency</AppText>
            </Pressable>
          </View>

          <AppTextInput
            placeholder="Search currencies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search size={16} color={theme.colors.textTertiary} />}
          />
        </AppCard>
      </View>

      <View style={styles.listWrapper}>
        <FlashList<CurrencyInfo>
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <AppEmptyState
              title="No Currencies Found"
              description={
                searchQuery ? 'No currencies match your search query.' : 'No enabled currencies available.'
              }
              actionTitle={searchQuery ? undefined : 'Add Currency'}
              onActionPress={searchQuery ? undefined : onOpenAddModal}
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
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  deleteButtonDisabled: {
    opacity: 0.3,
  },
});
