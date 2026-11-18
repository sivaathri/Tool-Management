import React, { useState } from 'react';
import { formatNumber } from '../../data/storage';

export default function ToolReplacementModal({ tool, isOpen = true, onClose, onConfirm }) {
  if (!isOpen || !tool) return null;

  const currentCycle = tool.toolCount || 0;
  const nextCycle = currentCycle + 1;
  const pct = Math.round((tool.cumulative / (tool.lifetime || 1)) * 100);
  const isOverLimit = tool.cumulative >= (tool.lifetime || 0);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newLifetimeLimit, setNewLifetimeLimit] = useState(tool.lifetime || 200000);
  const [replacedBy, setReplacedBy] = useState('Tool Room Lead');
  const [remarks, setRemarks] = useState(
    isOverLimit 
      ? `Tool reached rated limit of ${formatNumber(tool.lifetime)} strokes. Replaced with fresh tool set.` 
      : 'Tool overhauled/replaced with fresh die set.'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      date,
      replacedBy: replacedBy.trim() || 'Tool Room Lead',
      remarks: remarks.trim(),
      newLifetimeLimit: Number(newLifetimeLimit) || tool.lifetime || 200000
    });
  };

  return (
    <div className="modal-backdrop show" id="modalToolReplacement">
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Record Tool Replacement
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                Advance lifecycle to start a fresh production cycle
              </div>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Tool Summary Card inside modal */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-700)', fontFamily: 'var(--font-mono)' }}>
                  {tool.toolNo}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: isOverLimit ? '#fee2e2' : '#fef3c7',
                  color: isOverLimit ? '#dc2626' : '#b45309'
                }}>
                  {pct}% Used ({tool.status})
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginBottom: '10px' }}>
                Part #{tool.applicationPartNo} • {tool.productName}
              </div>

              {/* Cycle Transition Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Retiring Cycle</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>Cycle {currentCycle}</div>
                  <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatNumber(tool.cumulative)} output</div>
                </div>

                <div style={{ color: 'var(--slate-400)', fontWeight: 800, fontSize: '16px' }}>➔</div>

                <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '10.5px', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>New Fresh Cycle</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>Cycle {nextCycle}</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>0 (Fresh Start)</div>
                </div>
              </div>
            </div>

            {/* Replacement Date */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Replacement Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            {/* Change / Update Life Time Limit for Fresh Cycle */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>
                  Life Time Limit (Stroke / Cycle Limit) *
                </label>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                  Current: {formatNumber(tool.lifetime)}
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                className="form-control"
                value={newLifetimeLimit}
                onChange={(e) => setNewLifetimeLimit(e.target.value)}
                required
                placeholder="Enter life time limit (e.g. 200000)"
                style={{ fontSize: '13.5px', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1e40af' }}
              />
              <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                Edit this if the replacement tool set has a different stroke limit. Clicking OK will reset cumulative to 0 with this limit.
              </div>
            </div>

            {/* Replaced By */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Authorized By / Technician
              </label>
              <input
                type="text"
                className="form-control"
                value={replacedBy}
                onChange={(e) => setReplacedBy(e.target.value)}
                placeholder="e.g. Tool Room Lead / Maintenance Engineer"
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            {/* Remarks / Reason */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                Replacement Reason & Remarks
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes regarding tool replacement, inspection condition, or regrind..."
                style={{ fontSize: '12.5px', padding: '8px 12px', resize: 'vertical' }}
              />
            </div>

            {/* History Preservation Notice */}
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '11.5px',
              color: '#1e40af',
              lineHeight: 1.45,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ fontSize: '14px', marginTop: '-1px' }}>🔒</span>
              <div>
                <strong>Old records are completely preserved:</strong> All {formatNumber(tool.cumulative)} output records from Cycle {currentCycle} will remain accessible anytime under the cycle history tab. Starting fresh will reset active cumulative to 0 and balance to {formatNumber(tool.lifetime)}.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ padding: '12px 24px', backgroundColor: 'var(--slate-50)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px' }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                backgroundColor: '#059669',
                padding: '8px 22px',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>OK - Reset & Start Fresh Cycle</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
