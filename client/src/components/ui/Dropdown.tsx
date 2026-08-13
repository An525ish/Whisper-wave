import { useState, type ComponentType } from 'react';
import DropdownIcon from '../icons/Dropdown';
import Image from '@/components/ui/Image';
import type { IconProps } from '@/types';

type DropdownOption = {
  label: string;
  Icon?: ComponentType<IconProps>;
  handler: () => void;
};

type DropdownProps = {
  options: DropdownOption[];
  name: string;
  avatarUrl?: string | null;
};

const Dropdown = ({ options, name, avatarUrl }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex max-w-[11rem] items-center text-sm font-medium capitalize leading-none text-body-700 transition hover:text-body focus:outline-none"
        id="menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={toggleDropdown}
      >
        <span className="relative z-10 h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background-alt shadow-sm">
          <Image
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        </span>
        <span className="-ml-3.5 inline-flex h-8 min-w-0 items-center gap-1 rounded-r-full border border-border bg-primary py-0 pl-5 pr-2.5 shadow-sm">
          <span className="min-w-0 truncate">{name}</span>
          <DropdownIcon
            className={`-mr-0.5 h-5 w-5 shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-[60] mt-2 w-full origin-top-right rounded-xl border border-border/70 bg-primary py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          {options.map(({ label, Icon, handler }, index) => (
            <p
              key={index}
              className="group flex cursor-pointer items-center px-3 py-1.5 text-sm text-body-300 hover:text-body"
              role="menuitem"
              tabIndex={-1}
              id={`menu-item-${index}`}
              onClick={() => {
                handler();
                setIsOpen(false);
              }}
            >
              {Icon && (
                <Icon className="mr-2 h-4 w-4 shrink-0 text-body-300 group-hover:fill-white group-hover:text-body" />
              )}
              {label}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
