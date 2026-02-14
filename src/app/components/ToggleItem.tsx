"use client";

import { FaRegSquare, FaSquareCheck } from "react-icons/fa6";

interface ToggleItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: 'red' | 'green' | 'purple' | 'blue' | 'orange';
}

const ToggleItem: React.FC<ToggleItemProps> = ({ label, checked, onChange, color = 'green' }) => {
  const colorClasses = {
    red: {
      unchecked: 'text-[rgba(242,109,109,0.4)]',
      checked: 'text-[rgba(242,109,109,1)]',
    },
    green: {
      unchecked: 'text-[rgba(88,192,92,0.4)]',
      checked: 'text-[rgba(88,192,92,1)]',
    },
    purple: {
      unchecked: 'text-[rgba(195,109,242,0.4)]',
      checked: 'text-[rgba(195,109,242,1)]',
    },
    blue: {
      unchecked: 'text-[rgba(109,164,242,0.4)]',
      checked: 'text-[rgba(109,164,242,1)]',
    },
    orange: {
      unchecked: 'text-[rgba(242,176,109,0.4)]',
      checked: 'text-[rgba(242,176,109,1)]',
    },
  };

  return (
    <label 
      className="flex items-center py-1.5 cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div className="flex-shrink-0">
        {checked ? (
          <FaSquareCheck className={`w-[20px] h-[20px] ${colorClasses[color].checked}`} />
        ) : (
          <FaRegSquare className={`w-[20px] h-[20px] ${colorClasses[color].unchecked}`} />
        )}
      </div>
      <span className="ml-3 text-[15px] text-gray-900 dark:text-gray-100">{label}</span>
    </label>
  );
};

export default ToggleItem;