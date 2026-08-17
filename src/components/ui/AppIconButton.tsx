import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Copy, Pencil, Trash2 } from 'lucide-react-native';
import theme from '../../theme';

export type AppIconButtonVariant = 'edit' | 'delete' | 'duplicate' | 'custom';

export type AppIconButtonSize = 'sm' | 'md' | 'lg';

export interface AppIconButtonProps {
  onPress: () => void;
  variant?: AppIconButtonVariant;
  icon?: React.ReactNode;
  size?: AppIconButtonSize;
  iconSize?: number;
  iconColor?: string;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Standardized icon action button matching the design across all list item cards
 * (e.g., Transactions, Subscriptions, Management entities, and Currencies).
 */
export const AppIconButton: React.FC<AppIconButtonProps> = ({
  onPress,
  variant = 'edit',
  icon,
  size = 'md',
  iconSize,
  iconColor,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const resolvedIconSize =
    iconSize !== undefined
      ? iconSize
      : size === 'sm'
        ? 11
        : size === 'lg'
          ? 16
          : 13;

  const getResolvedColor = () => {
    if (disabled) {
      return theme.colors.textMuted;
    }
    if (iconColor) {
      return iconColor;
    }
    switch (variant) {
      case 'delete':
        return theme.colors.danger;
      case 'edit':
      case 'duplicate':
        return theme.colors.accent;
      case 'custom':
      default:
        return theme.colors.textSecondary;
    }
  };

  const resolvedColor = getResolvedColor();

  const renderIcon = () => {
    if (icon) {
      return icon;
    }
    switch (variant) {
      case 'edit':
        return <Pencil size={resolvedIconSize} color={resolvedColor} />;
      case 'delete':
        return <Trash2 size={resolvedIconSize} color={resolvedColor} />;
      case 'duplicate':
        return <Copy size={resolvedIconSize} color={resolvedColor} />;
      default:
        return null;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        getSizeStyle(),
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {renderIcon()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceRecessed,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSm: {
    padding: 4,
  },
  sizeMd: {
    padding: 5,
  },
  sizeLg: {
    padding: 7,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
});
