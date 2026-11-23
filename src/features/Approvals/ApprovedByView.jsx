import React, { useState, useMemo, useEffect } from 'react';
import { getPMRecords, updateApprovedBySignOff } from '../../services/toolService';

export default function ApprovedByView({ tools = [], onNavigateToPM, currentUser, showToast }) {
  const [pmRecords, setPMRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [approvingItem, setApprovingItem] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Approved',
    remarks: ''
  });

  const loadData = () => {
    setPMRecords(getPMRecords());
  };

  useEffect(() => {
    loadData();
  }, [tools]);

  // Combine tools with their PM, QA verification, and Approval status
  const queueItems = useMemo(() => {
    return tools.map(t => {
      const cleanToolNo = (t.toolNo || '').toLowerCase().trim();
      const pm = pmRecords.find(p => 
        (p.toolId && p.toolId === t.id) || 
        (p.toolNo && p.toolNo.toLowerCase().trim() === cleanToolNo)
      );

      const checkedBy = pm?.checkedBy || null;
      const approvedBy = pm?.approvedBy || null;

      let approvalStatus = 'Pending Approval';
      if (approvedBy?.status === 'Approved') {
        approvalStatus = 'Approved';
      } else if (approvedBy?.status === 'Hold') {
        approvalStatus = 'Hold';
      }

      const pct = t.lifetime > 0 ? Math.min(100, Math.round(((t.cumulative || 0) / t.lifetime) * 100)) : 0;

      return {
        tool: t,
        pmRecord: pm,
        checkedBy,
        approvedBy,
        approvalStatus,
        wearPct: pct,
        isQAVerified: checkedBy?.status === 'Verified'
      };
    });
  }, [tools, pmRecords]);

  // KPIs
  const metrics = useMemo(() => {
    const total = queueItems.length;
    const pending = queueItems.filter(q => q.approvalStatus === 'Pending Approval').length;
    const approved = queueItems.filter(q => q.approvalStatus === 'Approved').length;
    const hold = queueItems.filter(q => q.approvalStatus === 'Hold').length;
    return { total, pending, approved, hold };
  }, [queueItems]);

  // Filter
  const filtered = useMemo(() => {
    return queueItems.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (item.tool.toolNo && item.tool.toolNo.toLowerCase().includes(q)) ||
        (item.tool.applicationPartNo && item.tool.applicationPartNo.toLowerCase().includes(q)) ||
        (item.tool.productName && item.tool.productName.toLowerCase().includes(q));

      const matchStatus = !statusFilter || item.approvalStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [queueItems, searchTerm, statusFilter]);

  // Pagination calculation (15 per page)
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = useMemo(() => {
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, startIndex, pageSize]);

  // Generate page numbers
  const pageNumbers = useMemo(() => {
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
  }, [totalPages, safeCurrentPage]);

  const handleOpenApprove = (item) => {
    setApprovingItem(item);
    setApprovalForm({
      name: item.approvedBy?.name || currentUser?.name || 'Tool Room Lead / Plant Incharge',
      date: item.approvedBy?.date || new Date().toISOString().slice(0, 10),
      status: item.approvedBy?.status || 'Approved',
      remarks: item.approvedBy?.remarks || 'Tool maintenance and PM checklist verified. Cleared and authorized for production run.'
    });
  };

  const handleSubmitApproval = (e) => {
    e.preventDefault();
    if (!approvingItem) return;

    updateApprovedBySignOff(approvingItem.tool.id, approvalForm);
    loadData();
    setApprovingItem(null);
    showToast?.(`Management authorization sign-off saved for ${approvingItem.tool.toolNo}`, 'success');
  };

  return (
    <section className="view-section active" id="view-approved-by">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Management Authorization (Approved By)</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--slate-500)', fontSize: '13px', marginTop: '4px' }}>
            Plant Incharge & Tool Room Lead approval queue for production tool release and lifecycle clearance
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* Pending Approval */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', backgroundColor: metrics.pending > 0 ? '#fffbeb' : '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.pending > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Pending Management Approval
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.pending > 0 ? '#d97706' : '#0f172a', marginTop: '6px' }}>
            {metrics.pending}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Awaiting final release authorization
          </div>
        </div>

        {/* Approved & Released */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Approved & Released
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {metrics.approved}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Cleared for active plant production
          </div>
        </div>

        {/* On Hold */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.hold > 0 ? '#b91c1c' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Hold / Overhaul Needed
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.hold > 0 ? '#dc2626' : '#0f172a', marginTop: '6px' }}>
            {metrics.hold}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Tool restricted from running
          </div>
        </div>

        {/* Total Tooling */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Plant Tooling
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Managed tool catalog
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="filter-card" style={{ marginBottom: '20px' }}>
        <div className="filter-grid filter-grid-master">
          <div className="form-group">
            <label className="form-label">Search Tool</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search Tool No., Product Name, Part No..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Approval Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Approval Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved & Released</option>
              <option value="Hold">On Hold / Overhaul Needed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ visibility: 'hidden' }}>Reset</label>
            <button
              type="button"
              className="btn btn-secondary btn-reset-filter"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              style={{ height: '38px', minWidth: '90px' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ margin: 0 }}>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '55px' }}>Sl.No</th>
                <th style={{ width: '130px' }}>Tool No.</th>
                <th>Application & Product</th>
                <th style={{ width: '160px' }}>Stroke Life Used</th>
                <th>QA Checked By</th>
                <th style={{ textAlign: 'center' }}>Approval Status</th>
                <th>Authorized By</th>
                <th>Approval Date</th>
                <th>Authorization Remarks</th>
                <th style={{ textAlign: 'center', width: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                      No approval records found
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>
                      Registered tools will appear here for management release sign-off.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isApproved = item.approvalStatus === 'Approved';
                  const isHold = item.approvalStatus === 'Hold';
                  const isPending = item.approvalStatus === 'Pending Approval';
                  const isQAVerified = item.checkedBy?.status === 'Verified';

                  return (
                    <tr key={item.tool.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {(safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)' }}>
                        {item.tool.toolNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.tool.productName || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Part #{item.tool.applicationPartNo || '—'} &bull; {item.tool.classification}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                          <span>{item.wearPct}% Used</span>
                          <span style={{ color: '#64748b' }}>{(item.tool.cumulative || 0).toLocaleString()} strokes</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${item.wearPct}%`,
                            height: '100%',
                            backgroundColor: item.wearPct >= 100 ? '#dc2626' : item.wearPct >= 80 ? '#f59e0b' : '#10b981',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                      </td>
                      <td>
                        {isQAVerified ? (
                          <div>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span>✓</span> Passed QA Check
                            </span>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                              By {item.checkedBy.name}
                            </div>
                          </div>
                        ) : item.checkedBy?.status === 'Revision Requested' ? (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#dc2626' }}>
                            ⚠️ Revision Requested
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Pending QA Check
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="badge badge-healthy">
                            <span className="badge-dot"></span>
                            Approved & Released
                          </span>
                        ) : isHold ? (
                          <span className="badge badge-danger">
                            <span className="badge-dot"></span>
                            On Hold
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <span className="badge-dot"></span>
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>
                        {item.approvedBy?.name || '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {item.approvedBy?.date || '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', maxWidth: '200px' }} title={item.approvedBy?.remarks || ''}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.approvedBy?.remarks || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleOpenApprove(item)}
                            title="Sign and authorize this tool for production release"
                            style={{
                              padding: '6px 11px',
                              fontSize: '11.5px',
                              backgroundColor: isApproved ? '#059669' : '#2563eb',
                              borderRadius: '5px'
                            }}
                          >
                            {isApproved ? 'Update Auth' : 'Authorize'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onNavigateToPM?.(item.tool.id)}
                            title="View Preventive Maintenance Checklist"
                            style={{ padding: '6px 10px', fontSize: '11.5px', borderRadius: '5px' }}
                          >
                            View PM
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
                ‹
              </button>

              {pageNumbers.map((item, idx) =>
                item === '...' ? (
                  <span key={`dots-${idx}`} className="pagination-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`pagination-btn ${item === safeCurrentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvingItem && (
        <div className="modal-backdrop show">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <span>Management Production Authorization (Approved By)</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setApprovingItem(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitApproval}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                    {approvingItem.tool.toolNo}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                    {approvingItem.tool.productName} (Part #{approvingItem.tool.applicationPartNo})
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                    <span>Stroke Wear: <strong>{approvingItem.wearPct}%</strong></span>
                    <span>QA Check: <strong style={{ color: approvingItem.checkedBy?.status === 'Verified' ? '#059669' : '#d97706' }}>{approvingItem.checkedBy?.status || 'Pending'}</strong></span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Authorization Decision *</label>
                  <select
                    className="form-select"
                    value={approvalForm.status}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Approved">✓ Approved & Released (Authorized for Production)</option>
                    <option value="Hold">⏸️ Hold (Overhaul / Inspection Correction Required)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Approved By (Lead / Plant Incharge Name) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={approvalForm.name}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter Approver Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Approval Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={approvalForm.date}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Authorization Remarks & Production Notes</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={approvalForm.remarks}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Release instructions, stroke cycle limits, or overhaul requirements..."
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setApprovingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: approvalForm.status === 'Approved' ? '#059669' : '#dc2626' }}>
                  {approvalForm.status === 'Approved' ? 'Authorize Tool Release' : 'Confirm Tool Hold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
