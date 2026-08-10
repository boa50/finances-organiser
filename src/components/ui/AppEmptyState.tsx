import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import theme from '../../theme';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';

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
    <AppCard style={[styles.card, style]} variant="outlined" padding="6xl">
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionTitle && onActionPress ? (
        <View style={styles.actionContainer}>
          <AppButton
            title={actionTitle}
            onPress={onActionPress}
            variant="ghost"
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
    gap: theme.spacing.sm,
  },
  iconContainer: {
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textTertiary,
    fontSize: theme.fontSize.base,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: theme.spacing.md,
  },
});
