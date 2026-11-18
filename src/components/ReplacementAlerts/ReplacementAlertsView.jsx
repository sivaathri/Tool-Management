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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">Notifications & Tool Alerts</h1>
            {allAttention.length > 0 && (
              <span style={{
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '12px',
                backgroundColor: dueTools.length > 0 ? '#fee2e2' : '#fef3c7',
                color: dueTools.length > 0 ? '#dc2626' : '#b45309'
              }}>
                {dueTools.length > 0 ? `🚨 ${dueTools.length} Urgent` : `⚠️ ${nearTools.length} Warnings`}
              </span>
            )}
          </div>
          <p className="page-subtitle">Real-time preventive maintenance notifications, replacement due alerts, and stroke limit warnings</p>
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

      {/* KPI Overview Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '18px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1.5px solid #fecaca',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.06)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}>
            🚨
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Replacement Due (≥ 100%)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#991b1b', marginTop: '2px' }}>
              {dueTools.length}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1.5px solid #fde68a',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.06)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Near Limit Warning (80% - 99%)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#92400e', marginTop: '2px' }}>
              {nearTools.length}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1.5px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}>
            🔔
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Total Alerts Requiring Action
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--slate-800)', marginTop: '2px' }}>
              {allAttention.length}
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Alert Banner if replacement due */}
      {dueTools.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px' }}>🚨</span>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#991b1b' }}>
                IMMEDIATE ACTION REQUIRED: {dueTools.length} tool(s) reached 100% rated life limit
              </div>
              <div style={{ fontSize: '12.5px', color: '#b91c1c', marginTop: '2px' }}>
                Tools ({dueTools.map(t => t.toolNo).join(', ')}) have exceeded their rated life stroke limit. Replace tools to start a fresh cycle and reset cumulative output to 0.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setReplacingTool(dueTools[0])}
            style={{ fontWeight: 700, padding: '7px 16px', whiteSpace: 'nowrap' }}
          >
            Replace {dueTools[0].toolNo} Now
          </button>
        </div>
      )}

      {/* Alert Filter Tabs */}
      <div className="filter-card">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('ALL')}
            style={{ fontWeight: 700, padding: '6px 14px' }}
          >
            🔔 All Notifications ({allAttention.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'DUE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('DUE')}
            style={{
              fontWeight: 700,
              padding: '6px 14px',
              backgroundColor: filterType === 'DUE' ? '#dc2626' : '',
              borderColor: filterType === 'DUE' ? '#dc2626' : ''
            }}
          >
            🚨 Critical: Replacement Due ({dueTools.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'NEAR' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('NEAR')}
            style={{
              fontWeight: 700,
              padding: '6px 14px',
              backgroundColor: filterType === 'NEAR' ? '#d97706' : '',
              borderColor: filterType === 'NEAR' ? '#d97706' : ''
            }}
          >
            ⚠️ Warning: Near Limit ({nearTools.length})
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
