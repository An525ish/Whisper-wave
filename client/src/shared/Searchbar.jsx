import { useState, useRef, useEffect } from 'react';
import searchIcon from '../assets/search.svg';

export default function Searchbar({ searchText, setSearchText, autoFocus = false, placeholder = 'Search...', width = 'w-44' }) {
    const [isSearchBarFocused, setIsSearchBarFocused] = useState(false);
    const inputRef = useRef(null);

    const handleSearchClick = () => {
        setIsSearchBarFocused(true);
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const handleCrossClick = () => {
        setIsSearchBarFocused(false);
        setSearchText('');
    };

    useEffect(() => {
        if (isSearchBarFocused) {
            inputRef.current.focus();
        }
    }, [isSearchBarFocused]);

    return (
        <div className="relative">
            <div className="flex items-center">
                {!isSearchBarFocused && (
                    <div
                        className="cursor-pointer"
                        onClick={() => setIsSearchBarFocused(true)}
                    >
                        <img src={searchIcon} alt="Search Icon" />
                    </div>
                )}
                <div
                    className={`relative transition-all duration-300 ease-in-out ${isSearchBarFocused ? `${width} opacity-100` : 'w-0 opacity-0'
                        }`}
                >
                    <img src={searchIcon} alt="Search Icon" className='absolute left-2 h-4 top-[7px]' />

                    <input
                        ref={inputRef}
                        type="text"
                        value={searchText}
                        onChange={handleSearchChange}
                        autoFocus={autoFocus}
                        placeholder={placeholder}
                        className="pl-7 pr-8 py-1 text-sm border border-border rounded-3xl bg-transparent w-full"
                        onFocus={handleSearchClick}
                        style={{
                            outline: 'none',
                            boxShadow: 'none',
                        }}
                    />

                    {isSearchBarFocused && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 mt-[1px] text-body-300 hover:text-body-700 text-sm"
                            onClick={handleCrossClick}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}