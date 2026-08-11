import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PaymentMethodItem } from '../../types';
import { EntityManagementCard } from '../../components/EntityManagementCard';
import { AppCard, AppEmptyState, AppTextInput, AppText } from '../../components/ui';
import { CreditCard, Plus, Search } from 'lucide-react-native';
import theme from '../../theme';

interface PaymentMethodManagementTabProps {
  paymentMethods: PaymentMethodItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (pm: PaymentMethodItem) => void;
  onDeletePm: (pm: PaymentMethodItem) => void;
}

export const PaymentMethodManagementTab: React.FC<PaymentMethodManagementTabProps> = ({
  paymentMethods,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenEditModal,
  onDeletePm,
}) => {
  const filteredPms = paymentMethods.filter((pm) =>
    pm.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <View style={styles.tabContainer}>
      <AppCard style={styles.filterCard} padding="lg">
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.createBtn} onPress={onOpenAddModal}>
            <Plus size={16} color={theme.colors.white} />
            <AppText style={styles.createBtnText}>New Payment Method</AppText>
          </TouchableOpacity>
        </View>

        <AppTextInput
          placeholder="Search payment methods..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search size={16} color={theme.colors.textTertiary} />}
        />
      </AppCard>

      {filteredPms.length === 0 ? (
        <AppEmptyState
          title="No payment methods found"
          description="Try adding a new payment method or adjusting your search query."
        />
      ) : (
        <View style={styles.grid}>
          {filteredPms.map((pm) => (
            <EntityManagementCard
              key={pm.id}
              name={pm.name}
              subtitle={pm.allowInstallments ? 'Installments enabled' : 'Single payment only'}
              icon={<CreditCard size={20} color={theme.colors.accent} />}
              onEdit={() => onOpenEditModal(pm)}
              onDelete={() => onDeletePm(pm)}
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
