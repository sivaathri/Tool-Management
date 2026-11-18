import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastContainer from './components/common/Toast';
import ConfirmModal from './components/common/ConfirmModal';

import DashboardView from './components/Dashboard/DashboardView';
import MasterList from './components/MasterList/MasterList';
import AddEditToolModal from './components/MasterList/AddEditToolModal';
import ToolDossierModal from './components/MasterList/ToolDossierModal';
import ServiceHistoryView from './components/ServiceHistory/ServiceHistoryView';
import ProductionTrackingView from './components/ProductionTracking/ProductionTrackingView';
import ReplacementAlertsView from './components/ReplacementAlerts/ReplacementAlertsView';
import ReportsView from './components/Reports/ReportsView';
import UserManagementView from './components/UserManagement/UserManagementView';

import {
  getTools,
  saveTool,
  deleteTool,
  getProductionLogs,
  addProductionLog,
  deleteProductionLog,
  getUsers,
  saveUser,
  deleteUser,
  calculateMetrics,
  resetToInitialData
} from './data/storage';

export default function App() {
  const [currentView, setCurrentView] = useState('master-list');
  const [tools, setTools] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTools: 0,
    uniquePartsCount: 0,
    totalProduced: 0,
    criticalAlertsCount: 0,
    warningAlertsCount: 0,
    activeCount: 0
  });

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [dossierTool, setDossierTool] = useState(null);
  const [toolToDelete, setToolToDelete] = useState(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [selectedServiceToolId, setSelectedServiceToolId] = useState(null);

  // Mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Reload data from local storage & recalculate metrics
  const reloadData = () => {
    const t = getTools();
    const l = getProductionLogs();
    const u = getUsers();
    const m = calculateMetrics(t, l);
    setTools(t);
    setProductionLogs(l);
    setUsers(u);
    setMetrics(m);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handlers for Tools
  const handleOpenAddTool = () => {
    setEditingTool(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEditTool = (tool) => {
    setEditingTool(tool);
    setIsAddEditOpen(true);
  };

  const handleSaveTool = (toolData) => {
    saveTool(toolData);
    reloadData();
    setIsAddEditOpen(false);
    setEditingTool(null);
    addToast(
      editingTool 
        ? `Tool ${toolData.toolNo} updated successfully` 
        : `New Tool ${toolData.toolNo} created under Part #${toolData.applicationPartNo}`, 
      'success'
    );
  };

  const handleDeleteToolClick = (tool) => {
    setToolToDelete(tool);
  };

  const handleConfirmDeleteTool = () => {
    if (toolToDelete) {
      deleteTool(toolToDelete.id);
      reloadData();
      addToast(`Tool ${toolToDelete.toolNo} deleted`, 'info');
      setToolToDelete(null);
    }
  };

  // Production Log Handlers
  const handleAddProductionLog = (logData) => {
    addProductionLog(logData);
    reloadData();
  };

  const handleDeleteProductionLog = (logId) => {
    deleteProductionLog(logId);
    reloadData();
    addToast('Production entry deleted', 'info');
  };

  // User Handlers
  const handleSaveUser = (userData) => {
    saveUser(userData);
    reloadData();
  };

  const handleDeleteUser = (userId) => {
    deleteUser(userId);
    reloadData();
  };

  // Logout
  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    addToast('You have been logged out successfully.', 'info');
  };

  // View Tool History Service Card
  const handleViewServiceHistory = (tool) => {
    if (tool && tool.id) {
      setSelectedServiceToolId(tool.id);
    }
    setCurrentView('service-history');
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'service-history') {
            setSelectedServiceToolId(null);
          }
          setCurrentView(view);
          setIsMobileSidebarOpen(false);
        }}
        toolCount={tools.length}
        userCount={users.length}
        urgentAlertCount={metrics.criticalAlertsCount}
        onLogout={() => setIsLogoutConfirmOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenAlerts={() => setCurrentView('replacement-alerts')}
          alertCount={metrics.criticalAlertsCount}
        />

        {/* Content Views */}
        <main className="app-content">
          {currentView === 'dashboard' && (
            <DashboardView
              tools={tools}
              metrics={metrics}
              onNavigate={setCurrentView}
              onViewDossier={setDossierTool}
              onViewServiceHistory={handleViewServiceHistory}
              onAddTool={handleOpenAddTool}
              onRefresh={reloadData}
            />
          )}

          {currentView === 'master-list' && (
            <MasterList
              tools={tools}
              onAddTool={handleOpenAddTool}
              onEditTool={handleOpenEditTool}
              onDeleteTool={handleDeleteToolClick}
              onViewDossier={setDossierTool}
              onViewServiceHistory={handleViewServiceHistory}
              showToast={addToast}
            />
          )}

          {currentView === 'service-history' && (
            <ServiceHistoryView
              tools={tools}
              productionLogs={productionLogs}
              selectedToolId={selectedServiceToolId}
              onSelectToolId={setSelectedServiceToolId}
              onBackToMaster={() => setCurrentView('master-list')}
              onAddProductionLog={handleAddProductionLog}
              onDeleteProductionLog={handleDeleteProductionLog}
              showToast={addToast}
            />
          )}

          {currentView === 'production-tracking' && (
            <ProductionTrackingView
              tools={tools}
              showToast={addToast}
            />
          )}

          {currentView === 'replacement-alerts' && (
            <ReplacementAlertsView
              tools={tools}
              onViewDossier={setDossierTool}
              onViewServiceHistory={handleViewServiceHistory}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              tools={tools}
              metrics={metrics}
              showToast={addToast}
            />
          )}

          {currentView === 'user-management' && (
            <UserManagementView
              users={users}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              showToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {isAddEditOpen && (
        <AddEditToolModal
          isOpen={true}
          tool={editingTool}
          allTools={tools}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingTool(null);
          }}
          onSave={handleSaveTool}
        />
      )}

      {dossierTool && (
        <ToolDossierModal
          tool={dossierTool}
          onClose={() => setDossierTool(null)}
        />
      )}

      {toolToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Tool"
          message={`Are you sure you want to permanently delete tool ${toolToDelete.toolNo} (Part #${toolToDelete.applicationPartNo})? All associated tracking and check point records will be removed.`}
          confirmLabel="Delete Tool"
          confirmVariant="danger"
          onConfirm={handleConfirmDeleteTool}
          onCancel={() => setToolToDelete(null)}
        />
      )}

      {isLogoutConfirmOpen && (
        <ConfirmModal
          isOpen={true}
          title="Log Out"
          message="Are you sure you want to log out of the Tool Management System?"
          confirmLabel="Log Out"
          confirmVariant="danger"
          onConfirm={handleConfirmLogout}
          onCancel={() => setIsLogoutConfirmOpen(false)}
        />
      )}

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />
    </div>
  );
}
