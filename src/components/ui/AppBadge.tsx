import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import theme from '../../theme';

export interface AppBadgeProps {
  label: string;
  icon?: React.ReactNode;
  statusDot?: boolean;
  variant?: 'success' | 'danger' | 'warning' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  icon,
  statusDot = false,
  variant = 'accent',
  size = 'md',
  onPress,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.colors.successBg,
          border: theme.colors.success,
          text: theme.colors.success,
          dot: theme.colors.success,
        };
      case 'danger':
        return {
          bg: theme.colors.dangerBg,
          border: theme.colors.danger,
          text: theme.colors.danger,
          dot: theme.colors.danger,
        };
      case 'warning':
        return {
          bg: theme.colors.warningBg,
          border: theme.colors.warning,
          text: theme.colors.warning,
          dot: theme.colors.warning,
        };
      case 'neutral':
        return {
          bg: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.12)',
          text: theme.colors.textSecondary,
          dot: theme.colors.textSecondary,
        };
      case 'accent':
      default:
        return {
          bg: theme.colors.accentBg,
          border: theme.colors.accent,
          text: theme.colors.accent,
          dot: theme.colors.accent,
        };
    }
  };

  const colors = getColors();
  const isSm = size === 'sm';

  const badgeStyle: StyleProp<ViewStyle> = [
    styles.badge,
    {
      backgroundColor: colors.bg,
      borderColor: colors.border,
      paddingHorizontal: isSm ? 8 : 10,
      paddingVertical: isSm ? 3 : 5,
    },
    style,
  ];

  const content = (
    <>
      {statusDot && <View style={[styles.dot, { backgroundColor: colors.dot }]} />}
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <Text style={[styles.text, { color: colors.text, fontSize: isSm ? 10 : theme.fontSize.xs }]}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [badgeStyle, pressed && { opacity: 0.8 }]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={badgeStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: theme.fontWeight.bold,
  },
});
