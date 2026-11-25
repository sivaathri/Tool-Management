import React, { useRef } from 'react';

export default function Header({
  onToggleMobileSidebar,
  onOpenAlerts,
  alertCount = 0,
  onExportAllData,
  onUploadBackupFile
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadBackupFile) {
      onUploadBackupFile(file);
    }
    e.target.value = '';
  };

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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="header-right">
        <div className="header-backup-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            id="exportAllDataBtn"
            onClick={onExportAllData}
            title="Export all menu data into one backup file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export All Data</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            id="uploadAllDataBtn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload an exported backup file to restore all menu data"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload Data</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <button
          type="button"
          className="header-action-btn"
          id="headerNotificationsBtn"
          onClick={onOpenAlerts}
          title="View Urgent Tool Alerts"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
