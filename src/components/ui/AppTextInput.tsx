import React, { useState } from 'react';
import { StyleSheet, TextInput, View, ReturnKeyTypeOptions } from 'react-native';
import theme from '../../theme';

export interface AppTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  onSubmitEditing?: () => void;
  returnKeyType?: ReturnKeyTypeOptions;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoFocus = false,
  editable = true,
  error = false,
  icon,
  onSubmitEditing,
  returnKeyType = 'done',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.colors.danger;
    if (isFocused) return theme.colors.accent;
    return theme.colors.border;
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: getBorderColor(),
          opacity: editable ? 1 : 0.6,
        },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    padding: 0, // Reset default padding for clean cross-platform alignment
  },
});
