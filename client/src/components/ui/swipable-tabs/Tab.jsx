
const Tabs = ({ tabsData = [], activeTabIndex, handleTabChange }) => {
    return (
        <div className="w-full">
            <ul className="flex flex-nowrap justify-between overflow-auto text-center text-sm font-medium scrollbar-hide md:text-base">
                {tabsData.map((tab, index) => {
                    return (
                        <li key={tab.id} className="grow-[1]" aria-label="Tabs">
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
