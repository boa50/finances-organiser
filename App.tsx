import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Transaction, TursoConfig } from './src/types';
import { tursoService } from './src/services/tursoService';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { ManagementScreen } from './src/screens/ManagementScreen';
import { refreshCurrencyRates } from './src/utils/currencies';
import { TransactionEditModal } from './src/components/TransactionEditModal';
import { ChartNoAxesCombined, House, List, LogOut, Plus, SlidersHorizontal, Trash2, Zap } from 'lucide-react-native';
import { authService } from './src/services/authService';
import { LoginScreen } from './src/screens/LoginScreen';

type TabName = 'overview' | 'analytics' | 'transactions' | 'categories';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isAuthenticated()
  );
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tursoConfig, setTursoConfig] = useState<TursoConfig>({
    url: '',
    authToken: '',
    isConnected: false,
  });
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Fetch current exchange rates before calculating dashboard totals.
      await refreshCurrencyRates();

      // Attempt DB init
      await tursoService.initDatabase();

      const items = await tursoService.getTransactions();
      setTransactions(items);
      setTursoConfig(tursoService.getConfig());
    } catch (e) {
      console.warn('Error loading app data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Are you sure you want to clear ALL transactions? This will permanently delete all expense and income records from your local storage and Turso Cloud database.'
      )
    ) {
      const empty = await tursoService.clearAllTransactions();
      setTransactions(empty);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Application Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Zap size={20} color="#38BDF8" strokeWidth={2} />
          <Text style={styles.brandTitle}>FinanceCloud</Text>
        </View>

        <View style={styles.topActions}>
          <View
            style={[
              styles.tursoStatusBtn,
              {
                backgroundColor: tursoConfig.isConnected
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
                borderColor: tursoConfig.isConnected ? '#10B981' : '#F59E0B',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: tursoConfig.isConnected ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                styles.tursoStatusText,
                { color: tursoConfig.isConnected ? '#10B981' : '#F59E0B' },
              ]}
            >
              {tursoConfig.isConnected ? 'Turso Connected' : 'Turso Offline'}
            </Text>
          </View>

          {transactions.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
              <Trash2 size={14} color="#F43F5E" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>


      {/* Screen Router */}
      <View style={styles.screenContainer}>
        {activeTab === 'overview' && (
          <OverviewScreen
            transactions={transactions}
            tursoConfig={tursoConfig}
            onNavigateAdd={() => setAddTransactionModalVisible(true)}
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

        {activeTab === 'categories' && (
          <ManagementScreen onCategoriesUpdated={loadData} />
        )}
      </View>
      {/* Floating Action Button — visible on Overview and History only */}
      {(activeTab === 'overview' || activeTab === 'transactions') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddTransactionModalVisible(true)}
          activeOpacity={0.85}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.navTabBar}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'overview' && styles.navTabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <House size={18} color={activeTab === 'overview' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navText, activeTab === 'overview' && styles.navTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'categories' && styles.navTabActive]}
          onPress={() => setActiveTab('categories')}
        >
          <SlidersHorizontal size={18} color={activeTab === 'categories' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navText, activeTab === 'categories' && styles.navTextActive]}>
            Management
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'analytics' && styles.navTabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <ChartNoAxesCombined size={18} color={activeTab === 'analytics' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navText, activeTab === 'analytics' && styles.navTextActive]}>
            D3 Graphs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'transactions' && styles.navTabActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <List size={18} color={activeTab === 'transactions' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navText, activeTab === 'transactions' && styles.navTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <TransactionEditModal
        visible={addTransactionModalVisible}
        onClose={() => setAddTransactionModalVisible(false)}
        onSaved={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    fontSize: 20,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tursoStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tursoStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#F43F5E',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clearBtnText: {
    color: '#F43F5E',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
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
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  navTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 2,
  },
  navTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
