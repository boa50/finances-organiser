import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <View style={styles.tabContainer}>
      <AppCard style={styles.filterCard} padding="lg">
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.createBtn} onPress={onOpenAddModal}>
            <Plus size={16} color={theme.colors.white} />
            <AppText style={styles.createBtnText}>New Bank</AppText>
          </TouchableOpacity>
        </View>

        <AppTextInput
          placeholder="Search banks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search size={16} color={theme.colors.textTertiary} />}
        />
      </AppCard>

      {filteredBanks.length === 0 ? (
        <AppEmptyState
          title="No banks found"
          description="Try adding a new bank or adjusting your search query."
        />
      ) : (
        <View style={styles.grid}>
          {filteredBanks.map((bank) => (
            <EntityManagementCard
              key={bank.id}
              name={bank.name}
              subtitle="Bank Institution"
              icon={<Building2 size={20} color={theme.colors.accent} />}
              onEdit={() => onOpenEditModal(bank)}
              onDelete={() => onDeleteBank(bank)}
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
