import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
  ReturnKeyTypeOptions,
} from 'react-native';
import theme, { useTheme } from '../../theme';

export interface AppTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  keyboardType?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
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
  rightElement,
  size = 'md',
  keyboardType = 'default',
  style,
  inputStyle,
  onSubmitEditing,
  returnKeyType = 'done',
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.colors.danger;
    if (isFocused) return theme.colors.accent;
    return theme.colors.borderLight;
  };

  const getContainerPadding = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing['2xl'],
          paddingHorizontal: theme.spacing['3xl'],
        };
      case 'md':
      default:
        return {
          paddingVertical: theme.spacing.xl,
          paddingHorizontal: theme.spacing['2xl'],
        };
    }
  };

  return (
    <View
      style={[
        styles.container,
        getContainerPadding(),
        {
          borderColor: getBorderColor(),
          opacity: editable ? 1 : 0.6,
          backgroundColor: isFocused
            ? theme.colors.surfaceHighlight
            : theme.colors.surfaceRecessed,
        },
        isFocused && [styles.containerFocused, { borderColor: theme.colors.accent, boxShadow: `0px 0px 8px ${theme.colors.borderGlow}` }],
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.sans,
          },
          size === 'sm' && styles.inputSm,
          size === 'lg' && styles.inputLg,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus}
        editable={editable}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {rightElement && <View style={styles.rightElementContainer}>{rightElement}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radii.input,
  },
  containerFocused: {
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElementContainer: {
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.sans,
    padding: 0, // Reset default padding for clean cross-platform alignment
  },
  inputSm: {
    fontSize: theme.fontSize.base,
  },
  inputLg: {
    fontSize: theme.fontSize.xl,
  },
});
