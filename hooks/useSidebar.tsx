import { useSidebar as useContext } from '@/contexts/LayoutContext';

export const useSidebar = () => {
  return useContext();
};