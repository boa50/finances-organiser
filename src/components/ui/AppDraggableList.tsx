import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from './AppText';
import theme from '../../theme';

export interface RenderDraggableItemInfo<T> {
  item: T;
  index: number;
  isDragging: boolean;
  dragHandleProps: any;
}

export interface AppDraggableListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (info: RenderDraggableItemInfo<T>) => React.ReactElement;
  onReorder: (newItems: T[]) => void;
  disabled?: boolean;
  disabledMessage?: string;
  ListEmptyComponent?: React.ReactElement;
  contentContainerStyle?: any;
}

interface DraggableRowProps<T> {
  item: T;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'before' | 'after' | null;
  disabled?: boolean;
  keyExtractor: (item: T) => string;
  renderItem: (info: RenderDraggableItemInfo<T>) => React.ReactElement;
  onDragStart: (index: number) => void;
  onDragMove: (gestureState: any) => void;
  onDragEnd: () => void;
  onLayout: (index: number, height: number) => void;
  translateYAnim: Animated.Value;
}

function DraggableRow<T>({
  item,
  index,
  isDragging,
  isDropTarget,
  dropPosition,
  disabled,
  renderItem,
  onDragStart,
  onDragMove,
  onDragEnd,
  onLayout,
  translateYAnim,
}: DraggableRowProps<T>) {
  const indexRef = useRef(index);
  indexRef.current = index;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onStartShouldSetPanResponderCapture: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !disabled && Math.abs(gestureState.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        !disabled && Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: () => {
        onDragStart(indexRef.current);
      },
      onPanResponderMove: (_, gestureState) => {
        onDragMove(gestureState);
      },
      onPanResponderRelease: () => {
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        onDragEnd();
      },
    })
  ).current;

  const dragHandleProps = {
    ...panResponder.panHandlers,
    ...(Platform.OS === 'web'
      ? {
          style: {
            cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
          } as any,
        }
      : {}),
  };

  return (
    <View style={styles.rowWrapper}>
      {isDropTarget && dropPosition === 'before' && <View style={styles.dropIndicator} />}

      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) {
            onLayout(indexRef.current, h);
          }
        }}
        style={[
          styles.rowContainer,
          isDragging && {
            transform: [{ translateY: translateYAnim }, { scale: 1.02 }],
            zIndex: 9999,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            opacity: 0.95,
          },
        ]}
      >
        {renderItem({
          item,
          index,
          isDragging,
          dragHandleProps,
        })}
      </Animated.View>

      {isDropTarget && dropPosition === 'after' && <View style={styles.dropIndicator} />}
    </View>
  );
}

export function AppDraggableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  disabled = false,
  disabledMessage,
  ListEmptyComponent,
  contentContainerStyle,
}: AppDraggableListProps<T>) {
  const [items, setItems] = useState<T[]>(data);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const rowHeights = useRef<{ [index: number]: number }>({});
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const draggingIndexRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const itemsRef = useRef<T[]>(data);

  useEffect(() => {
    setItems(data);
    itemsRef.current = data;
  }, [data]);

  const handleRowLayout = useCallback((index: number, height: number) => {
    rowHeights.current[index] = height;
  }, []);

  const handleDragStart = useCallback(
    (index: number) => {
      draggingIndexRef.current = index;
      targetIndexRef.current = index;
      setDraggingIndex(index);
      setTargetIndex(index);
      translateYAnim.setValue(0);
    },
    [translateYAnim]
  );

  const handleDragMove = useCallback(
    (gestureState: any) => {
      if (draggingIndexRef.current === null) return;
      translateYAnim.setValue(gestureState.dy);

      const fromIndex = draggingIndexRef.current;
      const currentList = itemsRef.current;
      if (currentList.length <= 1) return;

      const dy = gestureState.dy;
      let computedTarget = fromIndex;

      if (dy > 0) {
        let accumulated = 0;
        for (let i = fromIndex + 1; i < currentList.length; i++) {
          const h = rowHeights.current[i] || 64;
          if (dy > accumulated + h * 0.4) {
            computedTarget = i;
            accumulated += h;
          } else {
            break;
          }
        }
      } else if (dy < 0) {
        let accumulated = 0;
        for (let i = fromIndex - 1; i >= 0; i--) {
          const h = rowHeights.current[i] || 64;
          if (-dy > accumulated + h * 0.4) {
            computedTarget = i;
            accumulated += h;
          } else {
            break;
          }
        }
      }

      computedTarget = Math.max(0, Math.min(computedTarget, currentList.length - 1));

      if (computedTarget !== targetIndexRef.current) {
        targetIndexRef.current = computedTarget;
        setTargetIndex(computedTarget);
      }
    },
    [translateYAnim]
  );

  const handleDragEnd = useCallback(() => {
    const from = draggingIndexRef.current;
    const to = targetIndexRef.current;

    draggingIndexRef.current = null;
    targetIndexRef.current = null;
    setDraggingIndex(null);
    setTargetIndex(null);
    translateYAnim.setValue(0);

    if (from !== null && to !== null && from !== to) {
      const updated = [...itemsRef.current];
      const [removed] = updated.splice(from, 1);
      updated.splice(to, 0, removed);
      setItems(updated);
      itemsRef.current = updated;
      onReorder(updated);
    }
  }, [onReorder, translateYAnim]);

  if (items.length === 0 && ListEmptyComponent) {
    return ListEmptyComponent;
  }

  return (
    <View style={[styles.container, contentContainerStyle]}>
      {disabled && disabledMessage ? (
        <View style={styles.disabledHintBanner}>
          <AppText style={styles.disabledHintText}>{disabledMessage}</AppText>
        </View>
      ) : null}

      {items.map((item, index) => {
        const itemKey = keyExtractor(item);
        const isDragging = draggingIndex === index;
        const isDropTarget = targetIndex === index && draggingIndex !== null && draggingIndex !== index;
        const dropPosition =
          isDropTarget && draggingIndex !== null
            ? draggingIndex < index
              ? 'after'
              : 'before'
            : null;

        return (
          <DraggableRow<T>
            key={itemKey}
            item={item}
            index={index}
            isDragging={isDragging}
            isDropTarget={isDropTarget}
            dropPosition={dropPosition}
            disabled={disabled}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onLayout={handleRowLayout}
            translateYAnim={translateYAnim}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowWrapper: {
    width: '100%',
  },
  rowContainer: {
    width: '100%',
  },
  dropIndicator: {
    height: 3,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.sm,
    marginVertical: theme.spacing.xxs,
    width: '100%',
  },
  disabledHintBanner: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
  },
  disabledHintText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
