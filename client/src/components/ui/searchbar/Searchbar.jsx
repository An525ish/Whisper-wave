import searchIcon from '@/assets/search.svg';

const cardsData = [
    { id: 1, name: 'Alice', message: 'Hello World' },
    { id: 2, name: 'Bob', message: 'React is awesome' },
    { id: 3, name: 'Charlie', message: 'I love programming' },
    // Add more cards as needed
];

export default function Searchbar({ searchText, setSearchText, className }) {

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };


    const filteredCards = cardsData.filter(card =>
        card.name.toLowerCase().includes(searchText.toLowerCase()) ||
        card.message.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="relative">
            <div
                className={`relative ${className}`}
            >
                <img src={searchIcon} alt="Search Icon" className='absolute left-2 h-6 top-[7px]' />

                <input
                    type="text"
                    value={searchText}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                    className="pl-10 pr-2 py-1 h-10 text-sm border border-border rounded-3xl bg-transparent w-full outline-none focus:border-body"
                />
            </div>
        </div>
    );
}
