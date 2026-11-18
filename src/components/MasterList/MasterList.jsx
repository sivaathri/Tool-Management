import React, { useState, useMemo } from 'react';
import { formatNumber, exportToolsToCSV } from '../../data/storage';

export default function MasterList({ 
  tools, 
  onAddTool, 
  onEditTool, 
  onDeleteTool, 
  onViewDossier, 
  showToast 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || 
        (tool.toolNo && tool.toolNo.toLowerCase().includes(search)) ||
        (tool.applicationPartNo && tool.applicationPartNo.toLowerCase().includes(search)) ||
        (tool.productName && tool.productName.toLowerCase().includes(search)) ||
        (tool.description && tool.description.toLowerCase().includes(search));

      const matchesClass = !classificationFilter || tool.classification === classificationFilter;

      let toolStatus = tool.status;
      if (toolStatus === 'Active') toolStatus = 'Healthy';
      const matchesStatus = !statusFilter || 
        tool.status === statusFilter || 
        (statusFilter === 'Healthy' && (tool.status === 'Active' || tool.status === 'Healthy'));

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [tools, searchTerm, classificationFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setClassificationFilter('');
    setStatusFilter('');
  };

  const handleExportCSV = () => {
    exportToolsToCSV(filteredTools);
    showToast('Tools exported to CSV successfully', 'success');
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
    <section className="view-section active" id="view-tool-master">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Master List</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            title="Export filtered tools list to CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            id="btnOpenNewToolModal"
            onClick={onAddTool}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add New Tool</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="filter-card">
        <div
          className="filter-grid"
          style={{ gridTemplateColumns: '2.2fr 1.3fr 1.3fr auto', gap: '14px', alignItems: 'flex-end' }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="tmSearchInput">Search Master List</label>
            <input
              type="text"
              className="form-input"
              id="tmSearchInput"
              placeholder="Search Tool No., Product Name, App Part No., Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tmClassificationFilter">Classification</label>
            <select
              className="form-select"
              id="tmClassificationFilter"
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
            >
              <option value="">All Classifications</option>
              <option value="Critical">Critical</option>
              <option value="Non-Critical">Non-Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tmStatusFilter">Status</label>
            <select
              className="form-select"
              id="tmStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Near Limit">Near Limit</option>
              <option value="Replacement Due">Replacement Due</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ visibility: 'hidden' }}>&nbsp;</label>
            <button
              type="button"
              className="btn btn-secondary"
              id="btnResetToolFilters"
              onClick={handleResetFilters}
              style={{ height: '38px', minWidth: '90px' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* TOOL MASTER TABLE */}
      <div className="card">
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>App Part No</th>
                <th>Tool No.</th>
                <th>Product Name</th>
               
                <th>Classification</th>
                <th style={{ textAlign: 'center' }}>Tool Count</th>
                <th>Issued On</th>
                <th className="col-numeric">Life Time</th>
                <th className="col-numeric">Cumulative</th>
                <th className="col-numeric">Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="toolMasterTableBody">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--slate-500)' }}>
                    No tools found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => (
                  <tr key={tool.id}>
                    {/* App Part No (Parent) */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {tool.applicationPartNo}
                      </span>
                    </td>

                    {/* Tool No */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-600)' }}>
                        {tool.toolNo}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td>
                      <strong style={{ color: 'var(--slate-800)' }}>{tool.productName || '—'}</strong>
                    </td>

                  

                    {/* Classification */}
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: tool.classification === 'Critical' ? '#fee2e2' : '#f1f5f9',
                          color: tool.classification === 'Critical' ? '#991b1b' : '#334155',
                          border: tool.classification === 'Critical' ? '1px solid #fecaca' : '1px solid #e2e8f0'
                        }}
                      >
                        {tool.classification || 'Non-Critical'}
                      </span>
                    </td>

                    {/* Tool Count */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-700)', fontFamily: 'var(--font-mono)' }}>
                        {tool.toolCount ?? 0}
                      </span>
                    </td>

                    {/* Issued On */}
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--slate-600)', fontFamily: 'var(--font-mono)' }}>
                        {tool.toolIssuedOn || '—'}
                      </span>
                    </td>

                    {/* Life Time */}
                    <td className="col-numeric">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {formatNumber(tool.lifetime)}
                      </span>
                    </td>

                    {/* Cumulative */}
                    <td className="col-numeric">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {formatNumber(tool.cumulative)}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="col-numeric">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: tool.balance <= 0 ? '#dc2626' : '#059669'
                        }}
                      >
                        {formatNumber(tool.balance)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {renderBadge(tool.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-view"
                          title="View Tool Master Card Dossier"
                          onClick={() => onViewDossier(tool)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-edit"
                          title="Edit Tool"
                          onClick={() => onEditTool(tool)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-delete"
                          title="Delete Tool"
                          onClick={() => onDeleteTool(tool)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
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
