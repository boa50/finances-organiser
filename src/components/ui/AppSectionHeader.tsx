import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import theme, { useTheme } from '../../theme';

export interface AppSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppSectionHeader: React.FC<AppSectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  rightElement,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textColumn}>
        <AppText style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</AppText>
        {subtitle ? (
          <AppText style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</AppText>
        ) : null}
      </View>

      {rightElement ? (
        rightElement
      ) : actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <AppText style={[styles.actionText, { color: theme.colors.accent }]}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.extrabold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  actionText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
});
