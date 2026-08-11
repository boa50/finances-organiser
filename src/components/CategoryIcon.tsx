import React from 'react';
import { ICON_MAP, DEFAULT_ICON } from '../data/iconMap';

export interface CategoryIconProps {
  iconName: string;
  color: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  color,
  size = 20,
}) => {
  const IconComponent = ICON_MAP[iconName] || DEFAULT_ICON;
  return <IconComponent size={size} color={color} />;
};
