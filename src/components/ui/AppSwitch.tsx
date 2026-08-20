import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import theme, { useTheme } from '../../theme';

export interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
  trackActiveColor?: string;
  trackInactiveColor?: string;
  thumbColor?: string;
  thumbActiveColor?: string;
  thumbInactiveColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  trackActiveColor,
  trackInactiveColor,
  thumbColor,
  thumbActiveColor,
  thumbInactiveColor,
  style,
}) => {
  const { theme, isDark } = useTheme();

  // Active track uses the vibrant theme accent color
  const activeColor = trackActiveColor ?? theme.colors.accent;

  // Inactive track uses a clean, well-defined surface token matching cards and recessed controls
  const inactiveColor =
    trackInactiveColor ?? theme.colors.surfaceRecessed;

  const activeBorder = theme.colors.borderAccent;
  const inactiveBorder = theme.colors.borderLight;

  // Thumb colors: pure white when active for high contrast against accent; crisp neutral when inactive
  const resolvedThumbActiveColor = thumbActiveColor ?? thumbColor ?? theme.colors.white;
  const resolvedThumbInactiveColor =
    thumbInactiveColor ?? thumbColor ?? (isDark ? theme.colors.textSecondary : theme.colors.white);

  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, animValue]);

  const isSmall = size === 'sm';
  const trackWidth = isSmall ? 38 : 46;
  const trackHeight = isSmall ? 22 : 26;
  const thumbSize = isSmall ? 18 : 22;
  const padding = 2;
  const travelDistance = trackWidth - thumbSize - padding * 2;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travelDistance],
  });

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  const borderColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBorder, activeBorder],
  });

  const currentThumbColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [resolvedThumbInactiveColor, resolvedThumbActiveColor],
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.container,
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        Platform.OS === 'web' && ({ cursor: disabled ? 'not-allowed' : 'pointer' } as any),
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: currentThumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    padding: 2,
    justifyContent: 'center',
    borderWidth: 1,
  },
  thumb: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
});
