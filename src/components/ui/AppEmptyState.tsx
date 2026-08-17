import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import theme from '../../theme';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { AppText } from './AppText';

export interface AppEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onActionPress,
  style,
}) => {
  return (
    <AppCard style={[styles.card, style]} variant="glass" padding="6xl">
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <AppText style={styles.title}>{title}</AppText>
      {description ? <AppText style={styles.description}>{description}</AppText> : null}
      {actionTitle && onActionPress ? (
        <View style={styles.actionContainer}>
          <AppButton
            title={actionTitle}
            onPress={onActionPress}
            variant="ghost"
            size="sm"
            fullWidth={false}
          />
        </View>
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['6xl'],
    gap: theme.spacing.xs,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: theme.spacing.md,
  },
});
