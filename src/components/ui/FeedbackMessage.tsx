import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import { AppText } from './AppText';
import theme, { useTheme } from '../../theme';

export interface FeedbackMessageProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  visible?: boolean;
}

export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  message,
  type = 'error',
  visible = true,
}) => {
  const { theme } = useTheme();

  if (!visible || !message) {
    return null;
  }

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.successBg,
          textColor: theme.colors.success,
          IconComponent: CheckCircle,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.accentBg,
          textColor: theme.colors.accent,
          IconComponent: Info,
        };
      case 'error':
      default:
        return {
          backgroundColor: theme.colors.dangerBg,
          textColor: theme.colors.danger,
          IconComponent: AlertCircle,
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.IconComponent;

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <IconComponent size={16} color={config.textColor} />
      <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.base,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  text: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
});
