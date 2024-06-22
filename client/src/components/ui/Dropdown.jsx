import { useState } from 'react';
import DropdownIcon from '../icons/Dropdown';

const Dropdown = ({ options, name }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-2xl border border-border shadow-sm pr-2 pl-6 py-1 bg-primary text-sm font-medium text-body-700 hover:text-body focus:outline-none capitalize"
                    id="menu-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                    onClick={toggleDropdown}
                >
                    {name}

                    <DropdownIcon className={`-mr-1 ml-2 h-5 w-5 transition-transform ${isOpen && 'rotate-180'}`} />
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-primary ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex="-1"
                >
                    <div className="py-1" role="none">
                        {options.map(({ label, Icon, handler }, index) => (
                            <p
                                key={index}
                                className="text-body-300 hover:text-body flex items-center px-4 py-0.5 group text-sm cursor-pointer"
                                role="menuitem"
                                tabIndex="-1"
                                id={`menu-item-${index}`}
                                onClick={() => {
                                    handler();
                                    setIsOpen(false);
                                }}
                            >
                                {Icon && <Icon className={'w-3 h-4 mr-2 group-hover:fill-white'} />}
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
