import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import theme from '../../theme';

export interface AppSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppSectionHeader: React.FC<AppSectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  rightElement,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightElement ? (
        rightElement
      ) : actionLabel && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  actionText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
