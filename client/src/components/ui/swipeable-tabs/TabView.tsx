import { useEffect, useState, Children, type ReactNode } from 'react';
import Tabs, { type TabItem, type TabVariant } from '@/components/ui/swipeable-tabs/Tab';

type TabViewProps = {
  tabsData: Record<string, TabItem> | TabItem[];
  children: ReactNode | ((activeTabIndex: number) => ReactNode);
  initialTabIndex?: number;
  variant?: TabVariant;
  ariaLabel?: string;
};

const TabView = ({
  tabsData,
  children,
  initialTabIndex = 0,
  variant = 'underline',
  ariaLabel,
}: TabViewProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(initialTabIndex);

  useEffect(() => {
    setActiveTabIndex(initialTabIndex);
  }, [initialTabIndex]);

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
          variant={variant}
          ariaLabel={ariaLabel}
        />
      </div>

      <div className="w-full flex-1 min-h-0 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
        >
          {Children.map(panels, (child) => (
            <div className="h-full min-h-0 w-full min-w-full shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabView;
