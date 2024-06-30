
const Tabs = ({ tabsData = [], activeTabIndex, handleTabChange }) => {

    return (
        <div className="w-full">
            <ul className="flex flex-nowrap justify-between overflow-auto text-center text-sm font-medium scrollbar-hide md:text-base">
                {tabsData.map((tab, index) => {
                    return (
                        <li key={tab.id} className="relative grow-[1]" aria-label="Tabs">
                            {tab.badge && <div className="absolute right-4 top-2 w-3 h-3 rounded-full border-2 border-red-dark bg-red animate-pulse"></div>}
                            <button
                                className={`group inline-flex items-center justify-center whitespace-nowrap rounded-t-lg border-b-2 p-4 w-full ${activeTabIndex == index
                                    ? 'border-green text-white'
                                    : 'border-transparent text-body-300 hover:border-white hover:text-white'
                                    }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleTabChange(index);
                                }}
                            >
                                {tab.name}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default Tabs;
