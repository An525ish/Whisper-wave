import { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import Tabs from './Tab';


const TabView = ({ tabsData, children }) => {

    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const handleTabChange = (index) => {
        setActiveTabIndex(index);
    };

    return (
        <>
            <div className="mb-4 w-full">
                <Tabs
                    tabsData={Object.values(tabsData)}
                    activeTabIndex={activeTabIndex}
                    handleTabChange={handleTabChange}
                />
            </div>

            <SwipeableViews index={activeTabIndex} onChangeIndex={handleTabChange}>
                {children(activeTabIndex)}
            </SwipeableViews>
        </>
    );
};

export default TabView;
