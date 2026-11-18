import React from 'react';

export default function Header({ onToggleMobileSidebar, onOpenAlerts, alertCount = 0 }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-toggle-btn"
          id="sidebarToggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-action-btn"
          id="headerNotificationsBtn"
          onClick={onOpenAlerts}
          title="View Urgent Tool Alerts"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {alertCount > 0 && <span className="header-badge-dot" id="headerNotificationDot"></span>}
        </button>
      </div>
    </header>
  );
}

export { Header };
