import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { ChartNoAxesCombined, House, List, Repeat, SlidersHorizontal } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './ui';
import theme, { useTheme } from '../theme';

export type TabName = 'overview' | 'analytics' | 'transactions' | 'subscriptions' | 'categories';

export interface AppTabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const AppTabBar: React.FC<AppTabBarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const tabs: { id: TabName; label: string; icon: (color: string) => React.ReactNode }[] = [
    {
      id: 'transactions',
      label: t('tabs.transactions'),
      icon: (color) => <List size={18} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'subscriptions',
      label: t('tabs.subscriptions'),
      icon: (color) => <Repeat size={18} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'overview',
      label: t('tabs.overview'),
      icon: (color) => <House size={18} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'analytics',
      label: t('tabs.analytics'),
      icon: (color) => <ChartNoAxesCombined size={18} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'categories',
      label: t('tabs.management'),
      icon: (color) => <SlidersHorizontal size={18} color={color} strokeWidth={2.2} />,
    },
  ];

  return (
    <View style={styles.dockContainer}>
      <View
        style={[
          styles.navTabBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
            boxShadow: theme.colors.navShadow,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const color = isActive ? theme.colors.accent : theme.colors.textSecondary;
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [
                styles.navTab,
                isActive && [
                  styles.navTabActive,
                  {
                    backgroundColor: theme.colors.accentBgStrong,
                    borderColor: theme.colors.borderAccent,
                  },
                ],
                pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => onTabChange(tab.id)}
            >
              {tab.icon(color)}
              <AppText
                style={[
                  styles.navText,
                  { color: theme.colors.textSecondary },
                  isActive && [styles.navTextActive, { color: theme.colors.accent }],
                ]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 14 : 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  navTabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: theme.radii.pill,
    paddingVertical: 5,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 540,
    width: '100%',
    elevation: 12,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: theme.radii.pill,
    gap: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navTabActive: {
    borderWidth: 1,
  },
  navText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
  },
  navTextActive: {
    fontWeight: theme.fontWeight.bold,
  },
});
