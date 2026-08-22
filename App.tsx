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
import {
  OverviewScreen,
  AnalyticsScreen,
  TransactionsScreen,
  SubscriptionsScreen,
  ManagementScreen,
  LoginScreen,
} from './src/screens';
import { AppHeader, AppTabBar, TabName, TransactionEditModal } from './src/components';
import { GlobalToast } from './src/components/ui';
import { useAuth } from './src/hooks/useAuth';
import { useAppData } from './src/hooks/useAppData';
import { Plus } from 'lucide-react-native';
import { ThemeProvider, useTheme } from './src/theme';
import { ToastProvider } from './src/contexts';

function MainApp() {
  const { isAuthenticated, authenticate, logout } = useAuth();
  const { transactions, tursoConfig, loadData, clearAllTransactions } = useAppData(isAuthenticated);
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const { theme, isDark } = useTheme();

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={authenticate} />;
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <AppHeader
        isConnected={tursoConfig.isConnected}
        hasTransactions={transactions.length > 0}
        onClearAll={clearAllTransactions}
        onLogout={logout}
      />

      <View style={styles.screenContainer}>
        {activeTab === 'overview' && (
          <OverviewScreen
            transactions={transactions}
            tursoConfig={tursoConfig}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen transactions={transactions} />
        )}

        {activeTab === 'transactions' && (
          <TransactionsScreen transactions={transactions} onRefresh={loadData} />
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
});
