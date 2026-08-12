import { useState, type ComponentType } from 'react';
import DropdownIcon from '../icons/Dropdown';
import type { IconProps } from '@/types';

type DropdownOption = {
  label: string;
  Icon?: ComponentType<IconProps>;
  handler: () => void;
};

type DropdownProps = {
  options: DropdownOption[];
  name: string;
};

const Dropdown = ({ options, name }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex w-full max-w-[7.5rem] items-center justify-center truncate rounded-2xl border border-border bg-primary py-1 pl-6 pr-2 text-sm font-medium capitalize text-body-700 shadow-sm hover:text-body focus:outline-none"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={toggleDropdown}
        >
          {name}

          <DropdownIcon
            className={`-mr-1 ml-2 h-5 w-5 transition-transform ${
              isOpen && 'rotate-180'
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-primary ring-1 ring-black/5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {options.map(({ label, Icon, handler }, index) => (
              <p
                key={index}
                className="text-body-300 hover:text-body flex items-center px-4 py-0.5 group text-sm cursor-pointer"
                role="menuitem"
                tabIndex={-1}
                id={`menu-item-${index}`}
                onClick={() => {
                  handler();
                  setIsOpen(false);
                }}
              >
                {Icon && (
                  <Icon className={'w-3 h-4 mr-2 group-hover:fill-white'} />
                )}
                {label}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
