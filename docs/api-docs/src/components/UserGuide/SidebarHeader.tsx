import React, { useState, useRef, useEffect } from 'react';
import { Home, ChevronDown, Search, ExternalLink, X } from 'lucide-react';
import { colors, typography, spacing, border } from '../../styles/theme';
import './SidebarHeader.css';

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
}

interface SidebarHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onHomeClick: () => void;
  onClose: () => void;
  onOpenInNewTab: () => void;
  isSearchOpen: boolean;
  onSearchToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  breadcrumbs,
  onHomeClick,
  onClose,
  onOpenInNewTab,
  isSearchOpen,
  onSearchToggle,
  searchQuery,
  onSearchChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Get current breadcrumb (last item)
  const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div
      style={{
        backgroundColor: colors.background.white,
        borderBottom: border.default,
        padding: `${spacing.sm} ${spacing.md}`,
      }}
    >
      {/* Main header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        {/* Left side: Home + Breadcrumb dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flex: 1, minWidth: 0 }}>
          {/* Home button */}
          <button
            onClick={onHomeClick}
            className="header-icon-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: border.radius,
              cursor: 'pointer',
              color: colors.text.secondary,
              flexShrink: 0,
            }}
            title="Home"
          >
            <Home size={16} />
          </button>

          {/* Breadcrumb dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="breadcrumb-dropdown-trigger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: border.radius,
                cursor: 'pointer',
                maxWidth: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentBreadcrumb?.label || 'User guide'}
              </span>
              <ChevronDown
                size={14}
                color={colors.text.muted}
                style={{
                  flexShrink: 0,
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 150ms ease',
                }}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && breadcrumbs.length > 1 && (
              <div
                className="breadcrumb-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  backgroundColor: colors.background.white,
                  border: border.default,
                  borderRadius: border.radius,
                  boxShadow: '0 4px 12px rgba(16, 24, 40, 0.12)',
                  minWidth: 180,
                  maxWidth: 280,
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {breadcrumbs.slice(0, -1).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsDropdownOpen(false);
                    }}
                    className="breadcrumb-item"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: typography.fontFamily.sans,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flexShrink: 0 }}>
          {/* Search toggle */}
          <button
            onClick={onSearchToggle}
            className={`header-icon-button ${isSearchOpen ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              backgroundColor: isSearchOpen ? colors.background.alt : 'transparent',
              border: 'none',
              borderRadius: border.radius,
              cursor: 'pointer',
              color: isSearchOpen ? colors.brand.primary : colors.text.secondary,
            }}
            title="Search"
          >
            <Search size={16} />
          </button>

          {/* Open in new tab */}
          <button
            onClick={onOpenInNewTab}
            className="header-icon-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: border.radius,
              cursor: 'pointer',
              color: colors.text.secondary,
            }}
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="header-icon-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: border.radius,
              cursor: 'pointer',
              color: colors.text.secondary,
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search input (collapsible) */}
      {isSearchOpen && (
        <div style={{ marginTop: spacing.sm }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color={colors.text.muted}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
              style={{
                width: '100%',
                height: 32,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.sans,
                backgroundColor: colors.background.alt,
                borderRadius: border.radius,
                border: border.default,
                paddingLeft: 32,
                paddingRight: 12,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
