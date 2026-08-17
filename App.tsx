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
import { useAuth } from './src/hooks/useAuth';
import { useAppData } from './src/hooks/useAppData';
import { Plus } from 'lucide-react-native';
import theme from './src/theme';

export default function App() {
  const { isAuthenticated, authenticate, logout } = useAuth();
  const { transactions, tursoConfig, loadData, clearAllTransactions } = useAppData(isAuthenticated);
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={authenticate} />;
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

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
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 20px rgba(56, 189, 248, 0.45)',
    elevation: 10,
    zIndex: 25,
  },
});
