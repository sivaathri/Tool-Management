import React from 'react';
import { formatNumber } from '../../../utils/formatters';

export default function ToolDossierModal({ tool, onClose }) {
  if (!tool) return null;

  const pct = Math.min(100, Math.round((tool.cumulative / (tool.lifetime || 1)) * 100));
  const isCritical = tool.classification === 'Critical';

  return (
    <div className="modal-backdrop show" id="modalToolDossier">
      <div className="modal-card modal-lg">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="dossierToolTitle">
              {tool.toolNo} — Digital Tool Master Dossier
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }} id="dossierToolSubtitle">
              Complete specifications, inspection check points, and lifecycle wear status
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '24px' }}>
          
          {/* Key Lifecycle Utilization Card */}
          <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <span style={{ color: 'var(--slate-700)' }}>Life Cycle Wear: <strong>{pct}%</strong></span>
              <span style={{ color: 'var(--accent-700)', fontFamily: 'var(--font-mono)' }}>Cycle Count: <strong>{tool.toolCount ?? 0}</strong></span>
            </div>
            <div className="progress-bar-wrap" style={{ height: '8px' }}>
              <div
                className={`progress-bar-fill ${pct >= 100 ? 'progress-danger' : pct >= 80 ? 'progress-warning' : 'progress-healthy'}`}
                style={{ width: `${pct}%` }}
              ></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Cumulative Output</div>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{formatNumber(tool.cumulative)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Remaining Balance</div>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px', color: tool.balance <= 0 ? '#dc2626' : '#059669' }}>
                  {formatNumber(tool.balance)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Rated Lifetime Limit</div>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{formatNumber(tool.lifetime)}</div>
              </div>
            </div>
          </div>

          {/* Master Specifications */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--slate-600)', marginBottom: '10px', fontWeight: 700 }}>
              Master Specifications
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', background: '#fff', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>Application Part No (Parent)</div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#1e40af', marginTop: '2px' }}>
                  {tool.applicationPartNo}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>Tool Number (Child)</div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-600)', marginTop: '2px' }}>
                  {tool.toolNo}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>Product Name</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-800)', marginTop: '2px' }}>
                  {tool.productName || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>Issued On</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--slate-700)', marginTop: '2px' }}>
                  {tool.toolIssuedOn || '—'}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>Description</div>
                <div style={{ fontSize: '13.5px', color: 'var(--slate-700)', marginTop: '2px' }}>
                  {tool.description || 'No description entered.'}
                </div>
              </div>
            </div>
          </div>

          {/* Check Points Matrix */}
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--slate-600)', marginBottom: '10px', fontWeight: 700 }}>
              Inspection Check Points ({tool.checkPoints?.length || 0})
            </h4>
            <div className="table-responsive" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="enterprise-table" style={{ margin: 0, fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--slate-100)' }}>
                    <th style={{ width: '70px', textAlign: 'center' }}>S.no</th>
                    <th>Check Point Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(!tool.checkPoints || tool.checkPoints.length === 0) ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: 'var(--slate-400)' }}>
                        No check points configured for this tool.
                      </td>
                    </tr>
                  ) : (
                    tool.checkPoints.map((cp, idx) => (
                      <tr key={idx}>
                        <td style={{ width: '70px', textAlign: 'center', fontWeight: 700, color: 'var(--slate-600)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ color: 'var(--slate-800)', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                          {cp}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
