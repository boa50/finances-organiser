import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';
import { useToast } from '../../contexts';
import { AppText } from './AppText';
import theme, { useTheme } from '../../theme';

export const GlobalToast: React.FC = () => {
  const { activeToast, dismissToast } = useToast();
  const { theme } = useTheme();

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeToast) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [activeToast, translateY, opacity]);

  if (!activeToast) {
    return null;
  }

  const getConfig = () => {
    switch (activeToast.type) {
      case 'loading':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderAccent,
          iconColor: theme.colors.accent,
          icon: <ActivityIndicator size="small" color={theme.colors.accent} />,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.success,
          iconColor: theme.colors.success,
          icon: <CheckCircle size={18} color={theme.colors.success} />,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.danger,
          iconColor: theme.colors.danger,
          icon: <AlertCircle size={18} color={theme.colors.danger} />,
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderAccent,
          iconColor: theme.colors.accent,
          icon: <Info size={18} color={theme.colors.accent} />,
        };
    }
  };

  const config = getConfig();

  return (
    <View style={styles.positionWrapper} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toastCard,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
            boxShadow: theme.colors.cardShadow,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.iconContainer}>{config.icon}</View>

        <AppText
          style={[styles.message, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {activeToast.message}
        </AppText>

        {activeToast.type !== 'loading' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss toast"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.6 }]}
            onPress={() => dismissToast(activeToast.id)}
          >
            <X size={15} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  positionWrapper: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    maxWidth: 540,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  message: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  dismissBtn: {
    padding: theme.spacing.xxs,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
