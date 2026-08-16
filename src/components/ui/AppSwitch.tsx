import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import theme from '../../theme';

export interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
  trackActiveColor?: string;
  trackInactiveColor?: string;
  thumbColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  trackActiveColor = theme.colors.accent,
  trackInactiveColor = 'rgba(255, 255, 255, 0.16)',
  thumbColor = theme.palette.white,
  style,
}) => {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, animValue]);

  const isSmall = size === 'sm';
  const trackWidth = isSmall ? 36 : 44;
  const trackHeight = isSmall ? 20 : 24;
  const thumbSize = isSmall ? 16 : 20;
  const padding = 2;
  const travelDistance = trackWidth - thumbSize - padding * 2;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travelDistance],
  });

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [trackInactiveColor, trackActiveColor],
  });

  const borderColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.borderLight, 'rgba(56, 189, 248, 0.4)'],
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
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
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
              backgroundColor: thumbColor,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
});
