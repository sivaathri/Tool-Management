import React, { useState, useMemo, useEffect } from 'react';
import { getPMRecords, updateCheckedBySignOff } from '../../services/toolService';

export default function CheckedByView({ tools = [], onNavigateToPM, currentUser, showToast }) {
  const [pmRecords, setPMRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [signingItem, setSigningItem] = useState(null);
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

  // Combine tools with their PM and Checked By status
  const queueItems = useMemo(() => {
    return tools.map(t => {
      const cleanToolNo = (t.toolNo || '').toLowerCase().trim();
      const pm = pmRecords.find(p => 
        (p.toolId && p.toolId === t.id) || 
        (p.toolNo && p.toolNo.toLowerCase().trim() === cleanToolNo)
      );

      const hasInspection = !!(pm && Array.isArray(pm.items) && pm.items.length > 0);
      const checkedBy = pm?.checkedBy || null;

      let checkStatus = 'Pending Check';
      if (checkedBy?.status === 'Verified') {
        checkStatus = 'Verified';
      } else if (checkedBy?.status === 'Revision Requested') {
        checkStatus = 'Revision Requested';
      } else if (!hasInspection) {
        checkStatus = 'Awaiting Inspection';
      }

      return {
        tool: t,
        pmRecord: pm,
        hasInspection,
        checkStatus,
        checkedBy,
        checkDate: pm?.checkDate || pm?.date || '—',
        refNo: pm?.refNo || 'MFG/FR/075',
        checkPointsCount: pm?.items?.length || (t.checkPoints?.length || 0),
        actualConditionsEntered: pm?.items ? pm.items.filter(i => (i.actualCondition || '').trim().length > 0).length : 0
      };
    });
  }, [tools, pmRecords]);

  // KPIs
  const metrics = useMemo(() => {
    const total = queueItems.length;
    const pending = queueItems.filter(q => q.checkStatus === 'Pending Check').length;
    const verified = queueItems.filter(q => q.checkStatus === 'Verified').length;
    const revisions = queueItems.filter(q => q.checkStatus === 'Revision Requested').length;
    const awaiting = queueItems.filter(q => q.checkStatus === 'Awaiting Inspection').length;
    return { total, pending, verified, revisions, awaiting };
  }, [queueItems]);

  // Filter
  const filtered = useMemo(() => {
    return queueItems.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (item.tool.toolNo && item.tool.toolNo.toLowerCase().includes(q)) ||
        (item.tool.applicationPartNo && item.tool.applicationPartNo.toLowerCase().includes(q)) ||
        (item.tool.productName && item.tool.productName.toLowerCase().includes(q));

      const matchStatus = !statusFilter || item.checkStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [queueItems, searchTerm, statusFilter]);

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
    showToast?.(`QA Verification sign-off saved for ${signingItem.tool.toolNo}`, 'success');
  };

  return (
    <section className="view-section active" id="view-checked-by">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>QA Verification & Check (Checked By)</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--slate-500)', fontSize: '13px', marginTop: '4px' }}>
            Quality Assurance sign-off for Preventive Maintenance inspections and tooling checklist observations
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
        {/* Pending QA Check */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', backgroundColor: metrics.pending > 0 ? '#fffbeb' : '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.pending > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Pending QA Verification
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.pending > 0 ? '#d97706' : '#0f172a', marginTop: '6px' }}>
            {metrics.pending}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Inspected tooling awaiting QA sign-off
          </div>
        </div>

        {/* Verified & Passed */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Verified & Checked
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {metrics.verified}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            QA certified and approved checklists
          </div>
        </div>

        {/* Revisions Requested */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.revisions > 0 ? '#b91c1c' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Revision Requested
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.revisions > 0 ? '#dc2626' : '#0f172a', marginTop: '6px' }}>
            {metrics.revisions}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Returned to technician for rework
          </div>
        </div>

        {/* Awaiting Inspection */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #94a3b8' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Awaiting PM Inspection
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#334155', marginTop: '6px' }}>
            {metrics.awaiting}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Checklist not yet submitted
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">QA Verification Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Verification Statuses</option>
              <option value="Pending Check">Pending QA Check</option>
              <option value="Verified">Verified & Checked</option>
              <option value="Revision Requested">Revision Requested</option>
              <option value="Awaiting Inspection">Awaiting Inspection</option>
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
                <th>PM Check Date</th>
                <th>Inspection Points</th>
                <th style={{ textAlign: 'center' }}>Checked By Status</th>
                <th>QA Lead Name</th>
                <th>Verification Date</th>
                <th>QA Remarks</th>
                <th style={{ textAlign: 'center', width: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                      No verification records found
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>
                      Submit inspection records in Preventive Maintenance to populate the QA queue.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isVerified = item.checkStatus === 'Verified';
                  const isPending = item.checkStatus === 'Pending Check';
                  const isRevision = item.checkStatus === 'Revision Requested';

                  return (
                    <tr key={item.tool.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                        {item.checkDate}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: item.hasInspection ? '#059669' : '#94a3b8' }}>
                          {item.hasInspection ? `${item.actualConditionsEntered}/${item.checkPointsCount} Points Recorded` : 'No Checklist Yet'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isVerified ? (
                          <span className="badge badge-healthy">
                            <span className="badge-dot"></span>
                            Verified & Checked
                          </span>
                        ) : isRevision ? (
                          <span className="badge badge-danger">
                            <span className="badge-dot"></span>
                            Revision Needed
                          </span>
                        ) : isPending ? (
                          <span className="badge badge-warning">
                            <span className="badge-dot"></span>
                            Pending Check
                          </span>
                        ) : (
                          <span className="badge badge-neutral">
                            Awaiting PM
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>
                        {item.checkedBy?.name || '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {item.checkedBy?.date || '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', maxWidth: '200px' }} title={item.checkedBy?.remarks || ''}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.checkedBy?.remarks || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleOpenSign(item)}
                            title="Sign and verify this inspection checklist"
                            style={{
                              padding: '6px 11px',
                              fontSize: '11.5px',
                              backgroundColor: isVerified ? '#059669' : '#2563eb',
                              borderRadius: '5px'
                            }}
                          >
                            {isVerified ? 'Update Sign' : 'Sign & Verify'}
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
      </div>

      {/* Sign-off Modal */}
      {signingItem && (
        <div className="modal-backdrop show">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <span>QA Verification Sign-off (Checked By)</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setSigningItem(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitSign}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                    {signingItem.tool.toolNo}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                    {signingItem.tool.productName} (Part #{signingItem.tool.applicationPartNo})
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    Inspection Date: <strong>{signingItem.checkDate}</strong> &bull; Document Ref: <strong>{signingItem.refNo}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quality Assurance Verification Status *</label>
                  <select
                    className="form-select"
                    value={signForm.status}
                    onChange={(e) => setSignForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Verified">✓ Verified & Checked (Inspection Passed)</option>
                    <option value="Revision Requested">⚠️ Request Revision (Corrective Action Needed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Checked By (QA Lead Name) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signForm.name}
                    onChange={(e) => setSignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter QA Inspector / Lead Name"
                    required
                  />
                </div>

                <div className="form-group">
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
                  <label className="form-label">QA Verification Remarks & Notes</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={signForm.remarks}
                    onChange={(e) => setSignForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Detail verification results, gauge checks, and tool standard adherence..."
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSigningItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: signForm.status === 'Verified' ? '#059669' : '#dc2626' }}>
                  {signForm.status === 'Verified' ? 'Confirm QA Sign-off' : 'Submit Revision Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
