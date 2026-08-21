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
import { AppText } from './AppText';
import theme, { useTheme } from '../../theme';

export interface AppTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  error?: boolean | string;
  errorText?: string;
  helperText?: string;
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  keyboardType?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  textAlign?: 'left' | 'center' | 'right';
  selectTextOnFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: ReturnKeyTypeOptions;
  accessibilityLabel?: string;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoFocus = false,
  editable = true,
  error = false,
  errorText,
  helperText,
  label,
  icon,
  rightElement,
  size = 'md',
  keyboardType = 'default',
  style,
  containerStyle,
  inputStyle,
  multiline = false,
  numberOfLines,
  maxLength,
  textAlign = 'left',
  selectTextOnFocus = false,
  autoCapitalize = 'none',
  autoCorrect = false,
  onSubmitEditing,
  returnKeyType = 'done',
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const isError = Boolean(error || errorText);
  const errorMessage = typeof error === 'string' ? error : errorText;

  const getBorderColor = () => {
    if (isError) return theme.colors.danger;
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

  const inputNode = (
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
        isFocused && [
          styles.containerFocused,
          {
            borderColor: theme.colors.accent,
            boxShadow: `0px 0px 8px ${theme.colors.borderGlow}`,
          },
        ],
        isError && [
          styles.containerError,
          {
            borderColor: theme.colors.danger,
            boxShadow: '0px 0px 8px rgba(244, 63, 94, 0.3)',
          },
        ],
        multiline && styles.containerMultiline,
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
            textAlign,
          },
          size === 'sm' && styles.inputSm,
          size === 'lg' && styles.inputLg,
          multiline && styles.inputMultiline,
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
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        selectTextOnFocus={selectTextOnFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        accessibilityLabel={accessibilityLabel || label || placeholder}
      />
      {rightElement && <View style={styles.rightElementContainer}>{rightElement}</View>}
    </View>
  );

  if (!label && !errorMessage && !helperText) {
    return inputNode;
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <AppText style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </AppText>
      )}
      {inputNode}
      {errorMessage ? (
        <AppText style={[styles.messageText, { color: theme.colors.danger }]}>
          {errorMessage}
        </AppText>
      ) : helperText ? (
        <AppText style={[styles.messageText, { color: theme.colors.textTertiary }]}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radii.input,
  },
  containerFocused: {
    borderWidth: 1,
  },
  containerError: {
    borderWidth: 1,
  },
  containerMultiline: {
    alignItems: 'flex-start',
    minHeight: 80,
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
  inputMultiline: {
    paddingTop: theme.spacing.xxs,
    textAlignVertical: 'top',
  },
  inputSm: {
    fontSize: theme.fontSize.base,
  },
  inputLg: {
    fontSize: theme.fontSize.xl,
  },
});
