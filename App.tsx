import React, { useState } from 'react';
import './src/i18n';
import {
  StyleSheet,
  View,
  Pressable,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  OverviewScreen,
  AnalyticsScreen,
  TransactionsScreen,
  SubscriptionsScreen,
  ManagementScreen,
  LoginScreen,
} from './src/screens';
import { AppHeader, AppTabBar, TabName, TransactionEditModal } from './src/components';
import { AppButton, AppCard, AppLoadingView, AppText, GlobalToast } from './src/components/ui';
import { useAuth } from './src/hooks/useAuth';
import { useAppData } from './src/hooks/useAppData';
import { Plus } from 'lucide-react-native';
import theme, { ThemeProvider, useTheme } from './src/theme';
import { ToastProvider } from './src/contexts';

function MainApp() {
  const { t } = useTranslation();
  const { isAuthenticated, authenticate, logout } = useAuth();
  const {
    transactions,
    isInitialLoading,
    isConnected,
    connectionError,
    loadData,
    clearAllTransactions,
    isFullyLoaded,
    isLoadingMore,
    totalCount,
    loadMoreTransactions,
    isLoadingAllTransactions,
    loadAllTransactions,
  } = useAppData(isAuthenticated);
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const { theme, isDark } = useTheme();

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={authenticate} />;
  }

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <AppLoadingView message={t('common.loadingFinances')} />
      </SafeAreaView>
    );
  }

  if (!isConnected && connectionError) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={styles.errorCenterContainer}>
          <AppCard style={styles.errorCard} padding="xl">
            <AppText style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>
              {t('common.connectionFailedTitle')}
            </AppText>
            <AppText style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
              {t('common.connectionFailedMessage')}
            </AppText>
            <View style={styles.errorActions}>
              <AppButton
                title={t('common.retryConnection')}
                variant="primary"
                onPress={loadData}
              />
              <AppButton
                title={t('header.logout')}
                variant="ghost"
                onPress={logout}
              />
            </View>
          </AppCard>
        </View>
        <GlobalToast />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <AppHeader
        hasTransactions={transactions.length > 0}
        onClearAll={clearAllTransactions}
        onLogout={logout}
      />

      <View style={styles.screenContainer}>
        {activeTab === 'overview' && (
          <OverviewScreen
            transactions={transactions}
            totalCount={totalCount}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen
            transactions={transactions}
            isFullyLoaded={isFullyLoaded}
            isLoadingAllTransactions={isLoadingAllTransactions}
            onLoadAllTransactions={loadAllTransactions}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsScreen
            transactions={transactions}
            onRefresh={loadData}
            onLoadMore={loadMoreTransactions}
            isLoadingMore={isLoadingMore}
            isFullyLoaded={isFullyLoaded}
            totalCount={totalCount}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsScreen onSubscriptionsUpdated={loadData} />
        )}

        {activeTab === 'categories' && (
          <ManagementScreen onCategoriesUpdated={loadData} onCurrenciesUpdated={loadData} />
        )}
      </View>

      {(activeTab === 'overview' || activeTab === 'transactions') && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.colors.accent,
              boxShadow: theme.colors.fabShadow,
            },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => setAddTransactionModalVisible(true)}
        >
          <Plus size={28} color={theme.colors.white} strokeWidth={2.5} />
        </Pressable>
      )}

      <AppTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <TransactionEditModal
        visible={addTransactionModalVisible}
        transaction={null}
        onClose={() => setAddTransactionModalVisible(false)}
        onSaved={loadData}
      />

      <GlobalToast />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 74,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    zIndex: 25,
  },
  errorCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  errorCard: {
    maxWidth: 440,
    width: '100%',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  errorActions: {
    width: '100%',
    gap: theme.spacing.md,
  },
});
