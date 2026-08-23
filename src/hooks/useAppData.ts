import { useCallback, useEffect, useState } from 'react';
import { Transaction, TursoConfig } from '../types';
import { tursoService } from '../services/tursoService';
import { subscriptionService } from '../services/subscriptionService';
import { currencyService } from '../services/currencyService';
import { categoryService } from '../services/categoryService';
import { paymentMethodService } from '../services/paymentMethodService';
import { bankService } from '../services/bankService';
import { processSubscriptionAutoGeneration } from '../services/subscriptionAutoGenerator';
import { refreshCurrencyRates } from '../utils/currencies';
import { confirmAction } from '../utils/dialogs';
import { useToast } from '../contexts';
import i18n from '../i18n';

export function useAppData(enabled: boolean = true) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return tursoService.getLocalRecentTransactions(60);
  });
  const [totalCount, setTotalCount] = useState<number>(() => {
    return tursoService.getLocalTransactionCount();
  });
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { showToast, updateToast } = useToast();
  const [tursoConfig, setTursoConfig] = useState<TursoConfig>(() => tursoService.getConfig());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setConnectionError(null);
      const [bootstrapResult] = await Promise.all([
        tursoService.bootstrapAppData(60),
        refreshCurrencyRates(),
      ]);

      if (bootstrapResult.currencies) {
        currencyService.setCurrenciesFromBootstrap(bootstrapResult.currencies);
      }
      if (bootstrapResult.categories) {
        categoryService.setCategoriesFromBootstrap(bootstrapResult.categories);
      }
      if (bootstrapResult.paymentMethods) {
        paymentMethodService.setPaymentMethodsFromBootstrap(bootstrapResult.paymentMethods);
      }
      if (bootstrapResult.banks) {
        bankService.setBanksFromBootstrap(bootstrapResult.banks);
      }

      setTransactions(bootstrapResult.recentTransactions);
      setTotalCount(bootstrapResult.totalCount);
      setIsFullyLoaded(bootstrapResult.recentTransactions.length >= bootstrapResult.totalCount);
      const currentConfig = tursoService.getConfig();
      setTursoConfig(currentConfig);
      setIsConnected(currentConfig.isConnected);
      setIsInitialLoading(false);
      setConnectionError(null);

      // Background subscription auto-generation without blocking initial render
      subscriptionService
        .getSubscriptions()
        .then(async (subs) => {
          const newGenerated = await processSubscriptionAutoGeneration(
            subs,
            bootstrapResult.recentTransactions
          );
          if (newGenerated.length > 0) {
            const updated = await tursoService.getRecentTransactions(60);
            setTransactions((prev) => {
              const map = new Map<string, Transaction>();
              for (const t of prev) map.set(t.id, t);
              for (const t of updated) map.set(t.id, t);
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            });
            const updatedTotal = await tursoService.getTransactionCount();
            setTotalCount(updatedTotal);
          }
        })
        .catch((err) => {
          console.warn('Subscription background auto-generation error:', err);
        });
    } catch (e: any) {
      console.warn('Error loading app data:', e);
      const currentConfig = tursoService.getConfig();
      setTursoConfig(currentConfig);
      setIsConnected(currentConfig.isConnected);
      setIsInitialLoading(false);
      if (!currentConfig.isConnected) {
        setConnectionError(e?.message || 'Connection failed');
      }
    }
  }, []);

  const loadMoreTransactions = useCallback(
    async (currentOffset?: number) => {
      if (isLoadingMore || isFullyLoaded) return;
      setIsLoadingMore(true);
      try {
        const offset = currentOffset !== undefined ? currentOffset : transactions.length;
        const result = await tursoService.getTransactionsPaginated(50, offset);
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = result.transactions.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
        setTotalCount(result.total);
        if (!result.hasMore || result.transactions.length === 0) {
          setIsFullyLoaded(true);
        }
      } catch (err) {
        console.warn('Error loading more transactions:', err);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [isLoadingMore, isFullyLoaded, transactions.length]
  );

  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [enabled, loadData]);

  const clearAllTransactions = async () => {
    confirmAction({
      title: 'Clear All Transactions',
      message:
        'Are you sure you want to clear ALL transactions? This will permanently delete all expense and income records from your local storage and Turso Cloud database.',
      destructive: true,
      onConfirm: async () => {
        const toastId = showToast({ type: 'loading', message: i18n.t('toast.clearingAll') });
        try {
          const empty = await tursoService.clearAllTransactions();
          updateToast(toastId, { type: 'success', message: i18n.t('toast.clearedAll') });
          setTransactions(empty);
          setTotalCount(0);
          setIsFullyLoaded(true);
        } catch (err: any) {
          updateToast(toastId, { type: 'error', message: err?.message || i18n.t('toast.deleteError') });
        }
      },
    });
  };

  return {
    transactions,
    tursoConfig,
    isInitialLoading,
    isConnected,
    connectionError,
    retryConnection: loadData,
    loadData,
    clearAllTransactions,
    isFullyLoaded,
    isLoadingMore,
    totalCount,
    loadMoreTransactions,
  };
}
