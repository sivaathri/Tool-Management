import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function MainLayout({
  children,
  currentUser,
  currentView,
  onNavigate,
  toolCount = 0,
  userCount = 0,
  urgentAlertCount = 0,
  warningAlertCount = 0,
  onLogout,
  onExportAllData,
  onUploadBackupFile
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(view) => {
          onNavigate(view);
          setIsMobileSidebarOpen(false);
        }}
        toolCount={toolCount}
        userCount={userCount}
        urgentAlertCount={urgentAlertCount}
        warningAlertCount={warningAlertCount}
        onLogout={onLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenAlerts={() => onNavigate('notifications')}
          alertCount={(urgentAlertCount || 0) + (warningAlertCount || 0)}
          onExportAllData={onExportAllData}
          onUploadBackupFile={onUploadBackupFile}
        />

        {/* View Content Body */}
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
