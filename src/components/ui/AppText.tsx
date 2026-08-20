import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import theme, { useTheme } from '../../theme';

export interface AppTextProps extends RNTextProps {
  variant?: keyof typeof import('../../theme').typography;
  color?: string;
  weight?: keyof typeof import('../../theme').fontWeight;
  align?: 'left' | 'center' | 'right' | 'justify';
  tabularNums?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  weight,
  align,
  tabularNums = false,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const variantStyle = theme.typography[variant] || theme.typography.body;

  const customStyle: TextStyle = {};
  if (color) customStyle.color = color;
  if (weight) customStyle.fontWeight = theme.fontWeight[weight];
  if (align) customStyle.textAlign = align;
  if (tabularNums) customStyle.fontVariant = ['tabular-nums'];

  return (
    <RNText
      style={[
        { fontFamily: theme.fontFamily.sans, color: theme.colors.textPrimary },
        variantStyle,
        customStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.fontFamily.sans,
  },
});
