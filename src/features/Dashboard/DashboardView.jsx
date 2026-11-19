import React from 'react';
import { formatNumber } from '../../utils/formatters';

export default function DashboardView({ 
  tools, 
  metrics, 
  onNavigate, 
  onViewDossier, 
  onViewServiceHistory,
  onAddTool,
  onRefresh
}) {
  const healthyCount = tools.filter(t => t.status === 'Active' || t.status === 'Healthy').length;
  const nearLimitCount = tools.filter(t => t.status === 'Near Limit').length;
  const replacementDueCount = tools.filter(t => t.status === 'Replacement Due' || t.status === 'Critical Overrun').length;
  
  const urgentTools = tools.filter(t => t.status === 'Replacement Due' || t.status === 'Critical Overrun' || t.status === 'Near Limit');

  const renderBadge = (status) => {
    if (status === 'Active' || status === 'Healthy') {
      return (
        <span className="badge badge-healthy">
          <span className="badge-dot"></span>
          <span>Healthy</span>
        </span>
      );
    }
    if (status === 'Near Limit') {
      return (
        <span className="badge badge-warning">
          <span className="badge-dot"></span>
          <span>Near Limit</span>
        </span>
      );
    }
    return (
      <span className="badge badge-danger">
        <span className="badge-dot"></span>
        <span>{status || 'Replacement Due'}</span>
      </span>
    );
  };

  return (
    <section className="view-section active" id="view-dashboard">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tooling Performance Dashboard</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" id="btnRefreshDashboard" onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-header">
            <span className="kpi-label">Total Tools</span>
            <div className="kpi-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
          </div>
          <div className="kpi-value" id="kpiTotalTools">{tools.length}</div>
          <div className="kpi-subtext">Registered in Master List</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Healthy Tools</span>
            <div className="kpi-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div className="kpi-value" id="kpiHealthyTools">{healthyCount}</div>
          <div className="kpi-subtext">Utilization &lt; 80% limit</div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-header">
            <span className="kpi-label">Near Replacement</span>
            <div className="kpi-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div className="kpi-value" id="kpiNearLimit">{nearLimitCount}</div>
          <div className="kpi-subtext">80% – 99% threshold reached</div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-header">
            <span className="kpi-label">Replacement Due</span>
            <div className="kpi-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div className="kpi-value" id="kpiReplacementDue">{replacementDueCount}</div>
          <div className="kpi-subtext">Exceeded 100% capacity</div>
        </div>
      </div>

      {/* CHARTS / HEALTH DISTRIBUTION SECTION */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10"></path>
                </svg>
                <span>Tool Replacement Status Breakdown</span>
              </div>
              <div className="card-subtitle">Active distribution of tooling wear status across plant</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>Healthy ({healthyCount})</span>
                  <span>{tools.length ? Math.round((healthyCount / tools.length) * 100) : 0}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${tools.length ? (healthyCount / tools.length) * 100 : 0}%`, height: '100%', background: '#10b981' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>Near Replacement Limit ({nearLimitCount})</span>
                  <span>{tools.length ? Math.round((nearLimitCount / tools.length) * 100) : 0}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${tools.length ? (nearLimitCount / tools.length) * 100 : 0}%`, height: '100%', background: '#f59e0b' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>Replacement Due ({replacementDueCount})</span>
                  <span>{tools.length ? Math.round((replacementDueCount / tools.length) * 100) : 0}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${tools.length ? (replacementDueCount / tools.length) * 100 : 0}%`, height: '100%', background: '#ef4444' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>Total Output Volume</span>
              </div>
              <div className="card-subtitle">Aggregated tooling components stamped & forged (strokes)</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)' }}>
              {formatNumber(metrics.totalProduced)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '6px' }}>
              Cumulative fleet strokes tracked in real-time
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('service-history')}
              style={{ marginTop: '16px' }}
            >
              Record Production Output &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* TOOLS REQUIRING ATTENTION */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title" style={{ color: '#dc2626' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>Tools Requiring Attention</span>
            </div>
            <div className="card-subtitle">Immediate tool replacement or regrinding required</div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" id="btnGoToAlerts" onClick={() => onNavigate('replacement-alerts')}>
            View All Alerts &rarr;
          </button>
        </div>
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Tool No.</th>
                <th>App Part No.</th>
                <th>Product Name</th>
                <th>Description</th>
                <th className="col-numeric">Rated Limit</th>
                <th className="col-numeric">Cumulative</th>
                <th className="col-numeric">Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody id="dashboardAttentionTableBody">
              {urgentTools.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--slate-500)' }}>
                    No tools currently require urgent attention. All tools operating within normal thresholds.
                  </td>
                </tr>
              ) : (
                urgentTools.slice(0, 5).map((tool) => (
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
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatNumber(tool.cumulative)}</span>
                    </td>
                    <td className="col-numeric">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: tool.balance <= 0 ? '#dc2626' : '#d97706' }}>
                        {formatNumber(tool.balance)}
                      </span>
                    </td>
                    <td>{renderBadge(tool.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewDossier(tool)}
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
