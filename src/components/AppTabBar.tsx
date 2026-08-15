import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChartNoAxesCombined, House, List, Repeat, SlidersHorizontal } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './ui';
import theme from '../theme';

export type TabName = 'overview' | 'analytics' | 'transactions' | 'subscriptions' | 'categories';

interface AppTabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const AppTabBar: React.FC<AppTabBarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const tabs: { id: TabName; label: string; icon: (color: string) => React.ReactNode }[] = [
    {
      id: 'overview',
      label: t('tabs.overview'),
      icon: (color) => <House size={18} color={color} />,
    },
    {
      id: 'subscriptions',
      label: t('tabs.subscriptions'),
      icon: (color) => <Repeat size={18} color={color} />,
    },
    {
      id: 'categories',
      label: t('tabs.management'),
      icon: (color) => <SlidersHorizontal size={18} color={color} />,
    },
    {
      id: 'analytics',
      label: t('tabs.analytics'),
      icon: (color) => <ChartNoAxesCombined size={18} color={color} />,
    },
    {
      id: 'transactions',
      label: t('tabs.transactions'),
      icon: (color) => <List size={18} color={color} />,
    },
  ];

  return (
    <View style={styles.navTabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? theme.colors.accent : theme.colors.textMuted;
        return (
          <Pressable
            key={tab.id}
            style={({ pressed }) => [
              styles.navTab,
              isActive && styles.navTabActive,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            {tab.icon(color)}
            <AppText style={[styles.navText, isActive && styles.navTextActive]}>
              {tab.label}
            </AppText>
          </Pressable>
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
