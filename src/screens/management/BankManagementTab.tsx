import React, { useCallback, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { BankItem } from '../../types';
import { EntityManagementCard } from '../../components/EntityManagementCard';
import { AppCard, AppEmptyState, AppTextInput, AppText } from '../../components/ui';
import { Building2, Plus, Search } from 'lucide-react-native';
import theme from '../../theme';

interface BankManagementTabProps {
  banks: BankItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (bank: BankItem) => void;
  onDeleteBank: (bank: BankItem) => void;
}

export const BankManagementTab: React.FC<BankManagementTabProps> = ({
  banks,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteBank,
}) => {
  const filteredBanks = useMemo(() => {
    return banks.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [banks, searchQuery]);

  const renderItem = useCallback(({ item }: { item: BankItem }) => {
    return (
      <View style={styles.cardWrapper}>
        <EntityManagementCard
          name={item.name}
          subtitle="Bank Institution"
          icon={<Building2 size={20} color={theme.colors.accent} />}
          onEdit={() => onOpenEditModal(item)}
          onDelete={() => onDeleteBank(item)}
        />
      </View>
    );
  }, [onOpenEditModal, onDeleteBank]);

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
              <AppText style={styles.createBtnText}>New Bank</AppText>
            </Pressable>
          </View>

          <AppTextInput
            placeholder="Search banks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search size={16} color={theme.colors.textTertiary} />}
          />
        </AppCard>
      </View>

      <View style={styles.listWrapper}>
        <FlashList<BankItem>
          data={filteredBanks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <AppEmptyState
              title="No banks found"
              description="Try adding a new bank or adjusting your search query."
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
