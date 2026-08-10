import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import theme from '../../theme';

export interface AppTextProps extends RNTextProps {
  variant?: keyof typeof theme.typography;
  color?: string;
  weight?: keyof typeof theme.fontWeight;
  align?: 'left' | 'center' | 'right' | 'justify';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  ...rest
}) => {
  const variantStyle = theme.typography[variant] || theme.typography.body;

  const customStyle: TextStyle = {};
  if (color) customStyle.color = color;
  if (weight) customStyle.fontWeight = theme.fontWeight[weight];
  if (align) customStyle.textAlign = align;

  return (
    <RNText style={[styles.base, variantStyle, customStyle, style]} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.fontFamily.sans,
  },
});
