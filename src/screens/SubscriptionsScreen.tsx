import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { Subscription } from '../types';
import { subscriptionService } from '../services/subscriptionService';
import { categoryService } from '../services/categoryService';
import { convertCurrency, formatMoney } from '../utils/currencies';
import { confirmAction } from '../utils/dialogs';
import { CategoryIcon } from '../components/CategoryIcon';
import { SubscriptionEditModal } from '../components/SubscriptionEditModal';
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppSectionHeader,
  AppSegmentedControl,
  AppText,
  AppTextInput,
} from '../components/ui';
import { Calendar, CreditCard, Edit2, Trash2 } from 'lucide-react-native';
import theme from '../theme';

interface SubscriptionsScreenProps {
  onSubscriptionsUpdated?: () => void;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({
  onSubscriptionsUpdated,
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, { name: string; icon: string; color: string }>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const loadData = useCallback(async () => {
    try {
      const subs = await subscriptionService.getSubscriptions();
      setSubscriptions(subs);

      const cats = await categoryService.getCategories();
      const catMap: Record<string, { name: string; icon: string; color: string }> = {};
      cats.forEach((c) => {
        catMap[c.id] = { name: c.name, icon: c.icon, color: c.color };
        catMap[c.name] = { name: c.name, icon: c.icon, color: c.color };
      });
      setCategoriesMap(catMap);
    } catch (e) {
      console.warn('Failed to load subscriptions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleActive = async (sub: Subscription) => {
    const newActiveState = !sub.active;
    // Optimistic UI update
    setSubscriptions((prev) =>
      prev.map((item) => (item.id === sub.id ? { ...item, active: newActiveState } : item))
    );
    try {
      await subscriptionService.toggleSubscriptionActive(sub.id, newActiveState);
      if (onSubscriptionsUpdated) onSubscriptionsUpdated();
    } catch (e) {
      console.error('Failed to toggle subscription active status:', e);
      loadData(); // Revert on failure
    }
  };

  const handleDelete = (sub: Subscription) => {
    confirmAction({
      title: 'Delete Subscription',
      message: `Are you sure you want to delete "${sub.title}"? This will stop future auto-generation of expenses for this subscription.`,
      destructive: true,
      onConfirm: async () => {
        setSubscriptions((prev) => prev.filter((item) => item.id !== sub.id));
        try {
          await subscriptionService.deleteSubscription(sub.id);
          if (onSubscriptionsUpdated) onSubscriptionsUpdated();
        } catch (e) {
          console.error('Failed to delete subscription:', e);
          loadData();
        }
      },
    });
  };

  const handleOpenAddModal = () => {
    setSelectedSubscription(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setModalVisible(true);
  };

  const handleSaved = () => {
    loadData();
    if (onSubscriptionsUpdated) onSubscriptionsUpdated();
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.store && sub.store.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? sub.active
        : !sub.active;

    return matchesSearch && matchesStatus;
  });

  // Calculate monthly metrics
  const activeCount = subscriptions.filter((s) => s.active).length;
  const inactiveCount = subscriptions.length - activeCount;

  // Convert monthly total to BRL for summary metric
  const totalMonthlyBRL = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + convertCurrency(s.amount, s.currencyId, 'BRL'), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <AppSectionHeader
              title="Subscriptions & Recurrent Expenses"
              subtitle="Manage your monthly recurring service costs"
              actionLabel="+ New"
              onActionPress={handleOpenAddModal}
            />

            {/* Total Metric Card */}
            <AppCard variant="glass" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View>
                  <AppText style={styles.summaryLabel}>Total Monthly Recurring Expense</AppText>
                  <AppText style={styles.summaryValue}>
                    {formatMoney(totalMonthlyBRL, 'BRL')}
                  </AppText>
                </View>

                <View style={styles.badgesRow}>
                  <AppBadge
                    label={`${activeCount} Active`}
                    variant="success"
                    statusDot
                  />
                  <AppBadge
                    label={`${inactiveCount} Inactive`}
                    variant="neutral"
                  />
                </View>
              </View>
            </AppCard>

            {/* Controls / Filter Bar */}
            <View style={styles.controlsBar}>
              <AppTextInput
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              <AppSegmentedControl<'all' | 'active' | 'inactive'>
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                selectedValue={statusFilter}
                onSelect={(val) => setStatusFilter(val)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <AppEmptyState
            icon={<CreditCard size={40} color={theme.colors.textMuted} />}
            title="No Subscriptions Found"
            description={
              searchQuery || statusFilter !== 'all'
                ? 'No subscriptions match your search or filter criteria.'
                : 'You have not added any monthly recurring subscriptions yet. Tap "+ New" to add one!'
            }
            actionTitle={!searchQuery && statusFilter === 'all' ? 'Add Subscription' : undefined}
            onActionPress={handleOpenAddModal}
          />
        }
        renderItem={({ item }) => {
          const catKey = item.categoryId || '';
          const catInfo = categoriesMap[catKey] || {
            name: item.categoryId ? 'Category' : 'Uncategorized',
            icon: 'CreditCard',
            color: theme.colors.accent,
          };
          const categoryDisplayName = catInfo.name || 'Uncategorized';

          return (
            <AppCard variant="glass" style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <View style={styles.subCardMainInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: catInfo.color + '22' }]}>
                    <CategoryIcon iconName={catInfo.icon} size={22} color={catInfo.color} />
                  </View>
                  <View style={styles.subTextGroup}>
                    <AppText style={styles.subTitle}>{item.title}</AppText>
                    <View style={styles.subMetaRow}>
                      <AppText style={styles.subCategory}>{categoryDisplayName}</AppText>
                      {item.store && (
                        <>
                          <AppText style={styles.dot}>•</AppText>
                          <AppText style={styles.subStore}>{item.store}</AppText>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.amountGroup}>
                  <AppText style={styles.subAmount}>
                    {formatMoney(item.amount, item.currencyId)}
                  </AppText>
                  <AppText style={styles.perMonthText}>/ month</AppText>
                </View>
              </View>

              {/* Sub Card Footer Info */}
              <View style={styles.subCardFooter}>
                <View style={styles.billingDayPill}>
                  <Calendar size={13} color={theme.colors.accent} />
                  <AppText style={styles.billingDayText}>
                    Due on day {item.billingDay} of every month
                  </AppText>
                </View>

                <View style={styles.subCardActions}>
                  {/* Status toggle */}
                  <View style={styles.switchWrapper}>
                    <AppBadge
                      label={item.active ? 'Active' : 'Inactive'}
                      variant={item.active ? 'success' : 'neutral'}
                    />
                    <Switch
                      value={item.active}
                      onValueChange={() => handleToggleActive(item)}
                      trackColor={{ false: theme.colors.borderSubtle, true: theme.colors.success }}
                      thumbColor={theme.colors.white}
                      style={styles.switch}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEditModal(item)}
                  >
                    <Edit2 size={16} color={theme.colors.accent} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(item)}
                  >
                    <Trash2 size={16} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </AppCard>
          );
        }}
      />

      <SubscriptionEditModal
        visible={modalVisible}
        subscription={selectedSubscription}
        onClose={() => setModalVisible(false)}
        onSaved={handleSaved}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing['4xl'],
    paddingBottom: 88,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  summaryValue: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },
  badgesRow: {
    gap: theme.spacing.xs,
    alignItems: 'flex-end',
  },
  controlsBar: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  subCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCardMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTextGroup: {
    flex: 1,
  },
  subTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subCategory: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  dot: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  subStore: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  amountGroup: {
    alignItems: 'flex-end',
  },
  subAmount: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  perMonthText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  subCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  billingDayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  billingDayText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  subCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  iconBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSubtle,
  },
});
