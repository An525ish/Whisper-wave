import { useState, useRef, useEffect } from 'react';
import searchIcon from '../assets/search.svg';

const cardsData = [
    { id: 1, name: 'Alice', message: 'Hello World' },
    { id: 2, name: 'Bob', message: 'React is awesome' },
    { id: 3, name: 'Charlie', message: 'I love programming' },
    // Add more cards as needed
];

export default function Searchbar({ searchText, setSearchText, width = 'w-44' }) {
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

    const filteredCards = cardsData.filter(card =>
        card.name.toLowerCase().includes(searchText.toLowerCase()) ||
        card.message.toLowerCase().includes(searchText.toLowerCase())
    );

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
                        placeholder="Search..."
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
            {/* {isSearchBarFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-md">
                    {searchResults.map((result, index) => (
                        <div
                            key={index}
                            className="p-2 cursor-pointer hover:bg-gray-200"
                            onMouseDown={() => {
                                // router.push(result.url);
                                setIsSearchBarFocused(false);
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <img src={result.imageUrl} alt={result.title} className="w-8 h-8 rounded" />
                                <div>
                                    <p className="font-semibold">{result.title}</p>
                                    <p className="text-sm text-gray-600">{result.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )} */}
        </div>
    );
}
