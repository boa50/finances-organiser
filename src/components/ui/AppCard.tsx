import React from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import theme, { useTheme } from '../../theme';

export interface AppCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'hero' | 'recessed';
  padding?: keyof typeof import('../../theme').spacing;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'default',
  padding = '4xl',
  style,
  onPress,
}) => {
  const { theme } = useTheme();
  const paddingValue = theme.spacing[padding] ?? theme.spacing['4xl'];

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'hero':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderAccent,
          boxShadow: theme.colors.heroShadow,
          elevation: 8,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderLight,
          boxShadow: theme.colors.cardShadow,
          elevation: 6,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
        };
      case 'glass':
        return {
          backgroundColor: theme.colors.surfaceGlass,
          borderColor: theme.colors.borderLight,
          boxShadow: theme.colors.cardShadow,
          elevation: 5,
        };
      case 'recessed':
        return {
          backgroundColor: theme.colors.surfaceRecessed,
          borderColor: theme.colors.borderSubtle,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        };
    }
  };

  const combinedStyles: StyleProp<ViewStyle> = [
    styles.card,
    getVariantStyle(),
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          combinedStyles,
          pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={combinedStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.card,
    borderWidth: 1,
  },
});
