import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import theme, { useTheme } from '../../theme';

export interface AppLoadingViewProps {
  message?: string;
}

export const AppLoadingView: React.FC<AppLoadingViewProps> = ({ message }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      {message && (
        <AppText style={[styles.message, { color: theme.colors.textSecondary }]}>
          {message}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  message: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.sm,
  },
});
