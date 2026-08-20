import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Globe, LogOut, Moon, Sun, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppBadge, AppText } from './ui';
import { toggleAppLanguage } from '../i18n';
import theme, { useTheme } from '../theme';

export interface AppHeaderProps {
  isConnected: boolean;
  hasTransactions?: boolean;
  onClearAll?: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isConnected,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const { theme, mode, toggleTheme } = useTheme();
  const currentLang = i18n.language?.startsWith('en') ? 'EN' : 'BR';

  return (
    <View
      style={[
        styles.topBar,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.brandContainer}>
        <View
          style={[
            styles.brandIconWrapper,
            {
              backgroundColor: theme.colors.accentBg,
              borderColor: theme.colors.borderAccent,
            },
          ]}
        >
          <Wallet size={18} color={theme.colors.accent} strokeWidth={2.5} />
        </View>
        <View>
          <AppText style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
            {t('header.title')}
          </AppText>
        </View>
      </View>

      <View style={styles.topActions}>
        <AppBadge
          label={isConnected ? t('header.tursoConnected') : t('header.tursoOffline')}
          variant={isConnected ? 'success' : 'warning'}
          statusDot
          size="sm"
        />

        <Pressable
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.iconActionBtn,
            {
              backgroundColor: theme.colors.surfaceRecessed,
              borderColor: theme.colors.borderLight,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={toggleTheme}
          accessibilityLabel={mode === 'dark' ? t('header.switchToLight') : t('header.switchToDark')}
        >
          {mode === 'dark' ? (
            <Moon size={14} color={theme.colors.accent} />
          ) : (
            <Sun size={14} color={theme.colors.accent} />
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.iconActionBtn,
            {
              backgroundColor: theme.colors.surfaceRecessed,
              borderColor: theme.colors.borderLight,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => toggleAppLanguage()}
          accessibilityLabel={t('header.switchLanguage')}
        >
          <Globe size={13} color={theme.colors.accent} />
          <AppText style={[styles.langBtnText, { color: theme.colors.accent }]}>{currentLang}</AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.iconActionBtn,
            {
              backgroundColor: theme.colors.surfaceRecessed,
              borderColor: theme.colors.borderLight,
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onLogout}
          accessibilityLabel={t('header.logout')}
        >
          <LogOut size={14} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['4xl'],
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  brandIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.base,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceRecessed,
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
    cursor: 'pointer' as any,
  },
  langBtnText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
});
