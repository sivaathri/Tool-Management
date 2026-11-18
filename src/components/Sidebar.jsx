import React from 'react';

export default function Sidebar({
  currentView,
  onNavigate,
  toolCount = 0,
  userCount = 0,
  urgentAlertCount = 0,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) {
  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`} id="appSidebar">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-icon" style={{ backgroundColor: '#ffffff', padding: '3px' }}>
            <img src="/inel-logo.png" alt="INEL Logo" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="brand-title">Tool Management</div>
            <div className="brand-subtitle">Manufacturing ERP</div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Operations</div>
          
          <a
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { onNavigate('dashboard'); onCloseMobile?.(); }}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span>Dashboard</span>
          </a>

          <a
            className={`nav-item ${currentView === 'master-list' ? 'active' : ''}`}
            onClick={() => { onNavigate('master-list'); onCloseMobile?.(); }}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Master List</span>
            <span className="nav-badge" id="sidebarToolCount">{toolCount}</span>
          </a>

          <a
            className={`nav-item ${currentView === 'service-history' ? 'active' : ''}`}
            onClick={() => { onNavigate('service-history'); onCloseMobile?.(); }}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <span>Preventive Maintenance</span>
          </a>

          <a
            className={`nav-item ${currentView === 'user-management' ? 'active' : ''}`}
            onClick={() => { onNavigate('user-management'); onCloseMobile?.(); }}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>User Management</span>
            {userCount > 0 && <span className="nav-badge" id="sidebarUserCount">{userCount}</span>}
          </a>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-card" style={{ marginBottom: '12px' }}>
            <div className="user-avatar">AD</div>
            <div className="user-info">
              <div className="user-name">Admin User</div>
           
            </div>
          </div>
          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={onLogout}
            title="Log out of Tool Management System"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
