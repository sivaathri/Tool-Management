import React, { useState } from 'react';

export default function ExportReportModal({ isOpen = true, onClose, onExportExcel, onExportPDF, tool }) {
  if (!isOpen) return null;

  const [selectedFormat, setSelectedFormat] = useState('excel'); // 'excel' or 'pdf'

  const handleConfirm = () => {
    if (selectedFormat === 'excel') {
      onExportExcel();
    } else {
      onExportPDF();
    }
    onClose();
  };

  return (
    <div className="modal-backdrop show" id="modalExportReport">
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Export PM Report
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                {tool ? `Export data for tool ${tool.toolNo}` : 'Select export format'}
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

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-700)' }}>
            Choose preferred format to download or print:
          </div>

          {/* Option 1: Excel */}
          <div
            onClick={() => setSelectedFormat('excel')}
            style={{
              padding: '16px 18px',
              borderRadius: '10px',
              border: selectedFormat === 'excel' ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
              backgroundColor: selectedFormat === 'excel' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              transition: 'all 0.18s ease',
              boxShadow: selectedFormat === 'excel' ? '0 4px 12px rgba(22, 163, 74, 0.12)' : 'none'
            }}
          >
            {/* Excel Icon */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#166534' }}>
                  Excel Spreadsheet (.csv / .xlsx)
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#bbf7d0',
                  color: '#166534'
                }}>
                  Instant Download
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.45 }}>
                Structured tabular file with full tool metadata, inspection check points, specs, and complete cycle production records.
              </div>
            </div>

            {/* Radio / Check indicator */}
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: selectedFormat === 'excel' ? '6px solid #16a34a' : '2px solid #cbd5e1',
              backgroundColor: '#ffffff',
              flexShrink: 0,
              marginTop: '2px'
            }}></div>
          </div>

          {/* Option 2: PDF Document */}
          <div
            onClick={() => setSelectedFormat('pdf')}
            style={{
              padding: '16px 18px',
              borderRadius: '10px',
              border: selectedFormat === 'pdf' ? '2px solid #dc2626' : '1.5px solid #e2e8f0',
              backgroundColor: selectedFormat === 'pdf' ? '#fef2f2' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              transition: 'all 0.18s ease',
              boxShadow: selectedFormat === 'pdf' ? '0 4px 12px rgba(220, 38, 38, 0.12)' : 'none'
            }}
          >
            {/* PDF Icon */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M10 12h4"></path>
                <path d="M10 16h4"></path>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b' }}>
                  PDF Document (.pdf)
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: '#fecaca',
                  color: '#991b1b'
                }}>
                  Print / Save PDF
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.45 }}>
                Print-ready Preventive Maintenance checklist sheet and production log formatted according to company ISO/MFG layout.
              </div>
            </div>

            {/* Radio / Check indicator */}
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: selectedFormat === 'pdf' ? '6px solid #dc2626' : '2px solid #cbd5e1',
              backgroundColor: '#ffffff',
              flexShrink: 0,
              marginTop: '2px'
            }}></div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 24px', backgroundColor: 'var(--slate-50)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '9px 18px', fontSize: '13px' }}>
            Cancel
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{
              backgroundColor: selectedFormat === 'excel' ? '#16a34a' : '#2563eb',
              borderColor: selectedFormat === 'excel' ? '#16a34a' : '#2563eb',
              padding: '9px 24px',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedFormat === 'excel' 
                ? '0 2px 8px rgba(22, 163, 74, 0.3)' 
                : '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            {selectedFormat === 'excel' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download Excel File</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Open PDF / Print</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
