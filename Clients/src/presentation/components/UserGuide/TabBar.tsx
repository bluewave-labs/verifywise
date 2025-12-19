import React from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';
import { colors, typography } from './styles/theme';
import './TabBar.css';

type Tab = 'user-guide' | 'help';

interface TabBarProps {
  activeTab: Tab | undefined;
  onTabChange: (tab: Tab) => void;
}

interface TabItemProps {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ label, icon, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`tab-item ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 8px',
        cursor: 'pointer',
        backgroundColor: isActive ? colors.background.white : 'transparent',
        borderLeft: isActive ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
        borderBottom: `1px solid ${colors.border.default}`,
      }}
    >
      <div
        style={{
          color: isActive ? colors.brand.primary : colors.text.muted,
          marginBottom: 8,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: typography.fontFamily.sans,
          fontSize: 12,
          fontWeight: typography.fontWeight.normal,
          color: isActive ? colors.brand.primary : colors.text.muted,
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
    </div>
  );
};

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      style={{
        width: 40,
        height: '100%',
        backgroundColor: colors.background.alt,
        borderLeft: `1px solid ${colors.border.default}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      <TabItem
        id="user-guide"
        label="User guide"
        icon={<BookOpen size={18} strokeWidth={1.5} />}
        isActive={activeTab === 'user-guide'}
        onClick={() => onTabChange('user-guide')}
      />
      <TabItem
        id="help"
        label="Help"
        icon={<HelpCircle size={18} strokeWidth={1.5} />}
        isActive={activeTab === 'help'}
        onClick={() => onTabChange('help')}
      />
    </div>
  );
};

export default TabBar;
