import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppCard, AppBadge, AppText } from './ui';
import { Pencil, Trash2 } from 'lucide-react-native';
import theme from '../theme';

export interface EntityManagementCardProps {
  icon?: React.ReactNode;
  name: string;
  subtitle?: string;
  isDefault?: boolean;
  color?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const EntityManagementCard: React.FC<EntityManagementCardProps> = ({
  icon,
  name,
  subtitle,
  isDefault,
  color,
  onEdit,
  onDelete,
}) => {
  const badgeBg = color ? `${color}25` : `${theme.colors.accent}25`;

  return (
    <AppCard style={styles.card} padding="lg">
      <View style={styles.leftCol}>
        {icon && <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>{icon}</View>}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <AppText style={styles.name}>{name}</AppText>
            {isDefault && <AppBadge label="Default" variant="accent" size="sm" />}
          </View>
          {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit} accessibilityLabel={`Edit ${name}`}>
          <Pencil size={14} color={theme.colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDelete} accessibilityLabel={`Delete ${name}`}>
          <Trash2 size={14} color={theme.colors.danger} />
        </TouchableOpacity>
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
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
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
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
    textTransform: 'capitalize',
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
