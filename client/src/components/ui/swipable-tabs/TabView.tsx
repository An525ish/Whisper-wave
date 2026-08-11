import { useState, Children, type ReactNode } from 'react';
import Tabs, { type TabItem } from './Tab';

type TabViewProps = {
  tabsData: Record<string, TabItem> | TabItem[];
  children: ReactNode | ((activeTabIndex: number) => ReactNode);
};

const TabView = ({ tabsData, children }: TabViewProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
  };

  const panels =
    typeof children === 'function' ? children(activeTabIndex) : children;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 w-full shrink-0">
        <Tabs
          tabsData={Object.values(tabsData)}
          activeTabIndex={activeTabIndex}
          handleTabChange={handleTabChange}
        />
      </div>

      <div className="w-full flex-1 min-h-0 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
        >
          {Children.map(panels, (child) => (
            <div className="h-full min-h-0 w-full min-w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabView;
