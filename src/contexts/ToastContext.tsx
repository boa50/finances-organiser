import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastType = 'loading' | 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  autoDismissMs?: number;
}

export interface ToastContextValue {
  activeToast: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Omit<ToastMessage, 'id'>>) => void;
  dismissToast: (id?: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, type: ToastType, customMs?: number) => {
      clearTimer();
      if (type === 'loading') return;

      const duration = customMs !== undefined ? customMs : type === 'error' ? 5000 : 3000;
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setActiveToast((prev) => (prev?.id === id ? null : prev));
          timerRef.current = null;
        }, duration);
      }
    },
    [clearTimer]
  );

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>): string => {
      toastIdCounter += 1;
      const id = `toast-${Date.now()}-${toastIdCounter}`;
      const newToast: ToastMessage = { ...toast, id };
      setActiveToast(newToast);
      scheduleAutoDismiss(id, toast.type, toast.autoDismissMs);
      return id;
    },
    [scheduleAutoDismiss]
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<ToastMessage, 'id'>>) => {
      setActiveToast((prev) => {
        if (!prev || prev.id !== id) return prev;
        const updated: ToastMessage = { ...prev, ...updates };
        scheduleAutoDismiss(id, updated.type, updated.autoDismissMs);
        return updated;
      });
    },
    [scheduleAutoDismiss]
  );

  const dismissToast = useCallback(
    (id?: string) => {
      setActiveToast((prev) => {
        if (!prev) return null;
        if (!id || prev.id === id) {
          clearTimer();
          return null;
        }
        return prev;
      });
    },
    [clearTimer]
  );

  const dismissAll = useCallback(() => {
    clearTimer();
    setActiveToast(null);
  }, [clearTimer]);

  const value = useMemo(
    () => ({
      activeToast,
      showToast,
      updateToast,
      dismissToast,
      dismissAll,
    }),
    [activeToast, showToast, updateToast, dismissToast, dismissAll]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
