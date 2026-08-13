import { useState, type ComponentType } from 'react';
import DropdownIcon from '../icons/Dropdown';
import Image from '@/shared/components/ui/Image';
import type { IconProps } from '@/shared/types';

type DropdownOption = {
  label: string;
  Icon?: ComponentType<IconProps>;
  handler: () => void;
};

type DropdownProps = {
  options: DropdownOption[];
  name: string;
  avatarUrl?: string | null;
  /** sm = desktop layout, scaled down for mobile chrome */
  size?: 'md' | 'sm';
};

const Dropdown = ({ options, name, avatarUrl, size = 'md' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const compact = size === 'sm';

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-flex w-fit flex-col text-left">
      <button
        type="button"
        className="inline-flex max-w-44 items-center text-sm font-medium capitalize leading-none text-body-700 transition hover:text-body focus:outline-none"
        id="menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={toggleDropdown}
      >
        <span
          className={`relative z-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background-alt shadow-sm ${
            compact ? 'h-9 w-9' : 'h-11 w-11'
          }`}
        >
          <Image
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        </span>
        <span
          className={`inline-flex min-w-0 items-center rounded-r-full border border-border bg-primary shadow-sm ${
            compact
              ? '-ml-3 h-7 gap-1 py-0 pl-4 pr-2'
              : '-ml-3.5 h-8 gap-1 py-0 pl-5 pr-2.5'
          }`}
        >
          <span className="min-w-0 truncate">{name}</span>
          <DropdownIcon
            className={`-mr-0.5 shrink-0 transition-transform ${
              compact ? 'h-4 w-4' : 'h-5 w-5'
            } ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen ? (
        <div
          className={`absolute top-full z-60 mt-1 origin-top rounded-xl border border-border/70 bg-primary py-0.5 shadow-lg ring-1 ring-black/5 focus:outline-none ${
            compact
              ? 'right-0 w-[calc(100%+0.75rem)]'
              : 'left-0 w-full'
          }`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          {options.map(({ label, Icon, handler }, index) => (
            <p
              key={index}
              className="group flex cursor-pointer items-center whitespace-nowrap px-3 py-1.5 text-sm text-body-300 hover:text-body"
              role="menuitem"
              tabIndex={-1}
              id={`menu-item-${index}`}
              onClick={() => {
                handler();
                setIsOpen(false);
              }}
            >
              {Icon ? (
                <Icon className="mr-2 h-4 w-4 shrink-0 text-body-300 group-hover:fill-white group-hover:text-body" />
              ) : null}
              <span className="truncate">{label}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Dropdown;
