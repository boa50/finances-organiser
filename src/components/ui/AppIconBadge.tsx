import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import theme from '../../theme';

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
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.colors.successBg,
          border: 'rgba(16, 185, 129, 0.25)',
        };
      case 'danger':
        return {
          bg: theme.colors.dangerBg,
          border: 'rgba(244, 63, 94, 0.25)',
        };
      case 'warning':
        return {
          bg: theme.colors.warningBg,
          border: 'rgba(245, 158, 11, 0.25)',
        };
      case 'neutral':
        return {
          bg: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.1)',
        };
      case 'accent':
      default:
        return {
          bg: theme.colors.accentBg,
          border: 'rgba(56, 189, 248, 0.25)',
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
