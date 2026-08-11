import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native';
import { AppText } from './ui/AppText';
import theme from '../theme';

export interface ChipSelectorProps<T> {
  items: T[];
  selectedId: string | number;
  onSelect: (item: T) => void;
  keyExtractor: (item: T) => string;
  labelExtractor: (item: T) => string;
  renderIcon?: (item: T) => React.ReactNode;
}

export function ChipSelector<T>({
  items,
  selectedId,
  onSelect,
  keyExtractor,
  labelExtractor,
  renderIcon,
}: ChipSelectorProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
      {items.map((item) => {
        const key = keyExtractor(item);
        const active = key === String(selectedId);
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(item)}
          >
            {renderIcon && <View>{renderIcon(item)}</View>}
            <AppText style={[styles.chipText, active && styles.chipTextActive]}>
              {labelExtractor(item)}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipList: {
    gap: 7,
    paddingVertical: theme.spacing.xxs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii['3xl'],
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  chipActive: {
    backgroundColor: theme.colors.accentDark,
    borderColor: theme.colors.accent,
  },
  chipText: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  chipTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
  },
});
