import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut, Trash2, Zap } from 'lucide-react-native';
import { AppBadge, AppText } from './ui';
import theme from '../theme';

interface AppHeaderProps {
  isConnected: boolean;
  hasTransactions: boolean;
  onClearAll: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isConnected,
  hasTransactions,
  onClearAll,
  onLogout,
}) => {
  return (
    <View style={styles.topBar}>
      <View style={styles.brandContainer}>
        <Zap size={20} color={theme.colors.accent} strokeWidth={2} />
        <AppText style={styles.brandTitle}>FinanceCloud</AppText>
      </View>

      <View style={styles.topActions}>
        <AppBadge
          label={isConnected ? 'Turso Connected' : 'Turso Offline'}
          variant={isConnected ? 'success' : 'warning'}
          statusDot
        />

        {hasTransactions && (
          <TouchableOpacity style={styles.clearBtn} onPress={onClearAll}>
            <Trash2 size={14} color={theme.colors.danger} />
            <AppText style={styles.clearBtnText}>Clear All</AppText>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOut size={14} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  brandTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: theme.colors.danger,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
  },
  clearBtnText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
  },
});
