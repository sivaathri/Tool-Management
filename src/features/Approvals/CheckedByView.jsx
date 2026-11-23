import React, { useState, useMemo, useEffect } from 'react';
import { getPMRecords, updateCheckedBySignOff, sendPMToolsToApprovedBy } from '../../services/toolService';
import PMChecklistSheet from '../ServiceHistory/modals/PMChecklistSheet';

export default function CheckedByView({ tools = [], onNavigateToPM, currentUser, showToast }) {
  const [pmRecords, setPMRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [signingItem, setSigningItem] = useState(null);
  const [viewingTool, setViewingTool] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [signForm, setSignForm] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Verified',
    remarks: ''
  });

  const loadData = () => {
    setPMRecords(getPMRecords());
  };

  useEffect(() => {
    loadData();
  }, [tools]);

  // Combine ONLY tools that have an active PM record created or edited
  const queueItems = useMemo(() => {
    if (!Array.isArray(pmRecords) || pmRecords.length === 0) return [];

    const result = [];
    pmRecords.forEach(pm => {
      const cleanNo = (pm.toolNo || '').toLowerCase().trim();
      const existing = tools.find(t =>
        (pm.toolId && t.id === pm.toolId) ||
        (t.toolNo && t.toolNo.toLowerCase().trim() === cleanNo)
      );

      const toolObj = existing || {
        id: pm.toolId || `tool-${pm.toolNo}`,
        toolNo: pm.toolNo || 'INE T 0000',
        applicationPartNo: pm.applicationPartNo || pm.toolNo || '—',
        productName: pm.productName || pm.application || 'Tool',
        description: pm.description || pm.toolDescription || '',
        classification: pm.classification || 'Critical',
        toolCount: pm.toolCount || 1,
        lifetime: pm.lifetime || 100000,
        toolIssuedOn: pm.toolIssuedOn || pm.checkDate || new Date().toISOString().slice(0, 10),
        checkPoints: pm.items ? pm.items.map(i => i.checkPoint) : []
      };

      if (!result.some(r => r.tool.id === toolObj.id || r.tool.toolNo.toLowerCase().trim() === toolObj.toolNo.toLowerCase().trim())) {
        const checkedBy = pm.checkedBy || null;
        const approvedBy = pm.approvedBy || null;
        const isRejectedByMgmt = approvedBy?.status === 'Rejected';
        let checkStatus = 'Pending Check';
        if (isRejectedByMgmt) {
          checkStatus = 'Rejected by Mgmt';
        } else if (checkedBy?.status === 'Verified') {
          checkStatus = 'Verified';
        } else if (checkedBy?.status === 'Revision Requested') {
          checkStatus = 'Revision Requested';
        }

        result.push({
          tool: toolObj,
          pmRecord: pm,
          checkStatus,
          checkedBy,
          approvedBy,
          isRejectedByMgmt,
          mgmtRemarks: approvedBy?.remarks || '',
          sentToApprovedBy: Boolean(pm.sentToApprovedBy),
          sentToApprovedAt: pm.sentToApprovedAt || null,
          checkDate: pm.checkDate || pm.date || '—',
          nextDueDate: pm.nextDueDate || '—',
          refNo: pm.refNo || 'MFG/FR/075',
          checkPointsCount: pm.items ? pm.items.length : (toolObj.checkPoints ? toolObj.checkPoints.length : 0)
        });
      }
    });

    return result;
  }, [pmRecords, tools]);

  // KPIs matching Approved By layout
  const metrics = useMemo(() => {
    const total = queueItems.length;
    const pending = queueItems.filter(q => q.checkStatus === 'Pending Check').length;
    const verifiedReady = queueItems.filter(q => q.checkStatus === 'Verified' && !q.sentToApprovedBy).length;
    const sent = queueItems.filter(q => q.sentToApprovedBy).length;
    const revisions = queueItems.filter(q => q.checkStatus === 'Revision Requested').length;
    return { total, pending, verifiedReady, sent, revisions };
  }, [queueItems]);

  // Filters
  const filtered = useMemo(() => {
    return queueItems.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (item.tool.toolNo && item.tool.toolNo.toLowerCase().includes(q)) ||
        (item.tool.applicationPartNo && item.tool.applicationPartNo.toLowerCase().includes(q)) ||
        (item.tool.productName && item.tool.productName.toLowerCase().includes(q)) ||
        (item.tool.description && item.tool.description.toLowerCase().includes(q));

      let matchStatus = true;
      if (statusFilter === 'Pending Check') {
        matchStatus = item.checkStatus === 'Pending Check';
      } else if (statusFilter === 'VerifiedReady') {
        matchStatus = item.checkStatus === 'Verified' && !item.sentToApprovedBy;
      } else if (statusFilter === 'Sent') {
        matchStatus = item.sentToApprovedBy;
      } else if (statusFilter === 'Revision Requested') {
        matchStatus = item.checkStatus === 'Revision Requested';
      }

      return matchSearch && matchStatus;
    });
  }, [queueItems, searchTerm, statusFilter]);

  // Selectable items for sending to Approved By
  const selectableItems = useMemo(() => {
    return filtered.filter(i => i.checkStatus === 'Verified' && !i.sentToApprovedBy);
  }, [filtered]);

  const isAllSelected = selectableItems.length > 0 && selectableItems.every(i => selectedIds.includes(i.tool.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !selectableItems.some(i => i.tool.id === id)));
    } else {
      const newIds = selectableItems.map(i => i.tool.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const handleToggleSelect = (toolId) => {
    setSelectedIds(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSendBulkToApprovedBy = () => {
    if (selectedIds.length === 0) return;
    const count = sendPMToolsToApprovedBy(selectedIds, currentUser?.name || 'QA Lead');
    loadData();
    setSelectedIds([]);
    showToast?.(`Successfully sent ${count} verified PM tools to Management Authorization (Approved By)!`, 'success');
  };

  const handleSendSingle = (toolId, toolNo) => {
    const count = sendPMToolsToApprovedBy([toolId], currentUser?.name || 'QA Lead');
    loadData();
    setSelectedIds(prev => prev.filter(id => id !== toolId));
    showToast?.(`Sent ${toolNo} to Management Authorization (Approved By)!`, 'success');
  };

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

  const handleOpenSign = (item) => {
    setSigningItem(item);
    setSignForm({
      name: item.checkedBy?.name || currentUser?.name || 'Quality Assurance Lead',
      date: item.checkedBy?.date || new Date().toISOString().slice(0, 10),
      status: item.checkedBy?.status || 'Verified',
      remarks: item.checkedBy?.remarks || 'Inspected check points and observation verified OK as per engineering drawings.'
    });
  };

  const handleSubmitSign = (e) => {
    e.preventDefault();
    if (!signingItem) return;

    updateCheckedBySignOff(signingItem.tool.id, signForm);
    loadData();
    setSigningItem(null);
    showToast?.(`Checked By verification updated for ${signingItem.tool.toolNo}`, 'success');
  };

  return (
    <section className="view-section active" id="view-checked-by">
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Checked By</span>
          </h1>
        </div>
      </div>

      {/* KPI Cards (Exact Approved By layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* Pending QA Check */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', backgroundColor: metrics.pending > 0 ? '#fffbeb' : '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.pending > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Pending QA Check
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.pending > 0 ? '#d97706' : '#0f172a', marginTop: '6px' }}>
            {metrics.pending}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Awaiting QA checklist inspection
          </div>
        </div>

        {/* Verified (Ready to Send) */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7', backgroundColor: metrics.verifiedReady > 0 ? '#f0f9ff' : '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Verified (Ready to Send)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
            {metrics.verifiedReady}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Waiting to send to Approved By
          </div>
        </div>

        {/* Sent to Approved By */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Sent to Approved By
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {metrics.sent}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Forwarded for management release
          </div>
        </div>

        {/* Total Inspected Tooling */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total PM Inspected
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Tools with submitted PM
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
            <label className="form-label">QA Verification Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Verification Statuses</option>
              <option value="Pending Check">Pending QA Check</option>
              <option value="VerifiedReady">Verified (Ready to Send)</option>
              <option value="Sent">Sent to Approved By</option>
              <option value="Revision Requested">Revision Requested</option>
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

      {/* Bulk Send to Approved By Action Bar */}
      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          marginBottom: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(22, 101, 52, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: 600, fontSize: '13.5px' }}>
            <span style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '2px 10px',
              fontWeight: 800,
              fontSize: '12px'
            }}>
              {selectedIds.length}
            </span>
            <span>tool{selectedIds.length > 1 ? 's' : ''} selected &mdash; ready to send to Management Authorization (Approved By)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedIds([])}
              style={{ padding: '6px 14px', fontSize: '12.5px', backgroundColor: '#ffffff' }}
            >
              Clear Selection
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendBulkToApprovedBy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#059669',
                borderColor: '#059669',
                boxShadow: '0 2px 5px rgba(5, 150, 105, 0.3)'
              }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send to Approved By ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ margin: 0 }}>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '45px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    disabled={selectableItems.length === 0}
                    title={selectableItems.length === 0 ? 'No verified tools ready to send' : 'Select all verified tools ready to send'}
                    style={{
                      cursor: selectableItems.length === 0 ? 'not-allowed' : 'pointer',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                </th>
                <th style={{ textAlign: 'center', width: '55px' }}>SL.NO</th>
                <th style={{ width: '130px' }}>TOOL NO.</th>
                <th>APPLICATION & PRODUCT</th>
                <th>PM CHECK DATE</th>
                <th>NEXT DUE DATE</th>
                <th style={{ textAlign: 'center' }}>QA STATUS</th>
                <th>CHECKED BY</th>
                <th>VERIFICATION DATE</th>
                <th>QA REMARKS</th>
                <th style={{ textAlign: 'center', width: '170px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                      No verification records found
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>
                      Preventive Maintenance records will appear here after they are created or edited.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isVerified = item.checkStatus === 'Verified';
                  const isRevision = item.checkStatus === 'Revision Requested';
                  const isPending = item.checkStatus === 'Pending Check';
                  const isSent = Boolean(item.sentToApprovedBy);
                  const isSelectable = isVerified && !isSent;

                  return (
                    <tr key={item.tool.id || idx}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.tool.id)}
                          onChange={() => handleToggleSelect(item.tool.id)}
                          disabled={!isSelectable}
                          title={
                            isSent
                              ? 'Already sent to Approved By'
                              : !isVerified
                                ? 'Verify inspection before sending'
                                : 'Select to send to Approved By'
                          }
                          style={{
                            cursor: isSelectable ? 'pointer' : 'not-allowed',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {(safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#0f172a' }}>
                          {item.tool.toolNo}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.tool.productName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          Part #{item.tool.applicationPartNo || '—'} &bull; {item.tool.classification}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12.5px' }}>
                        {item.checkDate}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12.5px' }}>
                        {item.nextDueDate}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.isRejectedByMgmt ? (
                          <div>
                            <span className="badge badge-danger" style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
                              &bull; Rejected by Mgmt
                            </span>
                            {item.mgmtRemarks && (
                              <div style={{ fontSize: '10.5px', color: '#b91c1c', marginTop: '3px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.mgmtRemarks}>
                                Rework: "{item.mgmtRemarks}"
                              </div>
                            )}
                          </div>
                        ) : isSent ? (
                          <span className="badge" style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                            &bull; Sent to Approved By
                          </span>
                        ) : isVerified ? (
                          <span className="badge" style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>
                            &bull; Verified (Ready to Send)
                          </span>
                        ) : isRevision ? (
                          <span className="badge badge-danger" style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            &bull; Revision Requested
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            &bull; Pending QA Check
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                        {item.checkedBy?.name || '—'}
                      </td>
                      <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: '#475569' }}>
                        {item.checkedBy?.date || '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', maxWidth: '200px' }} className="truncate" title={item.checkedBy?.remarks || ''}>
                        {item.checkedBy?.remarks || '—'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setViewingTool(item.tool)}
                            style={{
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            View PM
                          </button>
                          {isSelectable && (
                            <button
                              type="button"
                              className="btn"
                              onClick={() => handleSendSingle(item.tool.id, item.tool.toolNo)}
                              title="Send immediately to Approved By"
                              style={{
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <span>Send</span>
                              <span>&rarr;</span>
                            </button>
                          )}
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
              <strong>{totalItems}</strong> records
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

      {/* View PM Checklist Sheet Modal */}
      {viewingTool && (
        <div className="modal-backdrop show" style={{ zIndex: 1100 }}>
          <div className="modal-card modal-xl" style={{ maxWidth: '1250px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">
                <span>Preventive Maintenance Checklist: {viewingTool.toolNo}</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewingTool(null)}
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <PMChecklistSheet
                tool={viewingTool}
                currentUser={currentUser}
                showToast={showToast}
              />
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingTool(null)}
              >
                Close
              </button>
              {(() => {
                const targetItem = queueItems.find(q => 
                  (viewingTool.id && q.tool.id === viewingTool.id) || 
                  (viewingTool.toolNo && q.tool.toolNo && q.tool.toolNo.toLowerCase().trim() === viewingTool.toolNo.toLowerCase().trim())
                );
                const isAlreadyVerified = targetItem?.checkStatus === 'Verified';

                return !isAlreadyVerified ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const activeName = currentUser?.name || currentUser?.username || 'Admin User';
                      const signData = {
                        name: activeName,
                        date: new Date().toISOString().slice(0, 10),
                        status: 'Verified',
                        remarks: 'Inspected check points and observation verified OK as per engineering drawings.'
                      };
                      updateCheckedBySignOff(viewingTool.id || viewingTool.toolNo, signData);
                      loadData();
                      setViewingTool(null);
                      showToast?.(`Checked By QA verification verified & signed by ${activeName} for ${viewingTool.toolNo}`, 'success');
                    }}
                    style={{
                      backgroundColor: '#16a34a',
                      padding: '8px 20px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                      borderRadius: '6px'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Verify & Sign</span>
                  </button>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* QA Sign-off Modal */}
      {signingItem && (
        <div className="modal-backdrop show" style={{ zIndex: 1150 }}>
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <span>QA Verification Sign-off (Checked By)</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSigningItem(null)}
                title="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitSign}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {signingItem.tool.toolNo} &bull; {signingItem.tool.productName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Part #{signingItem.tool.applicationPartNo} &bull; {signingItem.tool.classification}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">QA Verification Status *</label>
                  <select
                    className="form-select"
                    value={signForm.status}
                    onChange={(e) => setSignForm(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="Verified">Verified & Checked (Pass)</option>
                    <option value="Revision Requested">Revision Requested (Return to Technician)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Quality Assurance Lead Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signForm.name}
                    onChange={(e) => setSignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter QA Lead Name"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Verification Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={signForm.date}
                    onChange={(e) => setSignForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inspection & QA Remarks</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={signForm.remarks}
                    onChange={(e) => setSignForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Enter observation notes, verified dimensions, or rework instructions..."
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSigningItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: signForm.status === 'Verified' ? '#166534' : '#dc2626',
                    borderColor: signForm.status === 'Verified' ? '#166534' : '#dc2626'
                  }}
                >
                  {signForm.status === 'Verified' ? 'Confirm & Sign Verified' : 'Submit Revision Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
