import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard, AppText, AppSwitch, AppIconButton } from '../ui';
import { GripVertical } from 'lucide-react-native';
import theme from '../../theme';

export interface EntityManagementCardProps {
  icon?: React.ReactNode;
  name: string;
  subtitle?: string;
  color?: string;
  badge?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
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
  badge,
  onEdit,
  onDelete,
  canDelete = true,
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
            {badge}
          </View>
          {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
        </View>
      </View>

      <View style={styles.rightCol}>
        {onToggleEnabled && (
          <AppSwitch
            value={isItemEnabled}
            onValueChange={onToggleEnabled}
            size="sm"
            accessibilityLabel={isItemEnabled ? `Disable ${name}` : `Enable ${name}`}
          />
        )}
        {(onEdit || onDelete) && (
          <View style={styles.actionRow}>
            {onEdit && (
              <AppIconButton
                variant="edit"
                onPress={onEdit}
                accessibilityLabel={`Edit ${name}`}
              />
            )}
            {onDelete && (
              <AppIconButton
                variant="delete"
                onPress={onDelete}
                disabled={!canDelete}
                accessibilityLabel={`Delete ${name}`}
              />
            )}
          </View>
        )}
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
});
