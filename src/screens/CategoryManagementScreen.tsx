import React from 'react';
import { ManagementScreen } from './ManagementScreen';

interface CategoryManagementScreenProps {
  onCategoriesUpdated?: () => void;
}

export const CategoryManagementScreen: React.FC<CategoryManagementScreenProps> = (props) => {
  return <ManagementScreen {...props} initialSection="categories" />;
};

export default CategoryManagementScreen;
