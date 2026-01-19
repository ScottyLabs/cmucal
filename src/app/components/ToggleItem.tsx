"use client";

interface ToggleItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: 'red' | 'green' | 'purple' | 'blue' | 'orange';
}

const ToggleItem: React.FC<ToggleItemProps> = ({ label, checked, onChange, color = 'green' }) => {
  const colorClasses = {
    red: `
      border-[rgba(242,109,109,0.4)]
      checked:border-[rgba(242,109,109,1)]
      checked:bg-[rgba(242,109,109,1)]
    `,
    green: `
      border-[rgba(88,192,92,0.4)]
      checked:border-[rgba(88,192,92,1)]
      checked:bg-[rgba(88,192,92,1)]
    `,
    purple: `
      border-[rgba(195,109,242,0.4)]
      checked:border-[rgba(195,109,242,1)]
      checked:bg-[rgba(195,109,242,1)]
    `,
    blue: `
      border-[rgba(109,164,242,0.4)]
      checked:border-[rgba(109,164,242,1)]
      checked:bg-[rgba(109,164,242,1)]
    `,
    orange: `
      border-[rgba(242,176,109,0.4)]
      checked:border-[rgba(242,176,109,1)]
      checked:bg-[rgba(242,176,109,1)]
    `,
  };

  return (
    <label className="flex items-center py-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`
          appearance-none
          w-[18px] h-[18px]
          rounded
          border-2
          bg-white
          transition-colors
          focus:ring-0
          cursor-pointer
          ${colorClasses[color]}
        `}
      />
      <span className="ml-3 text-[15px] text-gray-900 dark:text-gray-100">{label}</span>
    </label>
  );
};

export default ToggleItem;