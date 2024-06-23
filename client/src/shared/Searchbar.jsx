import { useState, useRef, useEffect } from 'react';
import searchIcon from '../assets/search.svg';

export default function Searchbar({ searchText, setSearchText, placeholder = 'Search...', width = 'w-44' }) {
    const [isSearchBarFocused, setIsSearchBarFocused] = useState(false);
    const [isSearchBarClicked, setIsSearchBarClicked] = useState(false);
    const inputRef = useRef(null);

    const handleSearchClick = () => {
        setIsSearchBarFocused(true);
        setIsSearchBarClicked(true);
    };

    const handleSearchBlur = () => {
        if (!isSearchBarClicked) {
            setIsSearchBarFocused(false);
            setSearchText('');

        }
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const handleClickOutside = (e) => {
        if (inputRef.current && !inputRef.current.contains(e.target)) {
            setIsSearchBarFocused(false);
            setIsSearchBarClicked(false);
            setSearchText('');

        }
    };

    useEffect(() => {
        if (isSearchBarFocused) {
            inputRef.current.focus();
        }
    }, [isSearchBarFocused]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <div className="relative">
            <div className="flex items-center">
                {!isSearchBarFocused && (
                    <div
                        className="cursor-pointer"
                        onMouseEnter={() => setIsSearchBarFocused(true)}
                    >
                        <img src={searchIcon} alt="Search Icon" />
                    </div>
                )}
                <div
                    className={`relative transition-all duration-300 ease-in-out ${isSearchBarFocused ? `${width} opacity-100` : 'w-0 opacity-0'
                        }`}
                    onMouseLeave={() => !isSearchBarClicked && setIsSearchBarFocused(false)}
                >
                    <img src={searchIcon} alt="Search Icon" className='absolute left-2 h-4 top-[7px]' />

                    <input
                        ref={inputRef}
                        type="text"
                        value={searchText}
                        onChange={handleSearchChange}
                        placeholder={placeholder}
                        className="pl-7 pr-2 py-1 text-sm border border-border rounded-3xl bg-transparent w-full"
                        onBlur={handleSearchBlur}
                        onFocus={handleSearchClick}
                        style={{
                            outline: 'none',
                            boxShadow: 'none',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
