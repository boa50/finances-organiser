import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import theme from '../../theme';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
  textStyle?: any;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const isInteractive = !disabled && !loading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.borderLight,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.textPrimary,
          },
          spinnerColor: theme.colors.textPrimary,
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.borderLight,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.textLight,
          },
          spinnerColor: theme.colors.textLight,
        };
      case 'success':
        return {
          button: {
            backgroundColor: theme.colors.success,
            borderColor: 'transparent',
            borderWidth: 0,
            boxShadow: '0px 4px 14px rgba(16, 185, 129, 0.3)',
          },
          text: {
            color: theme.colors.white,
          },
          spinnerColor: theme.colors.white,
        };
      case 'danger':
        return {
          button: {
            backgroundColor: theme.colors.dangerBg,
            borderColor: theme.colors.danger,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.danger,
          },
          spinnerColor: theme.colors.danger,
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.accent,
          },
          spinnerColor: theme.colors.accent,
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: theme.colors.accent,
            borderColor: 'transparent',
            borderWidth: 0,
            boxShadow: '0px 4px 14px rgba(56, 189, 248, 0.3)',
          },
          text: {
            color: theme.colors.white,
          },
          spinnerColor: theme.colors.white,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radii.base,
          },
          text: {
            fontSize: theme.fontSize.sm,
          },
        };
      case 'lg':
        return {
          button: {
            paddingHorizontal: theme.spacing['4xl'],
            paddingVertical: theme.spacing['2xl'],
            borderRadius: theme.radii.button,
          },
          text: {
            fontSize: theme.fontSize.xl,
          },
        };
      case 'md':
      default:
        return {
          button: {
            paddingHorizontal: theme.spacing['2xl'],
            paddingVertical: theme.spacing.xl,
            borderRadius: theme.radii.button,
          },
          text: {
            fontSize: theme.fontSize.lg,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        sizeStyles.button,
        variantStyles.button,
        fullWidth && styles.fullWidth,
        !isInteractive && styles.disabled,
        pressed && isInteractive && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
      onPress={onPress}
      disabled={!isInteractive}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.spinnerColor} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.sans,
  },
});
