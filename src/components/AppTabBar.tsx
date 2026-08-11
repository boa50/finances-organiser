import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChartNoAxesCombined, House, List, Repeat, SlidersHorizontal } from 'lucide-react-native';
import { AppText } from './ui';
import theme from '../theme';

export type TabName = 'overview' | 'analytics' | 'transactions' | 'subscriptions' | 'categories';

interface AppTabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const AppTabBar: React.FC<AppTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabName; label: string; icon: (color: string) => React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (color) => <House size={18} color={color} />,
    },
    {
      id: 'subscriptions',
      label: 'Subs',
      icon: (color) => <Repeat size={18} color={color} />,
    },
    {
      id: 'categories',
      label: 'Management',
      icon: (color) => <SlidersHorizontal size={18} color={color} />,
    },
    {
      id: 'analytics',
      label: 'D3 Graphs',
      icon: (color) => <ChartNoAxesCombined size={18} color={color} />,
    },
    {
      id: 'transactions',
      label: 'History',
      icon: (color) => <List size={18} color={color} />,
    },
  ];

  return (
    <View style={styles.navTabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? theme.colors.accent : theme.colors.textMuted;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navTab, isActive && styles.navTabActive]}
            onPress={() => onTabChange(tab.id)}
          >
            {tab.icon(color)}
            <AppText style={[styles.navText, isActive && styles.navTextActive]}>
              {tab.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    gap: 2,
  },
  navTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  navText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  navTextActive: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});
