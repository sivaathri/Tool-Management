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
  replaceTool,
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
  const [currentView, setCurrentView] = useState(() => {
    try {
      return localStorage.getItem('tms_current_view') || 'master-list';
    } catch (e) {
      return 'master-list';
    }
  });

  const [selectedServiceToolId, setSelectedServiceToolId] = useState(() => {
    try {
      return localStorage.getItem('tms_selected_pm_tool') || null;
    } catch (e) {
      return null;
    }
  });

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

  // Persist view across browser refresh
  useEffect(() => {
    try {
      localStorage.setItem('tms_current_view', currentView);
    } catch (e) {}
  }, [currentView]);

  // Persist selected PM tool across browser refresh
  useEffect(() => {
    try {
      if (selectedServiceToolId) {
        localStorage.setItem('tms_selected_pm_tool', selectedServiceToolId);
      } else {
        localStorage.removeItem('tms_selected_pm_tool');
      }
    } catch (e) {}
  }, [selectedServiceToolId]);

  // Mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);

    // Automatically close toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
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

    // Check for immediate alert notifications on startup
    const timer = setTimeout(() => {
      const allTools = getTools();
      const criticalTools = allTools.filter(t => t.status === 'Replacement Due' || t.status === 'Critical Overrun');
      const warningTools = allTools.filter(t => t.status === 'Near Limit');

      if (criticalTools.length > 0) {
        addToast(
          `🚨 IMMEDIATE ALERT: ${criticalTools.length} tool(s) reached 100% stroke life limit (${criticalTools.map(c => c.toolNo).join(', ')}). Replacement due!`,
          'danger'
        );
      } else if (warningTools.length > 0) {
        addToast(
          `⚠️ ALERT: ${warningTools.length} tool(s) near stroke limit (${warningTools.map(w => w.toolNo).join(', ')}). Check Notifications menu.`,
          'warning'
        );
      }
    }, 700);

    return () => clearTimeout(timer);
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

  // Tool Lifecycle Replacement Handler (Starts Fresh Cycle, Preserves History)
  const handleReplaceTool = (toolId, replacementData) => {
    const updated = replaceTool(toolId, replacementData);
    reloadData();
    addToast(`Tool ${updated?.toolNo || toolId} replaced! Fresh Cycle ${updated?.toolCount || ''} started with limit ${updated?.lifetime?.toLocaleString() || ''} strokes. Cumulative reset to 0.`, 'success');
  };

  // Production Log Handlers
  const handleAddProductionLog = (logData) => {
    addProductionLog(logData);
    reloadData();

    // Immediate Alert Notification if tool reaches Replacement Due or Near Limit
    setTimeout(() => {
      const allTools = getTools();
      const tool = allTools.find(t => t.id === logData.toolId || (t.toolNo && t.toolNo.toLowerCase() === (logData.toolNo || '').toLowerCase()));
      if (tool) {
        const pct = Math.min(100, Math.round(((tool.cumulative || 0) / (tool.lifetime || 1)) * 100));
        if (tool.status === 'Replacement Due' || tool.cumulative >= tool.lifetime) {
          addToast(
            `🚨 CRITICAL ALERT: Tool ${tool.toolNo} reached 100% stroke life limit (${tool.cumulative.toLocaleString()} / ${tool.lifetime.toLocaleString()}). Replacement Due immediately!`,
            'danger'
          );
        } else if (tool.status === 'Near Limit' || pct >= 80) {
          addToast(
            `⚠️ WARNING ALERT: Tool ${tool.toolNo} is near limit (${pct}% used, ${tool.cumulative.toLocaleString()} strokes). Prepare replacement die set soon.`,
            'warning'
          );
        }
      }
    }, 150);
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
        warningAlertCount={metrics.warningAlertsCount}
        onLogout={() => setIsLogoutConfirmOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenAlerts={() => setCurrentView('notifications')}
          alertCount={metrics.criticalAlertsCount + metrics.warningAlertsCount}
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
              onReplaceTool={handleReplaceTool}
              showToast={addToast}
            />
          )}

          {currentView === 'production-tracking' && (
            <ProductionTrackingView
              tools={tools}
              showToast={addToast}
            />
          )}

          {(currentView === 'notifications' || currentView === 'replacement-alerts') && (
            <ReplacementAlertsView
              tools={tools}
              onViewDossier={setDossierTool}
              onViewServiceHistory={handleViewServiceHistory}
              onNavigate={setCurrentView}
              onReplaceTool={handleReplaceTool}
              showToast={addToast}
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
