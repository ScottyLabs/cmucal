"use client";

import { useState } from "react";
import { FiChevronDown, FiMoreVertical } from "react-icons/fi";
import { Menu, Transition } from '@headlessui/react';

interface AccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  color?: 'red' | 'green';
}

const Accordion: React.FC<AccordionProps> = ({ title, subtitle, children, onRemove, color = 'green' }) => {
  const [isOpen, setIsOpen] = useState(true);

  const colorClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
  };

  return (
    <div className="">
      <div className="flex justify-between items-center py-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-3 ${colorClasses[color]}`}></span>
            <div>
                <h3 className="font-medium text-base">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
        </div>
        <div className="flex items-center">
          {onRemove && (
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => e.stopPropagation()}>
                  <FiMoreVertical className="w-5 h-5 text-gray-600" />
                </Menu.Button>
              </div>
              <Transition
                as={"div"}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                          }}
                          className={`${
                            active ? 'bg-red-500 text-white' : 'text-gray-900 dark:text-gray-200'
                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        >
                          Remove
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="mt-2 pl-5">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion; 