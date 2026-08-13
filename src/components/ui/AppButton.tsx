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
  variant?: 'primary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}) => {
  const isInteractive = !disabled && !loading;

  const getVariantStyles = () => {
    switch (variant) {
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
          },
          text: {
            color: theme.colors.white,
          },
          spinnerColor: theme.colors.white,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyles.button,
        fullWidth && styles.fullWidth,
        !isInteractive && styles.disabled,
        pressed && isInteractive && { opacity: 0.85 },
      ]}
      onPress={onPress}
      disabled={!isInteractive}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.spinnerColor} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, variantStyles.text]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});
