import React, { useState, useEffect } from 'react';
import { savePMRecord } from '../../data/storage';

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
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sync rows whenever tool changes
  useEffect(() => {
    setRefNo('MFG/FR/075');
    setCheckDate(getTodayDate());
    setNextDueDate(getNextDueDate());
    setToolDescription(tool.description || 'PRESSING TOOL (PRIMARY & SECONDARY)');
    setApplication(tool.applicationPartNo ? `${tool.applicationPartNo} - ${tool.productName || ''}`.trim() : (tool.productName || 'N251C IG COIL'));
    setRows(createDefaultRows());
    setActiveRecordId(null);
    setIsEditing(false);
  }, [tool.id, tool.toolNo]);

  const handleRowChange = (index, field, value) => {
    if (!isEditing) return;
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
    setIsEditing(false);
    showToast?.(`Preventive Maintenance check saved for ${tool.toolNo}`, 'success');
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
          {isEditing ? (
            <span style={{
              fontSize: '11.5px',
              padding: '3px 10px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '12px',
              fontWeight: 700,
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }}></span>
              Edit Mode Active — Make your updates below
            </span>
          ) : activeRecordId ? (
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
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  showToast?.('Exited edit mode', 'info');
                }}
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                style={{
                  backgroundColor: '#059669',
                  padding: '9px 20px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  borderRadius: '6px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Save PM Record</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setIsEditing(true);
                showToast?.('Edit mode activated. You can now edit the checklist details.', 'info');
              }}
              style={{
                backgroundColor: '#059669',
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                borderRadius: '6px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.5 3.5H6A3.5 3.5 0 0 0 2.5 7v10A3.5 3.5 0 0 0 6 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-6.5" />
                <path d="M16.5 6.5L18.3 4.7C19.1 3.9 20.4 3.9 21.2 4.7C22.0 5.5 22.0 6.8 21.2 7.6L19.4 9.4" />
                <line x1="16.5" y1="6.5" x2="9.8" y2="13.2" />
                <line x1="19.4" y1="9.4" x2="12.7" y2="16.1" />
                <line x1="16.5" y1="6.5" x2="19.4" y2="9.4" />
                <line x1="9.8" y1="13.2" x2="12.7" y2="16.1" />
                <path d="M9.8 13.2L7.8 18.1L12.7 16.1" />
                <polygon points="7.8,18.1 8.8,15.6 10.3,17.1" fill="currentColor" stroke="none" />
              </svg>
              <span>Click Edit</span>
            </button>
          )}
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
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isEditing ? '#f0f9ff' : 'transparent',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: isEditing ? 'pointer' : 'default',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
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
                  readOnly={!isEditing}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isEditing ? '#f0f9ff' : 'transparent',
                    fontWeight: 700,
                    color: 'var(--slate-800)',
                    cursor: isEditing ? 'text' : 'default',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
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
                  readOnly={!isEditing}
                  placeholder="e.g. PRESSING TOOL (PRIMARY & SECONDARY)"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isEditing ? '#f0f9ff' : 'transparent',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: isEditing ? 'text' : 'default',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
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
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isEditing ? '#f0f9ff' : 'transparent',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: isEditing ? 'pointer' : 'default',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>

            {/* Row 3: Application & Tool Issued On */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr 120px 200px',
              minHeight: '38px',
              alignItems: 'center'
            }}>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Application
              </div>
              <div style={{ padding: '4px 10px', borderRight: '1px solid #334155' }}>
                <input
                  type="text"
                  className="pm-sheet-input"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="e.g. N251C IG COIL / Steering Yoke Assembly"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isEditing ? '#f0f9ff' : 'transparent',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: isEditing ? 'text' : 'default',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
                />
              </div>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Tool Issued On:
              </div>
              <div style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>
                {tool.toolIssuedOn || '—'}
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
                  <th style={{ width: '45px', textAlign: 'center', padding: '10px 4px', borderRight: '1px solid #334155' }}>
                    S.no
                  </th>
                  <th style={{ minWidth: '220px', textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #334155' }}>
                    Check points
                  </th>
                  <th style={{ width: '130px', textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #334155' }}>
                    Checking Method
                  </th>
                  <th style={{ minWidth: '200px', textAlign: 'left', padding: '10px 10px', borderRight: '1px solid #334155' }}>
                    Specification
                  </th>
                  <th style={{ minWidth: '280px', textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #334155', backgroundColor: '#eff6ff' }}>
                    Actual condition *
                  </th>
                  <th style={{ minWidth: '220px', textAlign: 'left', padding: '10px 12px' }}>
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
                      padding: '10px 4px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top'
                    }}>
                      {row.sno}
                    </td>

                    {/* Check point description */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top'
                    }}>
                      <textarea
                        rows={2}
                        value={row.checkPoint}
                        onChange={(e) => handleRowChange(idx, 'checkPoint', e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "Check point description..." : ""}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing ? '1px solid #cbd5e1' : '1px solid transparent',
                          backgroundColor: isEditing ? '#ffffff' : 'transparent',
                          fontWeight: 600,
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: isEditing ? 'vertical' : 'none',
                          cursor: isEditing ? 'text' : 'default',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>

                    {/* Checking Method (Editable input with visible field styling) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top'
                    }}>
                      <textarea
                        rows={2}
                        value={row.method}
                        onChange={(e) => handleRowChange(idx, 'method', e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "e.g. Visual" : ""}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 8px',
                          borderRadius: '4px',
                          border: isEditing ? '1px solid #cbd5e1' : '1px solid transparent',
                          backgroundColor: isEditing ? '#ffffff' : 'transparent',
                          textAlign: 'center',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#334155',
                          outline: 'none',
                          resize: isEditing ? 'vertical' : 'none',
                          cursor: isEditing ? 'text' : 'default',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>

                    {/* Specification (Editable textarea for long text) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top'
                    }}>
                      <textarea
                        rows={2}
                        value={row.specification}
                        onChange={(e) => handleRowChange(idx, 'specification', e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "Specification standard..." : ""}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing ? '1px solid #cbd5e1' : '1px solid transparent',
                          backgroundColor: isEditing ? '#ffffff' : 'transparent',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#334155',
                          outline: 'none',
                          resize: isEditing ? 'vertical' : 'none',
                          cursor: isEditing ? 'text' : 'default',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>

                    {/* Actual Condition (Multi-line Textarea for comfortable reading & long text) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      backgroundColor: '#f0f9ff',
                      verticalAlign: 'top'
                    }}>
                      <textarea
                        rows={2}
                        value={row.actualCondition}
                        onChange={(e) => handleRowChange(idx, 'actualCondition', e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "e.g. Locator Free from Damage / OK" : "—"}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                          backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          lineHeight: 1.45,
                          color: '#1e3a8a',
                          outline: 'none',
                          resize: isEditing ? 'vertical' : 'none',
                          cursor: isEditing ? 'text' : 'default',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>

                    {/* Action Taken (Multi-line Textarea for comfortable long text) */}
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <textarea
                        rows={2}
                        value={row.actionTaken}
                        onChange={(e) => handleRowChange(idx, 'actionTaken', e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? "Action taken if any..." : "—"}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                          backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#334155',
                          outline: 'none',
                          resize: isEditing ? 'vertical' : 'none',
                          cursor: isEditing ? 'text' : 'default',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
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

    </div>
  );
}
