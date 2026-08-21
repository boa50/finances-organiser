import React, { useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import theme, { useTheme } from '../../theme';

export interface AppChipSelectorProps<T> {
  items: T[];
  selectedId: string | number;
  onSelect: (item: T) => void;
  keyExtractor: (item: T) => string;
  labelExtractor: (item: T) => string;
  renderIcon?: (item: T, active: boolean) => React.ReactNode;
  getItemColor?: (item: T) => string;
  isSelected?: (item: T) => boolean;
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
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
  wrap = false,
  style,
  contentContainerStyle,
}: AppChipSelectorProps<T>) {
  const { theme } = useTheme();
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

  const renderChipList = () =>
    items.map((item) => {
      const key = keyExtractor(item);
      const label = labelExtractor(item);
      const active = isSelected
        ? isSelected(item)
        : key === String(selectedId) || label === String(selectedId);
      const itemColor = getItemColor ? getItemColor(item) : undefined;

      let activeChipStyle: any = {};
      let activeTextStyle: any = {};

      if (active) {
        if (itemColor) {
          activeChipStyle = {
            borderColor: itemColor,
            backgroundColor: `${itemColor}25`,
          };
          activeTextStyle = {
            color: itemColor,
            fontWeight: theme.fontWeight.bold,
          };
        } else {
          activeChipStyle = {
            backgroundColor: theme.colors.accentBgStrong,
            borderColor: theme.colors.accent,
          };
          activeTextStyle = {
            color: theme.colors.accent,
            fontWeight: theme.fontWeight.bold,
          };
        }
      }

      return (
        <Pressable
          key={key}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: theme.colors.surfaceRecessed,
              borderColor: theme.colors.borderSubtle,
            },
            active && activeChipStyle,
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => onSelect(item)}
        >
          {renderIcon && <View style={styles.iconWrapper}>{renderIcon(item, active)}</View>}
          <AppText
            style={[
              styles.chipText,
              { color: theme.colors.textSecondary },
              active && activeTextStyle,
            ]}
          >
            {label}
          </AppText>
        </Pressable>
      );
    });

  if (wrap) {
    return (
      <View style={[styles.wrapContainer, contentContainerStyle, style]}>
        {renderChipList()}
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipList, contentContainerStyle]}
      style={[styles.scrollView, style]}
      {...(Platform.OS === 'web' ? { onWheel: handleWheel } : {})}
    >
      {renderChipList()}
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
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceRecessed,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.xs,
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
});
