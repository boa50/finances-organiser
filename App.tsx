import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { ManagementScreen } from './src/screens/ManagementScreen';
import { TransactionEditModal } from './src/components/TransactionEditModal';
import { LoginScreen } from './src/screens/LoginScreen';
import { AppHeader } from './src/components/AppHeader';
import { AppTabBar, TabName } from './src/components/AppTabBar';
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
          <ManagementScreen onCategoriesUpdated={loadData} />
        )}
      </View>

      {(activeTab === 'overview' || activeTab === 'transactions') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddTransactionModalVisible(true)}
          activeOpacity={0.85}
        >
          <Plus size={28} color={theme.colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
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
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
});
