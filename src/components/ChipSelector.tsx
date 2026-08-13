import React, { useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from './ui/AppText';
import theme from '../theme';

export interface ChipSelectorProps<T> {
  items: T[];
  selectedId: string | number;
  onSelect: (item: T) => void;
  keyExtractor: (item: T) => string;
  labelExtractor: (item: T) => string;
  renderIcon?: (item: T, active: boolean) => React.ReactNode;
  getItemColor?: (item: T) => string;
  isSelected?: (item: T) => boolean;
}

export function ChipSelector<T>({
  items,
  selectedId,
  onSelect,
  keyExtractor,
  labelExtractor,
  renderIcon,
  getItemColor,
  isSelected,
}: ChipSelectorProps<T>) {
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

const styles = StyleSheet.create({
  scrollView: {
    marginVertical: theme.spacing.xs,
    ...(Platform.OS === 'web'
      ? ({
          maxWidth: '100%',
          overflowX: 'auto',
          touchAction: 'pan-x',
        } as any)
      : {}),
  },
  chipList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
    flexGrow: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: 'transparent',
    gap: 4,
    flexShrink: 0,
  },
  chipActiveDefault: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentBg,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextActiveDefault: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
});
