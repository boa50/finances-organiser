import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import theme from '../../theme';

export interface AppCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
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
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderStrong,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 6,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
        };
      case 'glass':
        return {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.borderLight,
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
      <TouchableOpacity style={combinedStyles} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={combinedStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii['2xl'],
    borderWidth: 1,
  },
});
