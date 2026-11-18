import React, { useState, useMemo, useEffect } from 'react';
import { formatNumber } from '../../data/storage';
import AddProductionModal from './AddProductionModal';
import PMChecklistSheet from './PMChecklistSheet';

export default function ServiceHistoryView({ 
  tools, 
  productionLogs, 
  onAddProductionLog, 
  onDeleteProductionLog,
  showToast,
  selectedToolId: propSelectedToolId = null,
  onSelectToolId,
  onBackToMaster
}) {
  const [selectedToolId, setSelectedToolId] = useState(propSelectedToolId || null);
  const [searchInput, setSearchInput] = useState('');
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  useEffect(() => {
    setSelectedToolId(propSelectedToolId || null);
  }, [propSelectedToolId]);

  const handleSelectTool = (id) => {
    setSelectedToolId(id);
    onSelectToolId?.(id);
  };

  const selectedTool = useMemo(() => {
    if (!selectedToolId) return null;
    return tools.find(t => t.id === selectedToolId) || null;
  }, [tools, selectedToolId]);

  const toolLogs = useMemo(() => {
    if (!selectedTool) return [];
    return productionLogs
      .filter(l => l.toolId === selectedTool.id || l.toolNo === selectedTool.toolNo)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [productionLogs, selectedTool]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchInput.trim()) {
      showToast('Please enter a tool number to search', 'warning');
      return;
    }
    const q = searchInput.trim().toLowerCase();
    const match = tools.find(t => 
      t.toolNo.toLowerCase().includes(q) || 
      (t.applicationPartNo && t.applicationPartNo.toLowerCase().includes(q)) ||
      (t.productName && t.productName.toLowerCase().includes(q))
    );
    if (match) {
      handleSelectTool(match.id);
      showToast(`Selected tool ${match.toolNo}`, 'info');
    } else {
      showToast(`No tool found matching "${searchInput}"`, 'warning');
    }
  };

  const handleSaveLog = (newLog) => {
    if (!selectedTool) return;
    onAddProductionLog(newLog);
    setIsAddLogOpen(false);
    showToast(`Logged ${formatNumber(newLog.quantity)} output for ${selectedTool.toolNo}`, 'success');
  };

  const pct = selectedTool ? Math.min(100, Math.round((selectedTool.cumulative / (selectedTool.lifetime || 1)) * 100)) : 0;
  const isHealthy = selectedTool ? (selectedTool.status === 'Active' || selectedTool.status === 'Healthy') : false;
  const isNear = selectedTool ? selectedTool.status === 'Near Limit' : false;
  const progressClass = isHealthy ? 'progress-healthy' : isNear ? 'progress-warning' : 'progress-danger';

  return (
    <section className="view-section active" id="view-service-history">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
         
          <div>
            <h1 className="page-title">Preventive Maintenance</h1>
            <p className="page-subtitle">Digital PM Inspection Card, Check Points & Production Output Tracking</p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print PM Card</span>
          </button>
        </div>
      </div>

      {/* PROMINENT SEARCH CARD */}
      <div className="prominent-search-box">
        <div className="prominent-search-header">
          <div className="prominent-search-title">Search Tool PM Card</div>
          <div className="prominent-search-desc">
            Enter any Tool Number to instantly retrieve Master Card specs, inspection check points, and preventive maintenance history
          </div>
        </div>
        <form className="prominent-search-bar" onSubmit={handleSearchSubmit}>
          <div className="search-input-combo">
            <svg className="prominent-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="prominent-input"
              id="serviceSearchInput"
              placeholder="Enter Tool Number (e.g. INE T 1122, INE T 1133, INE T 0652)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" id="btnSearchServiceTool" style={{ padding: '0 24px' }}>
            Search Tool
          </button>
          {selectedTool && (
            <button
              type="button"
              className="btn btn-secondary btn-reset-filter"
              onClick={() => {
                handleSelectTool(null);
                setSearchInput('');
              }}
              style={{ padding: '0 16px' }}
              title="Clear search"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* SHOW SERVICE DATA ONLY WHEN A TOOL HAS BEEN SEARCHED / SELECTED */}
      {selectedTool ? (
        <>
          {/* SELECTED TOOL SUMMARY DIGITAL CARD */}
          <div className="tool-summary-card" id="selectedToolSummaryCard">
        <div className="tool-summary-top">
          <div className="tool-summary-left">
            <div className="tool-badge-large" id="shToolTypeBadge">
              {selectedTool.toolNo.charAt(0) || 'T'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--slate-900)' }} id="shToolNumber">
                  {selectedTool.toolNo}
                </h2>
                <span className={`badge ${isHealthy ? 'badge-healthy' : isNear ? 'badge-warning' : 'badge-danger'}`} id="shToolStatusBadge">
                  <span className="badge-dot"></span>
                  <span>{selectedTool.status}</span>
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '2px' }} id="shToolDescription">
                {selectedTool.description || 'Precision Manufacturing Tool'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              id="btnAddProductionRecordBtn"
              onClick={() => setIsAddLogOpen(true)}
              style={{ backgroundColor: '#059669' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add Monthly Production</span>
            </button>
          </div>
        </div>

        <div className="tool-summary-meta-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <div className="meta-item">
            <span className="meta-label">App Part No (Parent)</span>
            <span className="meta-val" id="shAppPartVal" style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'var(--font-mono)' }}>
              {selectedTool.applicationPartNo}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Product Name</span>
            <span className="meta-val" id="shProductVal">{selectedTool.productName || '—'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Classification</span>
            <span className="meta-val" id="shClassificationVal">{selectedTool.classification || 'Non-Critical'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Tool Count</span>
            <span className="meta-val col-numeric" id="shToolCountVal" style={{ fontSize: '14px', fontWeight: 600 }}>
              {selectedTool.toolCount ?? 0}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Life Time Limit</span>
            <span className="meta-val col-numeric" id="shRepLimitVal" style={{ fontSize: '15px', color: 'var(--accent-700)' }}>
              {formatNumber(selectedTool.lifetime)}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Current Cumulative</span>
            <span className="meta-val col-numeric" id="shCumulativeVal" style={{ fontSize: '15px' }}>
              {formatNumber(selectedTool.cumulative)}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Remaining Balance</span>
            <span
              className="meta-val col-numeric"
              id="shBalanceVal"
              style={{ fontSize: '15px', color: selectedTool.balance <= 0 ? '#dc2626' : '#d97706' }}
            >
              {formatNumber(selectedTool.balance)}
            </span>
          </div>
        </div>

        <div className="tool-summary-progress">
          <div className="progress-info-row">
            <span>Tool Life Utilization</span>
            <span id="shUtilizationPct">{pct}% Used (Replacement threshold at 80% and 100%)</span>
          </div>
          <div className="progress-bar-wrap">
            <div
              className={`progress-bar-fill ${progressClass}`}
              id="shProgressBarFill"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* PREVENTIVE MAINTENANCE CHECK LIST SHEET (ENTER DATA) */}
      <PMChecklistSheet tool={selectedTool} showToast={showToast} />

      {/* QUANTITY PRODUCED TABLE */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Quantity Produced (Production Tracking)</div>
            <div className="card-subtitle">Production output logs tracking cumulative parts made and remaining tool balance</div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddLogOpen(true)}
            style={{ backgroundColor: '#059669' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Entry</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Production Date</th>
                <th className="col-numeric">Quantity Produced</th>
                <th>Recorded By</th>
                <th>Remarks / Shift</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody id="quantityProducedTableBody">
              {toolLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-400)' }}>
                    No production logs recorded yet for {selectedTool.toolNo}. Click "+ Add Entry" to record output.
                  </td>
                </tr>
              ) : (
                toolLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--slate-800)' }}>
                        {log.date}
                      </span>
                    </td>
                    <td className="col-numeric">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-700)' }}>
                        +{formatNumber(log.quantity)}
                      </span>
                    </td>
                    <td>{log.operator || 'Operator'}</td>
                    <td>
                      <span style={{ color: 'var(--slate-600)' }}>{log.notes || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-action-icon btn-action-delete"
                        onClick={() => onDeleteProductionLog(log.id)}
                        title="Delete entry"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Production Modal */}
      {isAddLogOpen && selectedTool && (
        <AddProductionModal
          tool={selectedTool}
          onClose={() => setIsAddLogOpen(false)}
          onSave={handleSaveLog}
        />
      )}
        </>
      ) : (
        /* Empty State: Shown before searching for a tool */
        <div
          className="card"
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            marginTop: '20px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--slate-100)',
              color: 'var(--accent-600)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
            Search for a Tool to View Preventive Maintenance
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
            Please enter a Tool Number in the search box above (e.g. <strong style={{ color: 'var(--accent-600)', fontFamily: 'var(--font-mono)' }}>INE T 1122</strong>) or select a tool from the Master List to display its full preventive maintenance card, specifications, inspection check points, and production records.
          </p>
        </div>
      )}
    </section>
  );
}
