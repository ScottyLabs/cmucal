export interface ToggleItemProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export interface AccordionProps {
  title: string;
  subtitle?: string;
  color?: string;
  children: React.ReactNode;
  badge?: string;
}
