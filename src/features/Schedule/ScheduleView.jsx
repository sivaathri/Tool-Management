import React, { useState, useMemo, useEffect } from 'react';
import { getSchedules, saveSchedule } from '../../services/toolService';

export default function ScheduleView({ tools = [], onNavigateToPM, showToast }) {
  const [schedules, setSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    const list = getSchedules();
    setSchedules(list);
  };

  useEffect(() => {
    loadData();
  }, [tools]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = schedules.length;
    const overdue = schedules.filter(s => s.status === 'Overdue').length;
    const dueSoon = schedules.filter(s => s.status === 'Due Soon').length;
    const onTrack = schedules.filter(s => s.status === 'On Track').length;
    return { total, overdue, dueSoon, onTrack };
  }, [schedules]);

  // Filtering
  const filtered = useMemo(() => {
    return schedules.filter(s => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (s.toolNo && s.toolNo.toLowerCase().includes(q)) ||
        (s.applicationPartNo && s.applicationPartNo.toLowerCase().includes(q)) ||
        (s.productName && s.productName.toLowerCase().includes(q));

      const matchStatus = !statusFilter || s.status === statusFilter;
      const matchClass = !classificationFilter || s.classification === classificationFilter;

      return matchSearch && matchStatus && matchClass;
    });
  }, [schedules, searchTerm, statusFilter, classificationFilter]);

  const handleOpenEdit = (item) => {
    setEditingSchedule({
      ...item,
      frequency: item.frequency || 'Quarterly (3 Months)',
      nextDueDate: item.nextDueDate || new Date().toISOString().slice(0, 10),
      assignedInspector: item.assignedInspector || 'Tool Room Lead',
      priority: item.priority || (item.classification === 'Critical' ? 'High' : 'Normal'),
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!editingSchedule) return;

    saveSchedule(editingSchedule);
    loadData();
    setIsModalOpen(false);
    setEditingSchedule(null);
    showToast?.(`Schedule updated for tool ${editingSchedule.toolNo}`, 'success');
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast?.('No schedule records to export', 'info');
      return;
    }
    const headers = ['Sl.No', 'Tool No', 'Application Part No', 'Product Name', 'Classification', 'Frequency', 'Last PM Date', 'Next Due Date', 'Status', 'Days Remaining', 'Assigned Inspector', 'Priority'];
    const rows = filtered.map((s, idx) => [
      idx + 1,
      `"${s.toolNo}"`,
      `"${s.applicationPartNo || ''}"`,
      `"${(s.productName || '').replace(/"/g, '""')}"`,
      `"${s.classification || 'Non-Critical'}"`,
      `"${s.frequency || ''}"`,
      `"${s.lastCheckDate || ''}"`,
      `"${s.nextDueDate || ''}"`,
      `"${s.status || ''}"`,
      s.daysRemaining ?? '',
      `"${(s.assignedInspector || '').replace(/"/g, '""')}"`,
      `"${s.priority || 'Normal'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `PM_Maintenance_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('PM Schedule exported successfully (.csv)', 'success');
  };

  return (
    <section className="view-section active" id="view-schedule">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Preventive Maintenance Schedule</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--slate-500)', fontSize: '13px', marginTop: '4px' }}>
            Track and manage tool inspection calendars, cycle due dates, and frequency intervals
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              backgroundColor: '#2563eb'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Schedule (.csv)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* Total Scheduled */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Tools Scheduled
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Active tooling under PM program
          </div>
        </div>

        {/* Overdue */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444', backgroundColor: metrics.overdue > 0 ? '#fef2f2' : '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.overdue > 0 ? '#b91c1c' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Overdue Inspections
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.overdue > 0 ? '#dc2626' : '#0f172a', marginTop: '6px' }}>
            {metrics.overdue}
          </div>
          <div style={{ fontSize: '12px', color: metrics.overdue > 0 ? '#b91c1c' : '#64748b', marginTop: '4px' }}>
            {metrics.overdue > 0 ? 'Requires immediate PM check!' : 'No overdue tooling'}
          </div>
        </div>

        {/* Due Soon */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', backgroundColor: metrics.dueSoon > 0 ? '#fffbeb' : '#ffffff' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: metrics.dueSoon > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Due Within 7 Days
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: metrics.dueSoon > 0 ? '#d97706' : '#0f172a', marginTop: '6px' }}>
            {metrics.dueSoon}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Prepare inspection check sheet
          </div>
        </div>

        {/* On Track */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            On Track / Healthy
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {metrics.onTrack}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Within valid service interval
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
            <label className="form-label">Schedule Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Schedule Statuses</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon (&le; 7 Days)</option>
              <option value="On Track">On Track</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Classification</label>
            <select
              className="form-select"
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
            >
              <option value="">All Classifications</option>
              <option value="Critical">Critical</option>
              <option value="Non-Critical">Non-Critical</option>
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
                setClassificationFilter('');
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
                <th>Classification</th>
                <th>Frequency</th>
                <th>Last Inspection</th>
                <th>Next Due Date</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th style={{ textAlign: 'center' }}>Schedule Status</th>
                <th style={{ textAlign: 'center', width: '190px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                      No tooling found matching schedule criteria
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>
                      Add tools in Master List to auto-schedule preventive maintenance.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isOverdue = item.status === 'Overdue';
                  const isDueSoon = item.status === 'Due Soon';

                  return (
                    <tr key={item.id || item.toolId || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)' }}>
                        {item.toolNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.productName || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Part #{item.applicationPartNo || '—'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${item.classification === 'Critical' ? 'badge-danger' : 'badge-neutral'}`}>
                          {item.classification || 'Non-Critical'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                        {item.frequency || 'Quarterly'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {item.lastCheckDate || '—'}
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isOverdue ? '#dc2626' : '#0f172a' }}>
                          {item.nextDueDate}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>
                          {isOverdue ? (
                            <span style={{ color: '#dc2626' }}>
                              🚨 Overdue ({Math.abs(item.daysRemaining)}d ago)
                            </span>
                          ) : isDueSoon ? (
                            <span style={{ color: '#d97706' }}>
                              ⚠️ Due in {item.daysRemaining} days
                            </span>
                          ) : (
                            <span style={{ color: '#059669' }}>
                              ✓ In {item.daysRemaining} days
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: item.priority === 'Urgent' ? '#fee2e2' : item.priority === 'High' ? '#fef3c7' : '#f1f5f9',
                          color: item.priority === 'Urgent' ? '#b91c1c' : item.priority === 'High' ? '#b45309' : '#475569'
                        }}>
                          {item.priority || 'Normal'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        {item.assignedInspector || 'Tool Room Lead'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isOverdue ? (
                          <span className="badge badge-danger">
                            <span className="badge-dot"></span>
                            Overdue
                          </span>
                        ) : isDueSoon ? (
                          <span className="badge badge-warning">
                            <span className="badge-dot"></span>
                            Due Soon
                          </span>
                        ) : (
                          <span className="badge badge-healthy">
                            <span className="badge-dot"></span>
                            On Track
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit PM Schedule dates & frequency"
                            style={{ padding: '6px 10px', fontSize: '11.5px', borderRadius: '5px' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onNavigateToPM?.(item.toolId)}
                            title="Open Preventive Maintenance sheet for this tool"
                            style={{
                              padding: '6px 12px',
                              fontSize: '11.5px',
                              backgroundColor: '#2563eb',
                              borderRadius: '5px'
                            }}
                          >
                            Open PM
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

      {/* Edit Schedule Modal */}
      {isModalOpen && editingSchedule && (
        <div className="modal-backdrop show">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <span>Update PM Schedule: {editingSchedule.toolNo}</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveModal}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{editingSchedule.toolNo}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {editingSchedule.productName} (Part #{editingSchedule.applicationPartNo})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Next Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingSchedule.nextDueDate}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, nextDueDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inspection Frequency</label>
                  <select
                    className="form-select"
                    value={editingSchedule.frequency}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Monthly (2 Months)">Bi-Monthly (2 Months)</option>
                    <option value="Quarterly (3 Months)">Quarterly (3 Months)</option>
                    <option value="Half-Yearly (6 Months)">Half-Yearly (6 Months)</option>
                    <option value="Annually">Annually</option>
                    <option value="50,000 Strokes">Every 50,000 Strokes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Inspector / Lead</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingSchedule.assignedInspector}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, assignedInspector: e.target.value }))}
                    placeholder="e.g. Tool Maintenance Lead"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={editingSchedule.priority}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduling Notes / Instructions</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={editingSchedule.notes}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special inspection requirements, tooling calibration notes..."
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2563eb' }}>
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
