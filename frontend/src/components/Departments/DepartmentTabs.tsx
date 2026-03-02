import { FiInfo, FiClock, FiCalendar, FiUsers, FiKey } from 'react-icons/fi';

export type TabId = 'info' | 'sla' | 'schedule' | 'members' | 'access';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface DepartmentTabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const tabs: Tab[] = [
  { id: 'info', label: 'Información', icon: <FiInfo /> },
  { id: 'sla', label: 'SLA', icon: <FiClock /> },
  { id: 'schedule', label: 'Horarios', icon: <FiCalendar /> },
  { id: 'members', label: 'Miembros', icon: <FiUsers /> },
  { id: 'access', label: 'Accesos', icon: <FiKey /> }
];

export default function DepartmentTabs({ activeTab, onTabChange }: DepartmentTabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
              transition-colors duration-200
              ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className={`
              ${activeTab === tab.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500'}
            `}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
