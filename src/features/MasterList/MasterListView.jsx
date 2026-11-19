import React, { useState, useMemo } from 'react';
import { formatNumber } from '../../utils/formatters';
import { exportToolsToCSV } from '../../services/reportService';

export default function MasterList({ 
  tools, 
  onAddTool, 
  onEditTool, 
  onDeleteTool, 
  onViewDossier, 
  onViewServiceHistory,
  showToast 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

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

  // Pagination calculation
  const totalItems = filteredTools.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedTools = useMemo(() => {
    return filteredTools.slice(startIndex, startIndex + pageSize);
  }, [filteredTools, startIndex, pageSize]);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (safeCurrentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(safeCurrentPage - 1);
      pages.push(safeCurrentPage);
      pages.push(safeCurrentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClassificationChange = (e) => {
    setClassificationFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setClassificationFilter('');
    setStatusFilter('');
    setCurrentPage(1);
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
            className="btn btn-primary"
            id="btnOpenNewToolModal"
            onClick={onAddTool}
          >
            
            <span>Add New Tool</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="filter-card">
        <div className="filter-grid filter-grid-master">
          <div className="form-group">
            <label className="form-label" htmlFor="tmSearchInput">Search Master List</label>
            <input
              type="text"
              className="form-input"
              id="tmSearchInput"
              placeholder="Search Tool No., Product Name, App Part No., Description..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tmClassificationFilter">Classification</label>
            <select
              className="form-select"
              id="tmClassificationFilter"
              value={classificationFilter}
              onChange={handleClassificationChange}
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
              onChange={handleStatusChange}
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
              className="btn btn-secondary btn-reset-filter"
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
                <th style={{ textAlign: 'center', width: '60px' }}>Sl.No</th>
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
              {paginatedTools.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--slate-500)' }}>
                    No tools found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                paginatedTools.map((tool, index) => (
                  <tr key={tool.id}>
                    {/* Sl No */}
                    <td style={{ textAlign: 'center', color: 'var(--slate-500)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {(safeCurrentPage - 1) * pageSize + index + 1}
                    </td>

                    {/* App Part No (Parent) */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {tool.applicationPartNo}
                      </span>
                    </td>

                    {/* Tool No */}
                    <td>
                      <button
                        type="button"
                        className="tool-no-btn"
                        onClick={() => {
                          if (onViewServiceHistory) {
                            onViewServiceHistory(tool);
                          } else if (onViewDossier) {
                            onViewDossier(tool);
                          }
                        }}
                        title={`Click to view Preventive Maintenance Card for ${tool.toolNo}`}
                      >
                        {tool.toolNo}
                      </button>
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
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-view"
                          title="View Preventive Maintenance Card"
                          onClick={() => {
                            if (onViewServiceHistory) {
                              onViewServiceHistory(tool);
                            } else if (onViewDossier) {
                              onViewDossier(tool);
                            }
                          }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12C3.6 7.5 7.4 4.5 12 4.5C16.6 4.5 20.4 7.5 22 12C20.4 16.5 16.6 19.5 12 19.5C7.4 19.5 3.6 16.5 2 12Z" />
                            <circle cx="12" cy="12" r="3.6" strokeWidth="2.3" />
                          </svg>
                        </button>

                        {onEditTool && (
                          <button
                            type="button"
                            className="btn-action-icon btn-action-edit"
                            title="Edit Tool Details"
                            onClick={() => onEditTool(tool)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12.5 3.5H6A3.5 3.5 0 0 0 2.5 7v10A3.5 3.5 0 0 0 6 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-6.5" />
                              <path d="M16.5 6.5L18.3 4.7C19.1 3.9 20.4 3.9 21.2 4.7C22.0 5.5 22.0 6.8 21.2 7.6L19.4 9.4" />
                              <line x1="16.5" y1="6.5" x2="9.8" y2="13.2" />
                              <line x1="19.4" y1="9.4" x2="12.7" y2="16.1" />
                              <line x1="16.5" y1="6.5" x2="19.4" y2="9.4" />
                              <line x1="9.8" y1="13.2" x2="12.7" y2="16.1" />
                              <path d="M9.8 13.2L7.8 18.1L12.7 16.1" />
                              <polygon points="7.8,18.1 8.8,15.6 10.3,17.1" fill="currentColor" stroke="none" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer (15 rows per page) */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            <span>
              Showing <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
              <strong>{totalItems}</strong> tools
            </span>
            <span style={{ color: 'var(--slate-400)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>15 per page</span>
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '3px' }}>
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Prev</span>
              </button>

              {getPageNumbers().map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`dots-${idx}`} style={{ padding: '0 4px', color: 'var(--slate-400)', fontSize: '13px' }}>
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={item}
                    type="button"
                    className={`pagination-btn ${item === safeCurrentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                <span>Next</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '3px' }}>
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
