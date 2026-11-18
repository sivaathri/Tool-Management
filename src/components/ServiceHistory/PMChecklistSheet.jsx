import React, { useState, useEffect } from 'react';
import { getPMRecords, savePMRecord, deletePMRecord } from '../../data/storage';

export default function PMChecklistSheet({ tool, showToast }) {
  if (!tool) return null;

  // Format today's date (YYYY-MM-DD)
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  
  // Format date 3 months from now (YYYY-MM-DD)
  const getNextDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  };

  // Helper to provide standard checking method and specification based on checkpoint description
  const getMethodAndSpec = (pointText) => {
    const p = (pointText || '').toUpperCase();
    if (p.includes('COIL LOCATOR') || p.includes('COUPLER LOCATOR') || p.includes('WIRE GUIDE')) {
      if (p.includes('PLAY')) {
        return { method: 'Visual', specification: 'Free from play', sampleActual: 'Locator OK' };
      }
      return { method: 'Visual', specification: 'Free from chip off and damages', sampleActual: 'Free from Damages' };
    }
    if (p.includes('IDENTIFICATION NUMBER') || p.includes('TOOL NUMBER') || p.includes('PUNCH') || p.includes('DIE NUMBER')) {
      return { method: 'Visual', specification: 'As per Master List', sampleActual: tool.toolNo };
    }
    if (p.includes('BURR') || p.includes('SHARPNESS') || p.includes('CUTTING EDGE')) {
      return { method: 'Visual / Gauge', specification: 'Burr < 0.05mm / Sharp', sampleActual: 'Burr within 0.03mm' };
    }
    if (p.includes('CLEARANCE') || p.includes('GAP')) {
      return { method: 'Feeler Gauge', specification: 'As per tool drawing', sampleActual: 'Gap OK' };
    }
    return { method: 'Visual', specification: 'Free from chip off and damages', sampleActual: 'Free from Damage' };
  };

  // Default rows derived from tool checkPoints or industrial standards
  const createDefaultRows = () => {
    const rawPoints = Array.isArray(tool.checkPoints) && tool.checkPoints.length > 0
      ? tool.checkPoints
      : [
          'CHECK COIL LOCATOR FOR ANY DAMAGES',
          'CHECK COUPLER LOCATOR FOR ANY DAMAGES',
          'CHECK COUPLER LOCATOR ANY PLAY',
          'CHECK WIRE GUIDE FOR ANY DAMAGES',
          'ENSURE TOOL IDENTIFICATION NUMBER'
        ];

    return rawPoints.map((cp, idx) => {
      const text = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
      const { method, specification } = getMethodAndSpec(text);
      return {
        sno: idx + 1,
        checkPoint: text,
        method: method,
        specification: specification,
        actualCondition: '',
        actionTaken: ''
      };
    });
  };

  // Form State
  const [refNo, setRefNo] = useState('MFG/FR/075');
  const [checkDate, setCheckDate] = useState(getTodayDate());
  const [nextDueDate, setNextDueDate] = useState(getNextDueDate());
  const [toolDescription, setToolDescription] = useState(tool.description || 'PRESSING TOOL (PRIMARY & SECONDARY)');
  const [application, setApplication] = useState(
    tool.applicationPartNo ? `${tool.applicationPartNo} - ${tool.productName || ''}`.trim() : (tool.productName || 'N251C IG COIL')
  );
  const [rows, setRows] = useState([]);
  const [pastRecords, setPastRecords] = useState([]);
  const [activeRecordId, setActiveRecordId] = useState(null);

  // Sync rows whenever tool changes
  useEffect(() => {
    setRefNo('MFG/FR/075');
    setCheckDate(getTodayDate());
    setNextDueDate(getNextDueDate());
    setToolDescription(tool.description || 'PRESSING TOOL (PRIMARY & SECONDARY)');
    setApplication(tool.applicationPartNo ? `${tool.applicationPartNo} - ${tool.productName || ''}`.trim() : (tool.productName || 'N251C IG COIL'));
    setRows(createDefaultRows());
    setActiveRecordId(null);
    loadPastRecords();
  }, [tool.id, tool.toolNo]);

  const loadPastRecords = () => {
    const all = getPMRecords();
    const toolRecs = all.filter(r => r.toolId === tool.id || r.toolNo === tool.toolNo);
    setPastRecords(toolRecs);
  };

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Record
  const handleSave = () => {
    const record = {
      id: activeRecordId || 'pm_' + Date.now(),
      toolId: tool.id,
      toolNo: tool.toolNo,
      refNo,
      checkDate,
      nextDueDate,
      toolDescription,
      application,
      classification: tool.classification || 'Non-Critical',
      items: rows
    };

    savePMRecord(record);
    setActiveRecordId(record.id);
    loadPastRecords();
    showToast?.(`Preventive Maintenance check saved for ${tool.toolNo}`, 'success');
  };

  // Load a past record
  const handleLoadRecord = (rec) => {
    setActiveRecordId(rec.id);
    setRefNo(rec.refNo || 'MFG/FR/075');
    setCheckDate(rec.checkDate || getTodayDate());
    setNextDueDate(rec.nextDueDate || getNextDueDate());
    setToolDescription(rec.toolDescription || tool.description || '');
    setApplication(rec.application || tool.productName || '');
    if (Array.isArray(rec.items) && rec.items.length > 0) {
      setRows(rec.items);
    }
    showToast?.(`Loaded PM record from ${rec.checkDate}`, 'info');
  };

  // New Inspection
  const handleNewChecklist = () => {
    setActiveRecordId(null);
    setCheckDate(getTodayDate());
    setNextDueDate(getNextDueDate());
    setRows(createDefaultRows());
    showToast?.('Started a new inspection checklist', 'info');
  };

  // Delete past record
  const handleDeleteRecord = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this PM inspection record?')) {
      deletePMRecord(id);
      if (activeRecordId === id) setActiveRecordId(null);
      loadPastRecords();
      showToast?.('Inspection record deleted', 'info');
    }
  };

  const isCritical = tool.classification === 'Critical';
  const sheetTitle = `PREVENTIVE MAINTENANCE CHECK LIST FOR ${isCritical ? 'CRITICAL' : 'NON CRITICAL'} TOOLS`;

  return (
    <div className="card pm-sheet-card" style={{ marginTop: '24px', padding: '0', overflow: 'hidden' }}>
      
      {/* Top Action Bar */}
      <div className="pm-action-toolbar" style={{
        padding: '12px 18px',
        backgroundColor: 'var(--slate-50)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeRecordId && (
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '10px',
              fontWeight: 700
            }}>
              Saved Record Active
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            style={{ backgroundColor: '#059669', fontSize: '12.5px', fontWeight: 600 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Save PM Record
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* THE OFFICIAL PREVENTIVE MAINTENANCE CHECK LIST SHEET           */}
      {/* ============================================================== */}
      <div className="pm-official-sheet-wrapper" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
        
        {/* Outer Form Container with Clean Industrial Border */}
        <div className="pm-form-sheet" style={{
          border: '1.5px solid #334155',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}>

          {/* Form Header: Logo & Title */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '170px 1fr',
            borderBottom: '1.5px solid #334155',
            minHeight: '52px'
          }}>
            {/* Left Logo / Company Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRight: '1.5px solid #334155',
              backgroundColor: '#f8fafc'
            }}>
              <img
                src="/inel-logo.png"
                alt="INEL Logo"
                style={{
                  width: '38px',
                  height: '38px',
                  objectFit: 'contain'
                }}
              />
              <div style={{ lineHeight: '1.2' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>INEL II</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569', letterSpacing: '0.5px' }}>PUDUCHERRY</div>
              </div>
            </div>

            {/* Center Main Title */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              textAlign: 'center',
              backgroundColor: '#ffffff'
            }}>
              <h2 style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                margin: 0
              }}>
                {sheetTitle}
              </h2>
            </div>
          </div>

          {/* Metadata Grid (3 Rows) */}
          <div style={{ borderBottom: '1.5px solid #334155', fontSize: '12.5px' }}>
            
            {/* Row 1: Tool No | Date of check | Ref No */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr 120px 140px 80px 130px',
              borderBottom: '1px solid #334155',
              minHeight: '38px',
              alignItems: 'center'
            }}>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Tool No
              </div>
              <div style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-700)', fontSize: '14px', borderRight: '1px solid #334155' }}>
                {tool.toolNo}
              </div>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Date of check:
              </div>
              <div style={{ padding: '4px 8px', borderRight: '1px solid #334155' }}>
                <input
                  type="date"
                  className="pm-sheet-input"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a' }}
                />
              </div>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc', fontSize: '11.5px' }}>
                Ref No.:
              </div>
              <div style={{ padding: '4px 8px' }}>
                <input
                  type="text"
                  className="pm-sheet-input"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--slate-800)' }}
                />
              </div>
            </div>

            {/* Row 2: Tool description | Next due Date */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr 120px 350px',
              borderBottom: '1px solid #334155',
              minHeight: '38px',
              alignItems: 'center'
            }}>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Tool description
              </div>
              <div style={{ padding: '4px 10px', borderRight: '1px solid #334155' }}>
                <input
                  type="text"
                  className="pm-sheet-input"
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  placeholder="e.g. PRESSING TOOL (PRIMARY & SECONDARY)"
                  style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 600, color: '#0f172a' }}
                />
              </div>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Next due Date:
              </div>
              <div style={{ padding: '4px 8px' }}>
                <input
                  type="date"
                  className="pm-sheet-input"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a' }}
                />
              </div>
            </div>

            {/* Row 3: Application */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr',
              minHeight: '38px',
              alignItems: 'center'
            }}>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Application
              </div>
              <div style={{ padding: '4px 10px' }}>
                <input
                  type="text"
                  className="pm-sheet-input"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  placeholder="e.g. N251C IG COIL / Steering Yoke Assembly"
                  style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 600, color: '#0f172a' }}
                />
              </div>
            </div>

          </div>

          {/* Checklist Table */}
          <div className="table-responsive" style={{ margin: 0 }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f1f5f9',
                  borderBottom: '1.5px solid #334155',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '0.2px'
                }}>
                  <th style={{ width: '45px', textAlign: 'center', padding: '9px 4px', borderRight: '1px solid #334155' }}>
                    S.no
                  </th>
                  <th style={{ minWidth: '240px', textAlign: 'left', padding: '9px 12px', borderRight: '1px solid #334155' }}>
                    Check points
                  </th>
                  <th style={{ width: '120px', textAlign: 'center', padding: '9px 8px', borderRight: '1px solid #334155' }}>
                    Checking Method
                  </th>
                  <th style={{ width: '190px', textAlign: 'left', padding: '9px 10px', borderRight: '1px solid #334155' }}>
                    Specification
                  </th>
                  <th style={{ minWidth: '220px', textAlign: 'left', padding: '9px 10px', borderRight: '1px solid #334155', backgroundColor: '#eff6ff' }}>
                    Actual condition *
                  </th>
                  <th style={{ minWidth: '150px', textAlign: 'left', padding: '9px 10px' }}>
                    Action Taken
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #cbd5e1',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    {/* S.no */}
                    <td style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#475569',
                      padding: '8px 4px',
                      borderRight: '1px solid #cbd5e1'
                    }}>
                      {row.sno}
                    </td>

                    {/* Check point description */}
                    <td style={{
                      padding: '6px 12px',
                      fontWeight: 600,
                      color: '#0f172a',
                      borderRight: '1px solid #cbd5e1'
                    }}>
                      <input
                        type="text"
                        value={row.checkPoint}
                        onChange={(e) => handleRowChange(idx, 'checkPoint', e.target.value)}
                        placeholder="Check point description..."
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: '#0f172a'
                        }}
                      />
                    </td>

                    {/* Checking Method */}
                    <td style={{
                      textAlign: 'center',
                      padding: '6px 6px',
                      borderRight: '1px solid #cbd5e1'
                    }}>
                      <input
                        type="text"
                        value={row.method}
                        onChange={(e) => handleRowChange(idx, 'method', e.target.value)}
                        placeholder="Visual / Gauge"
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'center',
                          fontSize: '12px',
                          color: '#334155'
                        }}
                      />
                    </td>

                    {/* Specification */}
                    <td style={{
                      padding: '6px 10px',
                      borderRight: '1px solid #cbd5e1',
                      color: '#475569'
                    }}>
                      <input
                        type="text"
                        value={row.specification}
                        onChange={(e) => handleRowChange(idx, 'specification', e.target.value)}
                        placeholder="Specification standard..."
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '12px',
                          color: '#475569'
                        }}
                      />
                    </td>

                    {/* Actual Condition (Handwritten-style or input) */}
                    <td style={{
                      padding: '4px 8px',
                      borderRight: '1px solid #cbd5e1',
                      backgroundColor: '#f0f9ff'
                    }}>
                      <input
                        type="text"
                        value={row.actualCondition}
                        onChange={(e) => handleRowChange(idx, 'actualCondition', e.target.value)}
                        placeholder="e.g. Locator Free from Damage / OK"
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid #93c5fd',
                          backgroundColor: '#ffffff',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          color: '#1e3a8a',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Action Taken */}
                    <td style={{ padding: '4px 8px' }}>
                      <input
                        type="text"
                        value={row.actionTaken}
                        onChange={(e) => handleRowChange(idx, 'actionTaken', e.target.value)}
                        placeholder="Action taken if any..."
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: '#ffffff',
                          fontSize: '12px',
                          color: '#334155'
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Past PM History Accordion */}
      {pastRecords.length > 0 && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--slate-50)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Previously Recorded Preventive Maintenance Checklists ({pastRecords.length})</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', marginTop: '10px' }}>
            {pastRecords.map((rec) => (
              <div
                key={rec.id}
                onClick={() => handleLoadRecord(rec)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: activeRecordId === rec.id ? '#eff6ff' : '#ffffff',
                  border: activeRecordId === rec.id ? '1.5px solid var(--accent-600)' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12.5px', color: 'var(--slate-900)' }}>{rec.checkDate}</strong>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteRecord(rec.id, e)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                    title="Delete record"
                  >
                    &times;
                  </button>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--slate-600)' }}>
                  Ref: {rec.refNo || 'MFG/FR/075'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-700)', marginTop: '4px', fontWeight: 600 }}>
                  {rec.items?.length || 0} Points Inspected → Click to view
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
