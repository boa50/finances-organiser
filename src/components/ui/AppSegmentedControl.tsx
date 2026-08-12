import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  style?: StyleProp<ViewStyle>;
}

export function AppSegmentedControl<T extends string = string>({
  options,
  selectedValue,
  onSelect,
  fullWidth = true,
  style,
}: AppSegmentedControlProps<T>) {
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
          <TouchableOpacity
            key={option.value}
            style={[
              styles.tab,
              fullWidth && styles.flexTab,
              isSelected && styles.selectedTab,
              customSelectedStyle,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.8}
          >
            {option.icon && <View style={styles.iconContainer}>{option.icon}</View>}
            <Text
              style={[
                styles.tabText,
                isSelected && styles.selectedTabText,
                customSelectedTextStyle,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xxs,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    borderRadius: theme.radii.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  flexTab: {
    flex: 1,
  },
  selectedTab: {
    backgroundColor: theme.colors.accentBg,
    borderColor: theme.colors.accent,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  selectedTabText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});

