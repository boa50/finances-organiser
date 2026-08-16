import React, { useCallback, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BankItem } from '../../types';
import { EntityManagementCard } from '../../components/management';
import {
  AppCard,
  AppDraggableList,
  AppEmptyState,
  AppTextInput,
  AppText,
  RenderDraggableItemInfo,
} from '../../components/ui';
import { Building2, Plus, Search } from 'lucide-react-native';
import theme from '../../theme';

interface BankManagementTabProps {
  banks: BankItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (bank: BankItem) => void;
  onDeleteBank: (bank: BankItem) => void;
  onToggleBank?: (bank: BankItem, enabled: boolean) => void;
  onReorderBanks?: (reordered: BankItem[]) => void;
}

export const BankManagementTab: React.FC<BankManagementTabProps> = ({
  banks,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteBank,
  onToggleBank,
  onReorderBanks,
}) => {
  const { t } = useTranslation();
  const isSearching = searchQuery.trim().length > 0;

  const filteredBanks = useMemo(() => {
    return banks.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [banks, searchQuery]);

  const renderItem = useCallback(
    ({ item, isDragging, dragHandleProps }: RenderDraggableItemInfo<BankItem>) => {
      return (
        <View style={styles.cardWrapper}>
          <EntityManagementCard
            name={item.name}
            subtitle={t('management.bankSubtitle')}
            icon={<Building2 size={20} color={theme.colors.accent} />}
            onEdit={() => onOpenEditModal(item)}
            onDelete={() => onDeleteBank(item)}
            enabled={item.enabled !== false}
            onToggleEnabled={onToggleBank ? (val) => onToggleBank(item, val) : undefined}
            isDraggable={!isSearching}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
          />
        </View>
      );
    },
    [onOpenEditModal, onDeleteBank, onToggleBank, isSearching, t]
  );

  return (
    <View style={styles.tabContainer}>
      <View style={styles.filterSection}>
        <AppCard style={styles.filterCard} padding="lg">
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
              onPress={onOpenAddModal}
            >
              <Plus size={16} color={theme.colors.white} />
              <AppText style={styles.createBtnText}>{t('management.newBank')}</AppText>
            </Pressable>
          </View>

          <AppTextInput
            placeholder={t('management.searchBanks')}
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
        <AppDraggableList<BankItem>
          data={filteredBanks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onReorder={(newItems) => onReorderBanks?.(newItems)}
          disabled={isSearching}
          disabledMessage={t('management.reorderDisabledSearching')}
          ListEmptyComponent={
            <AppEmptyState
              title={t('management.noBanksFound')}
              description={t('management.noBanksDesc')}
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
