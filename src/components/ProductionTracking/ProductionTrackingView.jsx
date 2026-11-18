import React, { useState, useMemo } from 'react';
import { formatNumber, exportToolsToCSV } from '../../data/storage';

export default function ProductionTrackingView({ tools, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPart, setFilterPart] = useState('');

  const uniqueParts = useMemo(() => {
    return Array.from(new Set(tools.map(t => t.applicationPartNo).filter(Boolean))).sort();
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        tool.toolNo.toLowerCase().includes(term) ||
        (tool.applicationPartNo && tool.applicationPartNo.toLowerCase().includes(term)) ||
        (tool.productName && tool.productName.toLowerCase().includes(term));

      const matchesPart = !filterPart || tool.applicationPartNo === filterPart;

      return matchesSearch && matchesPart;
    });
  }, [tools, searchTerm, filterPart]);

  const totalCumulative = useMemo(() => {
    return tools.reduce((sum, t) => sum + (t.cumulative || 0), 0);
  }, [tools]);

  const handleExportCSV = () => {
    exportToolsToCSV(filteredTools);
    showToast('Production tracking data exported', 'success');
  };

  const renderBadge = (status) => {
    if (status === 'Active' || status === 'Healthy') {
      return (
        <span className="badge badge-healthy">
          <span className="badge-dot"></span>
          <span>Active</span>
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
    <section className="view-section active" id="view-production-tracking">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Production Tracking</h1>
          <p className="page-subtitle">Track tool life consumption, replacement limits, and logged monthly production</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="filter-card">
        <div className="filter-grid" style={{ gridTemplateColumns: '2fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Search Tools</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search Tool No., Part No., Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Filter Application Part</label>
            <select
              className="form-select"
              value={filterPart}
              onChange={(e) => setFilterPart(e.target.value)}
            >
              <option value="">All Application Parts</option>
              {uniqueParts.map(part => (
                <option key={part} value={part}>Part #{part}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary btn-reset-filter"
              onClick={() => { setSearchTerm(''); setFilterPart(''); }}
              style={{ height: '38px', minWidth: '90px' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Production Matrix Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Tool Production & Cumulative Life Matrix</div>
            <div className="card-subtitle">Live status calculated from logged production batches across plant</div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)' }}>
            Total Strokes: {formatNumber(totalCumulative)}
          </div>
        </div>
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Tool No.</th>
                <th>App Part No.</th>
                <th>Product Name</th>
                <th className="col-numeric">Rated Limit</th>
                <th className="col-numeric">Cumulative Output</th>
                <th className="col-numeric">Remaining Balance</th>
                <th>Life Consumption</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="allProductionOverviewBody">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-500)' }}>
                    No tools found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTools.map(tool => {
                  const pct = Math.min(100, Math.round((tool.cumulative / (tool.lifetime || 1)) * 100));
                  const isHealthy = tool.status === 'Active' || tool.status === 'Healthy';
                  const isNear = tool.status === 'Near Limit';
                  const progressClass = isHealthy ? 'progress-healthy' : isNear ? 'progress-warning' : 'progress-danger';

                  return (
                    <tr key={tool.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-600)' }}>
                          {tool.toolNo}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {tool.applicationPartNo}
                        </span>
                      </td>
                      <td>
                        <strong>{tool.productName}</strong>
                      </td>
                      <td className="col-numeric">
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(tool.lifetime)}</span>
                      </td>
                      <td className="col-numeric">
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--slate-900)' }}>
                          {formatNumber(tool.cumulative)}
                        </span>
                      </td>
                      <td className="col-numeric">
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: tool.balance <= 0 ? '#dc2626' : '#059669' }}>
                          {formatNumber(tool.balance)}
                        </span>
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-bar-wrap" style={{ flex: 1, height: '7px' }}>
                            <div className={`progress-bar-fill ${progressClass}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: '38px' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td>{renderBadge(tool.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
