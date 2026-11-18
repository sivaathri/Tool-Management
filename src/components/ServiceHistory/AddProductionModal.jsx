import React, { useState } from 'react';
import { formatNumber } from '../../data/storage';

export default function AddProductionModal({ tool, onClose, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [operator, setOperator] = useState('Machine Operator');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!tool) return null;

  const currentCum = tool.cumulative || 0;
  const numQty = parseInt(quantity, 10) || 0;
  const projectedCum = currentCum + numQty;
  const projectedBal = (tool.lifetime || 0) - projectedCum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numQty || numQty <= 0) {
      setError('Please enter a valid production quantity greater than 0.');
      return;
    }

    onSave({
      toolId: tool.id,
      toolNo: tool.toolNo,
      date,
      quantity: numQty,
      operator: operator.trim() || 'Operator',
      notes: notes.trim()
    });
  };

  return (
    <div className="modal-backdrop show" id="modalAddProduction">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Log Monthly Production Output</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
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

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '12.5px' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="inpProdDate">Production Month / Date *</label>
              <input
                type="date"
                className="form-input"
                id="inpProdDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="inpProdQty">Quantity Made *</label>
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

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="inpProdRemarks">Shift / Machine Remarks</label>
              <input
                type="text"
                className="form-input"
                id="inpProdRemarks"
                placeholder="e.g. Shift 1 regular production run"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }}>
              Save Production Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
