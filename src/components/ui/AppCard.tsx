import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import theme from '../../theme';

export interface AppCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'hero' | 'recessed';
  padding?: keyof typeof theme.spacing;
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
  const paddingValue = theme.spacing[padding] ?? theme.spacing['4xl'];

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'hero':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderAccent,
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.35)',
          elevation: 8,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderLight,
          boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.28)',
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
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
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
