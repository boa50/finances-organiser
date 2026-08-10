import React from 'react';
import {
  Activity,
  Book,
  Briefcase,
  Building2,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Gift,
  Heart,
  Home,
  Key,
  Laptop,
  MoreHorizontal,
  Plane,
  Repeat,
  Shield,
  ShoppingBag,
  TrendingUp,
  Tv,
  Utensils,
  Zap,
} from 'lucide-react-native';

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
  switch (iconName) {
    case 'utensils':
      return <Utensils size={size} color={color} />;
    case 'home':
      return <Home size={size} color={color} />;
    case 'car':
      return <Car size={size} color={color} />;
    case 'zap':
      return <Zap size={size} color={color} />;
    case 'tv':
      return <Tv size={size} color={color} />;
    case 'shopping-bag':
      return <ShoppingBag size={size} color={color} />;
    case 'activity':
      return <Activity size={size} color={color} />;
    case 'book':
      return <Book size={size} color={color} />;
    case 'plane':
      return <Plane size={size} color={color} />;
    case 'repeat':
      return <Repeat size={size} color={color} />;
    case 'briefcase':
      return <Briefcase size={size} color={color} />;
    case 'laptop':
      return <Laptop size={size} color={color} />;
    case 'trending-up':
      return <TrendingUp size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    case 'key':
      return <Key size={size} color={color} />;
    case 'coffee':
      return <Coffee size={size} color={color} />;
    case 'dumbbell':
      return <Dumbbell size={size} color={color} />;
    case 'shield':
      return <Shield size={size} color={color} />;
    case 'heart':
      return <Heart size={size} color={color} />;
    case 'credit-card':
      return <CreditCard size={size} color={color} />;
    case 'building':
      return <Building2 size={size} color={color} />;
    default:
      return <MoreHorizontal size={size} color={color} />;
  }
};
