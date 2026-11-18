import React, { useState, useMemo } from 'react';
import { formatNumber } from '../../data/storage';

function formatMonthName(monthStr) {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  return monthStr;
}

function getNextMonth(monthStr) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  const [yearStr, monthStrPart] = monthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStrPart, 10);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export default function AddProductionModal({ tool, existingLogs = [], onClose, onSave }) {
  const activeCycle = tool?.toolCount || 0;

  // Collect existing months recorded for this tool in the current active cycle
  const existingMonths = useMemo(() => {
    return (existingLogs || [])
      .filter(l => (l.cycle !== undefined && l.cycle !== null ? Number(l.cycle) : 0) === activeCycle)
      .map(l => (l.month || l.date || '').slice(0, 7))
      .filter(m => /^\d{4}-\d{2}$/.test(m));
  }, [existingLogs, activeCycle]);

  // Determine latest recorded month and default to the NEXT month
  const initialMonth = useMemo(() => {
    if (existingMonths.length > 0) {
      const sorted = [...existingMonths].sort();
      const latest = sorted[sorted.length - 1];
      return getNextMonth(latest);
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [existingMonths]);

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [quantity, setQuantity] = useState('');
  const [operator, setOperator] = useState('Machine Operator');
  const [error, setError] = useState('');

  if (!tool) return null;

  const isMonthDuplicate = existingMonths.includes(selectedMonth);

  const currentCum = tool.cumulative || 0;
  const numQty = parseInt(quantity, 10) || 0;
  const projectedCum = currentCum + numQty;
  const projectedBal = (tool.lifetime || 0) - projectedCum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMonthDuplicate) {
      setError(`An entry for ${formatMonthName(selectedMonth)} already exists for this tool in Cycle ${activeCycle}. Only one entry per month is permitted.`);
      return;
    }

    if (!numQty || numQty <= 0) {
      setError('Please enter a valid quantity made greater than 0.');
      return;
    }

    onSave({
      toolId: tool.id,
      toolNo: tool.toolNo,
      date: `${selectedMonth}-01`,
      month: selectedMonth,
      quantity: numQty,
      cycle: activeCycle,
      operator: operator.trim() || 'Operator',
      notes: ''
    });
  };

  return (
    <div className="modal-backdrop show" id="modalAddProduction">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
           
            <span>Log Monthly Production Output</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Active Tool Target:</div>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)', marginTop: '2px' }}>
                {tool.toolNo} <span style={{ fontSize: '12px', color: 'var(--slate-600)', fontWeight: 500 }}>(Part #{tool.applicationPartNo} - {tool.productName})</span>
              </div>
            </div>

            {isMonthDuplicate && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1.5px solid #f87171',
                borderRadius: 'var(--radius-md)',
                color: '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <strong>{formatMonthName(selectedMonth)}</strong> is already recorded for <strong>{tool.toolNo}</strong>. Only <strong>one entry per month</strong> is allowed. Please select the next unrecorded month.
                </div>
              </div>
            )}

            {error && !isMonthDuplicate && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '12.5px' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="inpProdMonth">
                Production Month *
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 400, marginLeft: '6px' }}>
                  (1 entry per month)
                </span>
              </label>
              <input
                type="month"
                className="form-input"
                id="inpProdMonth"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setError('');
                }}
                style={{
                  borderColor: isMonthDuplicate ? '#ef4444' : undefined,
                  backgroundColor: isMonthDuplicate ? '#fff5f5' : undefined,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
                required
              />
              <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                Target: <strong>{formatMonthName(selectedMonth)}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="inpProdQty">Quantity Made (Strokes / Output) *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                id="inpProdQty"
                placeholder="e.g. 75995"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="inpProdOperator">Recorded By / Operator</label>
              <input
                type="text"
                className="form-input"
                id="inpProdOperator"
                placeholder="e.g. Tool Room Supervisor / Operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              />
            </div>

            {/* Projection preview */}
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-600)' }}>
                <span>Current Cumulative:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(currentCum)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-700)' }}>
                <span>Projected Cumulative:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(projectedCum)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', marginTop: '2px', color: projectedBal <= 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                <span>Projected Remaining Balance:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(projectedBal)}</strong>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isMonthDuplicate || !numQty || numQty <= 0}
              style={{
                backgroundColor: isMonthDuplicate ? '#94a3b8' : '#059669',
                cursor: isMonthDuplicate ? 'not-allowed' : 'pointer',
                opacity: isMonthDuplicate ? 0.7 : 1
              }}
            >
              Save Production Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
