import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChangeTab: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChangeTab,
  className = '',
}) => {
  return (
    <div className={`border-b border-slate-200 dark:border-slate-800/80 ${className}`}>
      <div className="flex gap-1 overflow-x-auto select-none scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-4.5 py-3 border-b-2 text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'border-teal-600 dark:border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-250 dark:hover:border-slate-700/80'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
