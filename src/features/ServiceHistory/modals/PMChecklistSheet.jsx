import React, { useState, useEffect } from 'react';
import { savePMRecord, getPMRecords } from '../../../services/toolService';

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
        return { method: 'Visual', specification: 'Free from play' };
      }
      return { method: 'Visual', specification: 'Free from chip off and damages' };
    }
    if (p.includes('IDENTIFICATION NUMBER') || p.includes('TOOL NUMBER') || p.includes('PUNCH') || p.includes('DIE NUMBER')) {
      return { method: 'Visual', specification: 'As per Master List' };
    }
    if (p.includes('BURR') || p.includes('SHARPNESS') || p.includes('CUTTING EDGE')) {
      return { method: 'Visual / Gauge', specification: 'Burr < 0.05mm / Sharp' };
    }
    if (p.includes('CLEARANCE') || p.includes('GAP')) {
      return { method: 'Feeler Gauge', specification: 'As per tool drawing' };
    }
    return { method: 'Visual', specification: 'Free from chip off and damages' };
  };

  // Default rows derived directly from tool checkPoints created in Master List (Default empty text boxes)
  const createDefaultRows = () => {
    let rawPoints = [];
    if (Array.isArray(tool.checkPoints) && tool.checkPoints.length > 0) {
      rawPoints = tool.checkPoints;
    } else {
      rawPoints = [
        'CHECK COIL LOCATOR FOR ANY DAMAGES',
        'CHECK COUPLER LOCATOR FOR ANY DAMAGES',
        'CHECK COUPLER LOCATOR ANY PLAY',
        'CHECK WIRE GUIDE FOR ANY DAMAGES',
        'ENSURE TOOL IDENTIFICATION NUMBER'
      ];
    }

    return rawPoints.map((cp, idx) => {
      const text = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
      const { method, specification } = getMethodAndSpec(text);
      return {
        sno: idx + 1,
        checkPoint: text,
        method: method || 'Visual',
        specification: specification || 'Free from chip off and damages',
        actualCondition: '',
        actionTaken: ''
      };
    });
  };

  // Form State
  const refNo = 'MFG/FR/075';
  const toolDescription = tool.description || 'Precision Manufacturing Tool';
  const application = tool.applicationPartNo ? `${tool.applicationPartNo} - ${tool.productName || ''}`.trim() : (tool.productName || '—');
  const [checkDate, setCheckDate] = useState(getTodayDate());
  const [nextDueDate, setNextDueDate] = useState(getNextDueDate());
  const [rows, setRows] = useState([]);
  const [activeRecordId, setActiveRecordId] = useState(null);

  // Helper to load or initialize PM Checklist data for current tool from storage
  const loadPMDataForTool = () => {
    const defaultRows = createDefaultRows();
    const pmList = getPMRecords();
    const saved = pmList.find(p => 
      (tool.id && p.toolId === tool.id) ||
      (tool.toolNo && p.toolNo && p.toolNo.toLowerCase().trim() === tool.toolNo.toLowerCase().trim())
    );

    if (saved && Array.isArray(saved.items) && saved.items.length > 0) {
      const mergedRows = defaultRows.map((dRow, idx) => {
        const match = saved.items.find(s => 
          s.checkPoint && dRow.checkPoint &&
          s.checkPoint.trim().toLowerCase() === dRow.checkPoint.trim().toLowerCase()
        ) || saved.items[idx];

        if (match) {
          return {
            ...dRow,
            method: match.method !== undefined ? match.method : dRow.method,
            specification: match.specification !== undefined ? match.specification : dRow.specification,
            actualCondition: match.actualCondition !== undefined ? match.actualCondition : '',
            actionTaken: match.actionTaken !== undefined ? match.actionTaken : ''
          };
        }
        return dRow;
      });

      const extraItems = saved.items.filter(s =>
        !defaultRows.some(d => (d.checkPoint || '').trim().toLowerCase() === (s.checkPoint || '').trim().toLowerCase())
      );

      setRows([...mergedRows, ...extraItems]);
      if (saved.checkDate) setCheckDate(saved.checkDate);
      if (saved.nextDueDate) setNextDueDate(saved.nextDueDate);
      setActiveRecordId(saved.id);
    } else {
      // Show empty text boxes by default ready for entering inspection data
      setRows(defaultRows);
      setCheckDate(getTodayDate());
      setNextDueDate(getNextDueDate());
      setActiveRecordId(null);
    }
  };

  // Sync rows whenever tool changes or tool checkPoints change
  const checkPointsKey = JSON.stringify(tool.checkPoints || []);
  useEffect(() => {
    loadPMDataForTool();
  }, [tool.id, tool.toolNo, checkPointsKey]);

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Record
  const handleSave = () => {
    const recordId = activeRecordId || `pm_${tool.id || tool.toolNo.replace(/\s+/g, '_')}`;
    const record = {
      id: recordId,
      toolId: tool.id,
      toolNo: tool.toolNo,
      refNo,
      checkDate,
      nextDueDate,
      toolDescription,
      application,
      classification: tool.classification || 'Non-Critical',
      items: rows,
      rows: rows
    };

    savePMRecord(record);
    setActiveRecordId(recordId);
    showToast?.(`Preventive Maintenance check saved for ${tool.toolNo}`, 'success');
  };

  const handleClear = () => {
    setRows(prev => prev.map(r => ({ ...r, actualCondition: '', actionTaken: '' })));
    showToast?.('Inspection text boxes cleared', 'info');
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
          {activeRecordId ? (
            <span style={{
              fontSize: '11.5px',
              padding: '4px 12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '12px',
              fontWeight: 700,
              border: '1px solid #86efac',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
              Saved Record Active (Last Check: {checkDate})
            </span>
          ) : (
            <span style={{
              fontSize: '11.5px',
              padding: '4px 12px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '12px',
              fontWeight: 700,
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563eb' }}></span>
              Ready to Enter & Save Inspection Data
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClear}
            title="Clear all Actual Condition and Action Taken text boxes"
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #cbd5e1'
            }}
          >
            Clear Fields
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            style={{
              backgroundColor: '#059669',
              padding: '9px 22px',
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
        </div>
      </div>

      {/* ============================================================== */}
      {/* THE OFFICIAL PREVENTIVE MAINTENANCE CHECK LIST SHEET           */}
      {/* ============================================================== */}
      <div className="pm-official-sheet-wrapper">
        
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
                <span className="print-only-text" style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                  {checkDate}
                </span>
                <input
                  type="date"
                  className="pm-sheet-input screen-only-input"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc', fontSize: '11.5px' }}>
                Ref No.:
              </div>
              <div style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>
                {refNo}
              </div>
            </div>

            {/* Row 2: Tool description (Locked to Master List) | Next due Date */}
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
              <div style={{ padding: '6px 12px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #334155' }}>
                {tool.description || 'Precision Manufacturing Tool'}
              </div>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Next due Date:
              </div>
              <div style={{ padding: '4px 8px' }}>
                <span className="print-only-text" style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                  {nextDueDate}
                </span>
                <input
                  type="date"
                  className="pm-sheet-input screen-only-input"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
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

            {/* Row 3: Application (Locked to Master List) & Tool Issued On (Locked to Master List) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr 120px 200px',
              minHeight: '38px',
              alignItems: 'center'
            }}>
              <div style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', borderRight: '1px solid #334155', backgroundColor: '#f8fafc' }}>
                Application
              </div>
              <div style={{ padding: '6px 12px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #334155' }}>
                {tool.applicationPartNo ? `${tool.applicationPartNo} - ${tool.productName || ''}`.trim() : (tool.productName || '—')}
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
            <table className="pm-sheet-table" style={{
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
                  <th className="pm-col-sno" style={{ width: '45px', textAlign: 'center', padding: '10px 4px', borderRight: '1px solid #334155' }}>
                    S.no
                  </th>
                  <th className="pm-col-point" style={{ minWidth: '220px', textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #334155' }}>
                    Check points
                  </th>
                  <th className="pm-col-method" style={{ width: '130px', textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #334155' }}>
                    Checking Method
                  </th>
                  <th className="pm-col-spec" style={{ minWidth: '200px', textAlign: 'left', padding: '10px 10px', borderRight: '1px solid #334155' }}>
                    Specification
                  </th>
                  <th className="pm-col-actual" style={{ minWidth: '280px', textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #334155', backgroundColor: '#eff6ff' }}>
                    Actual condition *
                  </th>
                  <th className="pm-col-action" style={{ minWidth: '220px', textAlign: 'left', padding: '10px 12px' }}>
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

                    {/* Check point description (Directly retrieved from Master List) */}
                    <td style={{
                      padding: '10px 14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top',
                      lineHeight: 1.5,
                      fontSize: '12.5px'
                    }}>
                      {row.checkPoint}
                    </td>

                    {/* Checking Method (Editable input with visible field styling) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top'
                    }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'center', fontWeight: 600 }}>
                        {row.method || 'Visual'}
                      </div>
                      <textarea
                        className="screen-only-input"
                        rows={2}
                        value={row.method}
                        onChange={(e) => handleRowChange(idx, 'method', e.target.value)}
                        placeholder="e.g. Visual"
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 8px',
                          borderRadius: '4px',
                          border: '1.5px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          textAlign: 'center',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: 'vertical',
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
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left' }}>
                        {row.specification || '—'}
                      </div>
                      <textarea
                        className="screen-only-input"
                        rows={2}
                        value={row.specification}
                        onChange={(e) => handleRowChange(idx, 'specification', e.target.value)}
                        placeholder="Specification standard..."
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: '1.5px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: 'vertical',
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
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>
                        {row.actualCondition || '—'}
                      </div>
                      <textarea
                        className="screen-only-input"
                        rows={2}
                        value={row.actualCondition}
                        onChange={(e) => handleRowChange(idx, 'actualCondition', e.target.value)}
                        placeholder="Enter actual condition / observation..."
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: '1.5px solid #93c5fd',
                          backgroundColor: '#ffffff',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>

                    {/* Action Taken (Multi-line Textarea for comfortable long text) */}
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left' }}>
                        {row.actionTaken || '—'}
                      </div>
                      <textarea
                        className="screen-only-input"
                        rows={2}
                        value={row.actionTaken}
                        onChange={(e) => handleRowChange(idx, 'actionTaken', e.target.value)}
                        placeholder="Enter action taken..."
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: '1.5px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: 'vertical',
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
