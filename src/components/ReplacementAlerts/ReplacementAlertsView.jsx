import React, { useState, useMemo } from 'react';
import { formatNumber, exportToolsToCSV } from '../../data/storage';
import ToolReplacementModal from '../ServiceHistory/ToolReplacementModal';

export default function ReplacementAlertsView({ tools, onViewDossier, onViewServiceHistory, onNavigate, onReplaceTool, showToast }) {
  const [filterType, setFilterType] = useState('ALL');
  const [replacingTool, setReplacingTool] = useState(null);

  const dueTools = useMemo(() => {
    return tools.filter(t => t.status === 'Replacement Due' || t.status === 'Critical Overrun');
  }, [tools]);

  const nearTools = useMemo(() => {
    return tools.filter(t => t.status === 'Near Limit');
  }, [tools]);

  const allAttention = useMemo(() => {
    return [...dueTools, ...nearTools];
  }, [dueTools, nearTools]);

  const displayedTools = filterType === 'DUE' ? dueTools : filterType === 'NEAR' ? nearTools : allAttention;

  const handleExportCSV = () => {
    exportToolsToCSV(displayedTools, 'replacement_alerts.csv');
  };

  return (
    <section className="view-section active" id="view-replacement-alerts">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Replacement Alerts</h1>
          <p className="page-subtitle">Preventive maintenance limits and tool replacement schedule</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" id="btnExportAlertsCSV" onClick={handleExportCSV}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Alerts</span>
          </button>
        </div>
      </div>

      {/* Alert Filter Tabs */}
      <div className="filter-card">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('ALL')}
          >
            All Attention Tools ({allAttention.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'DUE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('DUE')}
            style={filterType === 'DUE' ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } : {}}
          >
            Replacement Due (&ge; 100%) ({dueTools.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'NEAR' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('NEAR')}
            style={filterType === 'NEAR' ? { backgroundColor: '#d97706', borderColor: '#d97706' } : {}}
          >
            Near Limit (80% - 99%) ({nearTools.length})
          </button>
        </div>
      </div>

      {/* Alerts Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Tool No.</th>
                <th>App Part No.</th>
                <th>Product Name</th>
                <th>Description</th>
                <th className="col-numeric">Frequency Limit</th>
                <th className="col-numeric">Cumulative</th>
                <th className="col-numeric">Balance</th>
                <th>Utilization</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTools.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--slate-500)' }}>
                    No tools currently in this alert tier.
                  </td>
                </tr>
              ) : (
                displayedTools.map(tool => {
                  const pct = Math.min(100, Math.round((tool.cumulative / (tool.lifetime || 1)) * 100));
                  const isDue = tool.status === 'Replacement Due' || tool.status === 'Critical Overrun';
                  return (
                    <tr key={tool.id}>
                      <td>
                        <button
                          type="button"
                          className="tool-no-btn"
                          onClick={() => onViewServiceHistory ? onViewServiceHistory(tool) : onViewDossier(tool)}
                          title={`Click to view Preventive Maintenance Card for ${tool.toolNo}`}
                        >
                          {tool.toolNo}
                        </button>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {tool.applicationPartNo}
                        </span>
                      </td>
                      <td>
                        <strong>{tool.productName}</strong>
                      </td>
                      <td>
                        <span style={{ color: 'var(--slate-600)' }}>{tool.description}</span>
                      </td>
                      <td className="col-numeric">
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(tool.lifetime)}</span>
                      </td>
                      <td className="col-numeric">
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {formatNumber(tool.cumulative)}
                        </span>
                      </td>
                      <td className="col-numeric">
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isDue ? '#dc2626' : '#d97706' }}>
                          {formatNumber(tool.balance)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                          <div className="progress-bar-wrap" style={{ flex: 1, height: '6px' }}>
                            <div
                              className={`progress-bar-fill ${isDue ? 'progress-danger' : 'progress-warning'}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isDue ? 'badge-danger' : 'badge-warning'}`}>
                          <span className="badge-dot"></span>
                          <span>{tool.status}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isDue ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setReplacingTool(tool)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              ...(isDue ? { backgroundColor: '#dc2626', color: '#fff', borderColor: '#dc2626' } : {})
                            }}
                            title="Replace tool and start fresh cycle"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onViewDossier(tool)}
                          >
                            Dossier
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onViewServiceHistory ? onViewServiceHistory(tool) : onNavigate('service-history')}
                          >
                            PM Card
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replacement Modal */}
      {replacingTool && (
        <ToolReplacementModal
          tool={replacingTool}
          isOpen={true}
          onClose={() => setReplacingTool(null)}
          onConfirm={(data) => {
            onReplaceTool?.(replacingTool.id, data);
            setReplacingTool(null);
          }}
        />
      )}
    </section>
  );
}
