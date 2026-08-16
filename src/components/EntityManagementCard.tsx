import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppCard, AppText, AppSwitch } from './ui';
import { GripVertical, Pencil, Trash2 } from 'lucide-react-native';
import theme from '../theme';

export interface EntityManagementCardProps {
  icon?: React.ReactNode;
  name: string;
  subtitle?: string;
  color?: string;
  onEdit: () => void;
  onDelete: () => void;
  isDraggable?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
  enabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
}

export const EntityManagementCard: React.FC<EntityManagementCardProps> = ({
  icon,
  name,
  subtitle,
  color,
  onEdit,
  onDelete,
  isDraggable = false,
  dragHandleProps,
  isDragging = false,
  enabled = true,
  onToggleEnabled,
}) => {
  const badgeBg = color ? `${color}25` : `${theme.colors.accent}25`;
  const isItemEnabled = enabled !== false;

  return (
    <AppCard
      style={[
        styles.card,
        isDragging && styles.cardDragging,
        !isItemEnabled && styles.cardDisabled,
      ]}
      padding="lg"
    >
      <View style={styles.leftCol}>
        {(isDraggable || dragHandleProps) && (
          <View
            {...dragHandleProps}
            style={[
              styles.dragHandle,
              dragHandleProps?.style,
              isDragging && styles.dragHandleActive,
            ]}
            accessibilityLabel={`Reorder ${name}`}
            accessibilityRole="button"
          >
            <GripVertical
              size={18}
              color={isDragging ? theme.colors.accent : theme.colors.textMuted}
            />
          </View>
        )}
        {icon && <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>{icon}</View>}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <AppText style={[styles.name, !isItemEnabled && styles.nameDisabled]}>{name}</AppText>
          </View>
          {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
        </View>
      </View>

      <View style={styles.rightCol}>
        {onToggleEnabled && (
          <AppSwitch
            value={isItemEnabled}
            onValueChange={onToggleEnabled}
            accessibilityLabel={isItemEnabled ? `Disable ${name}` : `Enable ${name}`}
            style={styles.switch}
          />
        )}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
            onPress={onEdit}
            accessibilityLabel={`Edit ${name}`}
          >
            <Pencil size={14} color={theme.colors.accent} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
            onPress={onDelete}
            accessibilityLabel={`Delete ${name}`}
          >
            <Trash2 size={14} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardDragging: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceHighlight,
  },
  cardDisabled: {
    opacity: 0.65,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  dragHandle: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  dragHandleActive: {
    backgroundColor: `${theme.colors.accent}15`,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  nameDisabled: {
    color: theme.colors.textSecondary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
    textTransform: 'capitalize',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background,
  },
});
