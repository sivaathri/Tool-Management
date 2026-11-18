import React, { useState, useMemo, useEffect } from 'react';
import { formatNumber } from '../../data/storage';
import AddProductionModal from './AddProductionModal';

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
  const [selectedToolId, setSelectedToolId] = useState(propSelectedToolId || tools[0]?.id || null);
  const [searchInput, setSearchInput] = useState('');
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  useEffect(() => {
    if (propSelectedToolId) {
      setSelectedToolId(propSelectedToolId);
    }
  }, [propSelectedToolId]);

  const handleSelectTool = (id) => {
    setSelectedToolId(id);
    onSelectToolId?.(id);
  };

  const selectedTool = useMemo(() => {
    return tools.find(t => t.id === selectedToolId) || tools[0] || null;
  }, [tools, selectedToolId]);

  const toolLogs = useMemo(() => {
    if (!selectedTool) return [];
    return productionLogs
      .filter(l => l.toolId === selectedTool.id || l.toolNo === selectedTool.toolNo)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [productionLogs, selectedTool]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;
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
    onAddProductionLog(newLog);
    setIsAddLogOpen(false);
    showToast(`Logged ${formatNumber(newLog.quantity)} output for ${selectedTool.toolNo}`, 'success');
  };

  if (!selectedTool) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: 'var(--slate-500)' }}>
        No tools registered. Please add tools in the Master List.
      </div>
    );
  }

  const pct = Math.min(100, Math.round((selectedTool.cumulative / (selectedTool.lifetime || 1)) * 100));
  const isHealthy = selectedTool.status === 'Active' || selectedTool.status === 'Healthy';
  const isNear = selectedTool.status === 'Near Limit';
  const progressClass = isHealthy ? 'progress-healthy' : isNear ? 'progress-warning' : 'progress-danger';

  return (
    <section className="view-section active" id="view-service-history">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
         
          <div>
            <h1 className="page-title">Tool Service History</h1>
            <p className="page-subtitle">Digital Tool Service History Card & Production Output Tracking</p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print Card</span>
          </button>
        </div>
      </div>

      {/* PROMINENT SEARCH CARD */}
      <div className="prominent-search-box">
        <div className="prominent-search-header">
          <div className="prominent-search-title">Search Tool Card</div>
          <div className="prominent-search-desc">
            Enter any Tool Number to instantly retrieve Master Card specs, inspection check points, and production history
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
        </form>

        
      </div>

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

      {/* CHECK POINTS LIST */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              <span>Configured Inspection Check Points ({selectedTool.checkPoints?.length || 0})</span>
            </div>
            <div className="card-subtitle">Mandatory quality check points registered for tool maintenance inspection</div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr style={{ background: 'var(--slate-100)' }}>
                <th style={{ width: '70px', textAlign: 'center' }}>S.no</th>
                <th>Check point Description</th>
              </tr>
            </thead>
            <tbody>
              {(!selectedTool.checkPoints || selectedTool.checkPoints.length === 0) ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)' }}>
                    No check points configured for this tool.
                  </td>
                </tr>
              ) : (
                selectedTool.checkPoints.map((cp, idx) => (
                  <tr key={idx}>
                    <td style={{ width: '70px', textAlign: 'center', fontWeight: 700, color: 'var(--slate-600)' }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--slate-800)', whiteSpace: 'pre-wrap' }}>
                      {cp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
      {isAddLogOpen && (
        <AddProductionModal
          tool={selectedTool}
          onClose={() => setIsAddLogOpen(false)}
          onSave={handleSaveLog}
        />
      )}
    </section>
  );
}
