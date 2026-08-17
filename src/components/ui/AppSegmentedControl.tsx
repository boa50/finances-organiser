import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import theme from '../../theme';

export interface SegmentedControlOption<T extends string = string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
  /** Custom background color when this segment is selected */
  selectedBackgroundColor?: string;
  /** Custom border color when this segment is selected */
  selectedBorderColor?: string;
  /** Custom text color when this segment is selected */
  selectedTextColor?: string;
}

export interface AppSegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  fullWidth?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}

export function AppSegmentedControl<T extends string = string>({
  options,
  selectedValue,
  onSelect,
  fullWidth = true,
  size = 'md',
  style,
}: AppSegmentedControlProps<T>) {
  const isSm = size === 'sm';

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        const customSelectedStyle: ViewStyle = {};
        if (isSelected) {
          if (option.selectedBackgroundColor) {
            customSelectedStyle.backgroundColor = option.selectedBackgroundColor;
          }
          if (option.selectedBorderColor) {
            customSelectedStyle.borderColor = option.selectedBorderColor;
          } else if (option.selectedBackgroundColor) {
            customSelectedStyle.borderColor = 'transparent';
          }
        }

        const customSelectedTextStyle =
          isSelected && option.selectedTextColor
            ? { color: option.selectedTextColor }
            : null;

        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.tab,
              isSm && styles.tabSm,
              fullWidth && styles.flexTab,
              isSelected && styles.selectedTab,
              customSelectedStyle,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => onSelect(option.value)}
          >
            {option.icon && <View style={styles.iconContainer}>{option.icon}</View>}
            <Text
              style={[
                styles.tabText,
                isSm && styles.tabTextSm,
                isSelected && styles.selectedTabText,
                customSelectedTextStyle,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceRecessed,
    borderRadius: theme.radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  fullWidth: {
    width: '100%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.radii.pill,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabSm: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    gap: theme.spacing.xs,
  },
  flexTab: {
    flex: 1,
  },
  selectedTab: {
    backgroundColor: theme.colors.accentBgStrong,
    borderColor: theme.colors.accent,
    boxShadow: '0px 2px 8px rgba(56, 189, 248, 0.25)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.sans,
  },
  tabTextSm: {
    fontSize: theme.fontSize.xs,
  },
  selectedTabText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});

