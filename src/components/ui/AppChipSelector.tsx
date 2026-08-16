import React, { useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import theme from '../../theme';

export interface AppChipSelectorProps<T> {
  items: T[];
  selectedId: string | number;
  onSelect: (item: T) => void;
  keyExtractor: (item: T) => string;
  labelExtractor: (item: T) => string;
  renderIcon?: (item: T, active: boolean) => React.ReactNode;
  getItemColor?: (item: T) => string;
  isSelected?: (item: T) => boolean;
}

export function AppChipSelector<T>({
  items,
  selectedId,
  onSelect,
  keyExtractor,
  labelExtractor,
  renderIcon,
  getItemColor,
  isSelected,
}: AppChipSelectorProps<T>) {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleWheel = (e: any) => {
    if (Platform.OS === 'web' && e) {
      const delta = e.deltaY || e.deltaX;
      if (delta && scrollViewRef.current) {
        const node =
          typeof scrollViewRef.current.getScrollableNode === 'function'
            ? scrollViewRef.current.getScrollableNode()
            : (scrollViewRef.current as any);
        if (node && typeof node.scrollLeft === 'number') {
          node.scrollLeft += delta;
        }
      }
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipList}
      style={styles.scrollView}
      {...(Platform.OS === 'web' ? { onWheel: handleWheel } : {})}
    >
      {items.map((item) => {
        const key = keyExtractor(item);
        const label = labelExtractor(item);
        const active = isSelected
          ? isSelected(item)
          : key === String(selectedId) || label === String(selectedId);
        const itemColor = getItemColor ? getItemColor(item) : undefined;

        let activeChipStyle = {};
        let activeTextStyle = {};

        if (active) {
          if (itemColor) {
            activeChipStyle = {
              borderColor: itemColor,
              backgroundColor: itemColor + '22',
            };
            activeTextStyle = {
              color: itemColor,
              fontWeight: theme.fontWeight.bold,
            };
          } else {
            activeChipStyle = styles.chipActiveDefault;
            activeTextStyle = styles.chipTextActiveDefault;
          }
        }

        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.chip,
              active && activeChipStyle,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => onSelect(item)}
          >
            {renderIcon && <View style={styles.iconWrapper}>{renderIcon(item, active)}</View>}
            <AppText style={[styles.chipText, active && activeTextStyle]}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export const ChipSelector = AppChipSelector;
export type ChipSelectorProps<T> = AppChipSelectorProps<T>;

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  chipList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii['4xl'],
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.xs,
  },
  chipActiveDefault: {
    backgroundColor: `${theme.colors.accent}20`,
    borderColor: theme.colors.accent,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextActiveDefault: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});
