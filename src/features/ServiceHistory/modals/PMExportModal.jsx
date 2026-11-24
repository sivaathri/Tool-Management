import React, { useState } from 'react';
import {
  exportSinglePMChecklistPDF,
  exportToolAllPMHistoryPDF,
  exportPMChecklistOnlyCSV,
  exportToolAllPMHistoryCSV
} from '../../../utils/pmChecklistExport';

export default function PMExportModal({
  isOpen = true,
  onClose,
  tool,
  currentPMRecord = null,
  showToast
}) {
  if (!isOpen || !tool) return null;

  const [selectedFormat, setSelectedFormat] = useState('pdf');    // 'pdf' or 'excel'
  const [selectedScope, setSelectedScope] = useState('all');      // 'all' (all PM of this tool) or 'current' (current PM)
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const historyCount = Array.isArray(currentPMRecord?.history) ? currentPMRecord.history.length : 0;
  const totalInspections = historyCount + 1; // All historical revisions + current active PM

  const handleExecuteExport = async () => {
    setIsExporting(true);
    setProgressMsg('Preparing PM export for ' + tool.toolNo + '...');

    try {
      if (selectedFormat === 'pdf') {
        if (selectedScope === 'all') {
          setProgressMsg(`Generating multi-page PDF for all ${totalInspections} inspections of ${tool.toolNo}...`);
          await exportToolAllPMHistoryPDF(tool, currentPMRecord, (msg) => {
            setProgressMsg(msg);
          });
          showToast?.(`All PM inspections (${totalInspections} records) for ${tool.toolNo} exported to PDF!`, 'success');
        } else {
          setProgressMsg(`Generating PDF for ${tool.toolNo} active PM...`);
          await exportSinglePMChecklistPDF(tool, currentPMRecord);
          showToast?.(`Current PM Checklist for ${tool.toolNo} exported to PDF!`, 'success');
        }
      } else {
        // Excel / CSV format
        if (selectedScope === 'all') {
          exportToolAllPMHistoryCSV(tool, currentPMRecord);
          showToast?.(`All PM inspection records for ${tool.toolNo} exported to Excel (.csv)!`, 'success');
        } else {
          exportPMChecklistOnlyCSV(tool, currentPMRecord);
          showToast?.(`Current PM Checklist for ${tool.toolNo} exported to Excel (.csv)!`, 'success');
        }
      }
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      showToast?.('Export failed: ' + (err.message || 'Unknown error'), 'danger');
    } finally {
      setIsExporting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="modal-backdrop show" style={{ zIndex: 1050 }}>
      <div className="modal-card" style={{ maxWidth: '540px', width: '92%' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '16.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Export PM Checklist &bull; {tool.toolNo}
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                MFG/FR/075 &bull; Official ISO/Plant Inspection Sheet
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isExporting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Step 1: Format Selection (Excel or PDF) */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              1. Select Export Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              
              {/* PDF Option */}
              <div
                onClick={() => !isExporting && setSelectedFormat('pdf')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: selectedFormat === 'pdf' ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                  backgroundColor: selectedFormat === 'pdf' ? '#eff6ff' : '#ffffff',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '11px'
                  }}>
                    PDF
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>PDF Document</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>A4 Landscape Sheet</div>
                  </div>
                </div>
                {selectedFormat === 'pdf' && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px'
                  }}>
                    ✓
                  </span>
                )}
              </div>

              {/* Excel Option */}
              <div
                onClick={() => !isExporting && setSelectedFormat('excel')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: selectedFormat === 'excel' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                  backgroundColor: selectedFormat === 'excel' ? '#f0fdf4' : '#ffffff',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '11px'
                  }}>
                    XLS
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Excel (.csv)</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Structured Data</div>
                  </div>
                </div>
                {selectedFormat === 'excel' && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px'
                  }}>
                    ✓
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Step 2: Scope Selection (Current PM vs All PM of this tool) */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              2. Select Scope for {tool.toolNo}
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Option 1: Current PM Only */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '13px 15px',
                  borderRadius: '8px',
                  border: selectedScope === 'current' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: selectedScope === 'current' ? '#eff6ff' : '#ffffff',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="toolPMScope"
                  checked={selectedScope === 'current'}
                  onChange={() => setSelectedScope('current')}
                  disabled={isExporting}
                  style={{ marginTop: '3px', accentColor: '#2563eb' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
                      Current PM
                    </span>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: '10px',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd'
                    }}>
                      Active Inspection
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                    Exports only the latest active Preventive Maintenance checklist for {tool.toolNo}.
                  </div>
                </div>
              </label>

              {/* Option 2: All PM of this Tool */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '13px 15px',
                  borderRadius: '8px',
                  border: selectedScope === 'all' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: selectedScope === 'all' ? '#eff6ff' : '#ffffff',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="toolPMScope"
                  checked={selectedScope === 'all'}
                  onChange={() => setSelectedScope('all')}
                  disabled={isExporting}
                  style={{ marginTop: '3px', accentColor: '#2563eb' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
                      All PM of this Tool
                    </span>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: '10px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #bbf7d0'
                    }}>
                      {totalInspections} {totalInspections === 1 ? 'Inspection' : 'Inspections'} &bull; 1 PM per page
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                    {selectedFormat === 'pdf'
                      ? `Exports all past revision records and active PM inspection for ${tool.toolNo} (Each inspection on its own page with PM checklist and photos).`
                      : `Exports all past revision records and active PM data for ${tool.toolNo} in a single spreadsheet.`}
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* Progress / Loading Banner */}
          {isExporting && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12.5px',
              color: '#1e40af',
              fontWeight: 600
            }}>
              <span className="spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid #bfdbfe',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite'
              }}></span>
              <span>{progressMsg}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '6px'
            }}
          >
            Cancel
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExecuteExport}
            disabled={isExporting}
            style={{
              backgroundColor: selectedFormat === 'excel' ? '#16a34a' : '#2563eb',
              padding: '8px 22px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedFormat === 'excel' ? '0 2px 6px rgba(22, 163, 74, 0.25)' : '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>
              {isExporting ? 'Generating...' : `Export ${selectedScope === 'all' ? 'All PM' : 'Current PM'} (${selectedFormat.toUpperCase()})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
