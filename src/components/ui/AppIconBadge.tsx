import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import theme, { useTheme } from '../../theme';

export interface AppIconBadgeProps {
  icon: React.ReactNode;
  variant?: 'success' | 'danger' | 'accent' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg'; // 32px, 40px, 48px
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppIconBadge: React.FC<AppIconBadgeProps> = ({
  icon,
  variant = 'accent',
  size = 'md',
  rounded = false,
  style,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.colors.successBg,
          border: theme.colors.successBgStrong,
        };
      case 'danger':
        return {
          bg: theme.colors.dangerBg,
          border: theme.colors.dangerBgStrong,
        };
      case 'warning':
        return {
          bg: theme.colors.warningBg,
          border: theme.colors.warningLight,
        };
      case 'neutral':
        return {
          bg: theme.colors.surfaceMuted,
          border: theme.colors.borderLight,
        };
      case 'accent':
      default:
        return {
          bg: theme.colors.accentBg,
          border: theme.colors.borderAccent,
        };
    }
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 48;
      case 'md':
      default:
        return 40;
    }
  };

  const variantStyles = getVariantStyles();
  const dimension = getDimensions();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: rounded ? dimension / 2 : theme.radii.lg,
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
        },
        style,
      ]}
    >
      {icon}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
