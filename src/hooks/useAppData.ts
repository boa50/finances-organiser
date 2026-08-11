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

export function useAppData(enabled: boolean = true) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tursoConfig, setTursoConfig] = useState<TursoConfig>({
    url: '',
    authToken: '',
    isConnected: false,
  });

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        currencyService.getCurrencies(),
        categoryService.getCategories(),
        paymentMethodService.getPaymentMethods(),
        bankService.getBanks(),
        refreshCurrencyRates(),
        tursoService.initDatabase(),
      ]);
      const subs = await subscriptionService.getSubscriptions();
      let items = await tursoService.getTransactions();
      
      const newGenerated = await processSubscriptionAutoGeneration(subs, items);
      if (newGenerated.length > 0) {
        items = await tursoService.getTransactions();
      }

      setTransactions(items);
      setTursoConfig(tursoService.getConfig());
    } catch (e) {
      console.warn('Error loading app data:', e);
    }
  }, []);

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
        const empty = await tursoService.clearAllTransactions();
        setTransactions(empty);
      },
    });
  };

  return {
    transactions,
    tursoConfig,
    loadData,
    clearAllTransactions,
  };
}
