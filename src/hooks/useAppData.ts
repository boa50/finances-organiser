import { useCallback, useEffect, useState } from 'react';
import { Transaction, TursoConfig } from '../types';
import { tursoService } from '../services/tursoService';
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
      await refreshCurrencyRates();
      await tursoService.initDatabase();
      const items = await tursoService.getTransactions();
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
