import React, { useState, useEffect } from 'react';
import { savePMRecord, getPMRecords } from '../../../services/toolService';
import { authService } from '../../../services/authService';
import PMExportModal from './PMExportModal';

export default function PMChecklistSheet({ tool, currentUser, showToast }) {
  if (!tool) return null;

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Format today's date (YYYY-MM-DD)
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  
  // Format date 3 months from now (YYYY-MM-DD)
  const getNextDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  };

  // Default rows derived directly from tool checkPoints created in Master List (All text boxes empty by default)
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
      const method = (typeof cp === 'object' && cp !== null && cp.method) ? cp.method : '';
      const specification = (typeof cp === 'object' && cp !== null && (cp.spec || cp.specification)) ? (cp.spec || cp.specification) : '';
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
  const refNo = 'MFG/FR/075';
  const toolDescription = tool.description || 'Precision Manufacturing Tool';
  const application = tool.applicationPartNo ? `${tool.applicationPartNo} - ${tool.productName || ''}`.trim() : (tool.productName || '—');
  const [checkDate, setCheckDate] = useState(getTodayDate());
  const [nextDueDate, setNextDueDate] = useState(getNextDueDate());
  const [rows, setRows] = useState([]);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedByInfo, setCheckedByInfo] = useState(null);
  const [approvedByInfo, setApprovedByInfo] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [selectedRevisionIndex, setSelectedRevisionIndex] = useState(-1);

  // Helper to load or initialize PM Checklist data for current tool from storage
  const loadPMDataForTool = () => {
    const defaultRows = createDefaultRows();
    const pmList = getPMRecords();
    const saved = pmList.find(p => 
      (tool.id && p.toolId === tool.id) ||
      (tool.toolNo && p.toolNo && p.toolNo.toLowerCase().trim() === tool.toolNo.toLowerCase().trim())
    );

    const loggedUser = currentUser || authService.getCurrentUser();
    const loggedName = loggedUser?.name || loggedUser?.username || 'Maintenance Technician';

    if (saved && Array.isArray(saved.items) && saved.items.length > 0) {
      const mergedRows = defaultRows.map((dRow, idx) => {
        const match = saved.items.find(s => 
          s.checkPoint && dRow.checkPoint &&
          s.checkPoint.trim().toLowerCase() === dRow.checkPoint.trim().toLowerCase()
        ) || saved.items[idx];

        if (match) {
          return {
            ...dRow,
            method: match.method !== undefined ? match.method : '',
            specification: match.specification !== undefined ? match.specification : '',
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
      setPreparedBy(saved.preparedBy || saved.inspectedBy || loggedName);
      setCheckedByInfo(saved.checkedBy || null);
      setApprovedByInfo(saved.approvedBy || null);
      setActiveRecordId(saved.id);
      setHistoryList(Array.isArray(saved.history) ? saved.history : []);
      setSelectedRevisionIndex(-1);
    } else {
      // Show empty text boxes by default ready for entering inspection data
      setRows(defaultRows);
      setCheckDate(getTodayDate());
      setNextDueDate(getNextDueDate());
      setPreparedBy(loggedName);
      setCheckedByInfo(null);
      setApprovedByInfo(null);
      setActiveRecordId(null);
      setHistoryList([]);
      setSelectedRevisionIndex(-1);
    }
  };

  // Sync rows whenever tool changes or tool checkPoints change
  const checkPointsKey = JSON.stringify(tool.checkPoints || []);
  useEffect(() => {
    loadPMDataForTool();
    setIsEditing(false);
  }, [tool.id, tool.toolNo, checkPointsKey]);

  const handleRowChange = (index, field, value) => {
    if (!isEditing) return;
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Helper to insert symbols (⌀, ±) into specification at cursor position or append
  const handleInsertSymbol = (index, symbol) => {
    if (!isEditing) return;
    setRows(prev => {
      const updated = [...prev];
      const currentText = updated[index]?.specification || '';
      const inputEl = document.getElementById(`spec-input-${index}`);
      if (inputEl && typeof inputEl.selectionStart === 'number') {
        const start = inputEl.selectionStart;
        const end = inputEl.selectionEnd;
        const newText = currentText.substring(0, start) + symbol + currentText.substring(end);
        updated[index] = { ...updated[index], specification: newText };
        setTimeout(() => {
          inputEl.focus();
          inputEl.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 10);
      } else {
        updated[index] = { ...updated[index], specification: currentText ? `${currentText}${symbol}` : symbol };
      }
      return updated;
    });
  };

  // Save Record (Archives previous version & resets approvals to pending for re-verification)
  const handleSave = () => {
    const loggedUser = currentUser || authService.getCurrentUser();
    const activeUserName = loggedUser?.name || loggedUser?.username || 'Maintenance Technician';

    const pmList = getPMRecords();
    const existing = pmList.find(p => 
      (tool.id && p.toolId === tool.id) ||
      (tool.toolNo && p.toolNo && p.toolNo.toLowerCase().trim() === tool.toolNo.toLowerCase().trim())
    );

    const recordId = activeRecordId || `pm_${tool.id || tool.toolNo.replace(/\s+/g, '_')}`;

    // Archive old data into revision history so previous PM inspection data is permanently retained
    let updatedHistory = Array.isArray(existing?.history) ? [...existing.history] : [];
    if (existing && Array.isArray(existing.items) && existing.items.length > 0) {
      const snapshot = {
        revisionNumber: updatedHistory.length + 1,
        savedAt: existing.lastModifiedAt || new Date().toISOString(),
        checkDate: existing.checkDate,
        nextDueDate: existing.nextDueDate,
        preparedBy: existing.preparedBy || existing.inspectedBy || 'Technician',
        checkedBy: existing.checkedBy || null,
        approvedBy: existing.approvedBy || null,
        items: existing.items || existing.rows || []
      };
      updatedHistory.push(snapshot);
    }

    // New/Edited PM record: Resets QA Check and Management Approval so they must re-verify the new inspection edits!
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
      rows: rows,
      preparedBy: activeUserName,
      inspectedBy: activeUserName,
      checkedBy: null, // Reset: waiting for QA Check
      approvedBy: null, // Reset: waiting for Management Approval
      sentToApprovedBy: false, // Reset: must be re-verified and re-sent by QA
      history: updatedHistory,
      lastModifiedBy: activeUserName,
      lastModifiedAt: new Date().toISOString()
    };

    savePMRecord(record);
    setActiveRecordId(recordId);
    setPreparedBy(activeUserName);
    setCheckedByInfo(null);
    setApprovedByInfo(null);
    setHistoryList(updatedHistory);
    setSelectedRevisionIndex(-1);
    setIsEditing(false);
    showToast?.(`PM updated by ${activeUserName}. Re-submitted for QA check and Management authorization.`, 'success');
  };

  const handleCancel = () => {
    loadPMDataForTool();
    setIsEditing(false);
    showToast?.('Exited edit mode', 'info');
  };

  const isCritical = tool.classification === 'Critical';
  const sheetTitle = `PREVENTIVE MAINTENANCE CHECK LIST FOR ${isCritical ? 'CRITICAL' : 'NON CRITICAL'} TOOLS`;

  const loggedUser = currentUser || authService.getCurrentUser();
  const loggedUserName = loggedUser?.name || loggedUser?.username || 'Maintenance Technician';

  const isHistorical = selectedRevisionIndex >= 0;
  const currentHist = isHistorical ? historyList[selectedRevisionIndex] : null;

  const displayRows = isHistorical ? (currentHist.items || currentHist.rows || []) : rows;
  const displayCheckDate = isHistorical ? (currentHist.checkDate || checkDate) : checkDate;
  const displayNextDueDate = isHistorical ? (currentHist.nextDueDate || nextDueDate) : nextDueDate;
  const displayPreparedBy = isHistorical
    ? (currentHist.preparedBy || currentHist.inspectedBy || 'Technician')
    : (isEditing ? loggedUserName : (preparedBy || loggedUserName));
  const displayCheckedBy = isHistorical ? currentHist.checkedBy : checkedByInfo;
  const displayApprovedBy = isHistorical ? currentHist.approvedBy : approvedByInfo;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isEditing ? (
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
              Edit Mode Active — Enter inspection details below
            </span>
          ) : isHistorical ? (
            <span style={{
              fontSize: '11.5px',
              padding: '4px 12px',
              backgroundColor: '#fffbeb',
              color: '#92400e',
              borderRadius: '12px',
              fontWeight: 700,
              border: '1.5px solid #f59e0b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#d97706' }}></span>
              Viewing Historical Revision {selectedRevisionIndex + 1} ({displayCheckDate})
            </span>
          ) : activeRecordId ? (
            <span style={{
              fontSize: '11.5px',
              padding: '4px 12px',
              backgroundColor: checkedByInfo?.status === 'Verified' && approvedByInfo?.status === 'Approved' ? '#dcfce7' : '#eff6ff',
              color: checkedByInfo?.status === 'Verified' && approvedByInfo?.status === 'Approved' ? '#15803d' : '#1d4ed8',
              borderRadius: '12px',
              fontWeight: 700,
              border: checkedByInfo?.status === 'Verified' && approvedByInfo?.status === 'Approved' ? '1px solid #86efac' : '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: checkedByInfo?.status === 'Verified' && approvedByInfo?.status === 'Approved' ? '#16a34a' : '#2563eb'
              }}></span>
              PM Active
            </span>
          ) : (
            <span style={{
              fontSize: '11.5px',
              padding: '4px 12px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              borderRadius: '12px',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Click Edit to enter inspection data
            </span>
          )}

          {/* Historical Version Dropdown (Maintains all old data and lets user view every revision) */}
          {historyList.length > 0 && !isEditing && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Version:
              </span>
              <select
                value={selectedRevisionIndex}
                onChange={(e) => setSelectedRevisionIndex(Number(e.target.value))}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: isHistorical ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                  backgroundColor: isHistorical ? '#fffbeb' : '#ffffff',
                  color: isHistorical ? '#92400e' : '#0f172a',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
                title="View active PM or previous historical PM inspections"
              >
                <option value={-1}>
                  Current Active (Rev {historyList.length + 1}) &bull; {checkDate} ({checkedByInfo?.status === 'Verified' && approvedByInfo?.status === 'Approved' ? 'Approved' : 'Pending QA/Approval'})
                </option>
                {historyList.map((h, hIdx) => (
                  <option key={hIdx} value={hIdx}>
                    Rev {hIdx + 1} &bull; {h.checkDate} (by {h.preparedBy || 'Technician'}) {h.checkedBy?.status ? `• QA ${h.checkedBy.status}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1'
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
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsExportModalOpen(true)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
                title="Export Preventive Maintenance Checklist (Excel or PDF)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export</span>
              </button>

              {isHistorical ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedRevisionIndex(-1)}
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #d97706',
                    color: '#92400e',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Active PM
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsEditing(true);
                    showToast?.('Edit mode activated. You can now enter the inspection details.', 'info');
                  }}
                  style={{
                    backgroundColor: '#2563eb',
                    padding: '9px 22px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
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
            </>
          )}
        </div>
      </div>

      {/* Historical Revision Alert Banner */}
      {isHistorical && (
        <div style={{
          margin: '14px 18px 0',
          padding: '10px 16px',
          backgroundColor: '#fffbeb',
          border: '1.5px solid #f59e0b',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: '#92400e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📜</span>
            <span>
              <strong>Viewing Historical Inspection: Revision {selectedRevisionIndex + 1}</strong>
              {' '}&bull; Inspected on <strong>{displayCheckDate}</strong> by <strong>{displayPreparedBy}</strong>
              {displayCheckedBy?.status && ` (QA: ${displayCheckedBy.status})`}
              {displayApprovedBy?.status && ` (Management: ${displayApprovedBy.status})`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRevisionIndex(-1)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              color: '#92400e',
              border: '1.5px solid #d97706',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Return to Current Active PM
          </button>
        </div>
      )}

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
                  {displayCheckDate}
                </span>
                <input
                  type="date"
                  className="pm-sheet-input screen-only-input"
                  value={displayCheckDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  disabled={!isEditing || isHistorical}
                  style={{
                    width: '100%',
                    border: isEditing && !isHistorical ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: isEditing && !isHistorical ? '#ffffff' : '#f8fafc',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: isEditing && !isHistorical ? 'pointer' : 'default',
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
                  {displayNextDueDate}
                </span>
                <input
                  type="date"
                  className="pm-sheet-input screen-only-input"
                  value={displayNextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  disabled={!isEditing || isHistorical}
                  style={{
                    width: '100%',
                    border: isEditing && !isHistorical ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: isEditing && !isHistorical ? '#ffffff' : '#f8fafc',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: isEditing && !isHistorical ? 'pointer' : 'default',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
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
                {displayRows.map((row, idx) => (
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

                    {/* Checking Method (Dropdown to choose: Visual, Vernier, Micro meter, Flip guage) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top',
                      width: '140px'
                    }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'center', fontWeight: 600 }}>
                        {row.method || '—'}
                      </div>
                      {isEditing && !isHistorical ? (
                        <select
                          className="screen-only-input"
                          value={row.method || ''}
                          onChange={(e) => handleRowChange(idx, 'method', e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '40px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1.5px solid #2563eb',
                            backgroundColor: '#ffffff',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#0f172a',
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Select Method</option>
                          <option value="Visual">Visual</option>
                          <option value="Vernier">Vernier</option>
                          <option value="Micro meter">Micro meter</option>
                          <option value="Flip guage">Flip guage</option>
                          {row.method && !['Visual', 'Vernier', 'Micro meter', 'Flip guage'].includes(row.method) && (
                            <option value={row.method}>{row.method}</option>
                          )}
                        </select>
                      ) : (
                        <div
                          className="screen-only-input"
                          style={{
                            width: '100%',
                            minHeight: '40px',
                            padding: '8px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: row.method ? '#0f172a' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box'
                          }}
                        >
                          {row.method || '—'}
                        </div>
                      )}
                    </td>

                    {/* Specification (Editable textarea with ⌀ and ± quick insert buttons) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #cbd5e1',
                      verticalAlign: 'top'
                    }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left' }}>
                        {row.specification || '—'}
                      </div>
                      {isEditing && !isHistorical && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '5px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Insert:</span>
                          <button
                            type="button"
                            onClick={() => handleInsertSymbol(idx, '⌀')}
                            style={{
                              padding: '1px 8px',
                              borderRadius: '4px',
                              border: '1.5px solid #3b82f6',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              lineHeight: '1.3',
                              fontFamily: 'system-ui, sans-serif',
                              boxShadow: '0 1px 2px rgba(59, 130, 246, 0.15)'
                            }}
                            title="Insert Diameter symbol (⌀)"
                          >
                            ⌀
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertSymbol(idx, '±')}
                            style={{
                              padding: '1px 8px',
                              borderRadius: '4px',
                              border: '1.5px solid #f97316',
                              backgroundColor: '#fff7ed',
                              color: '#ea580c',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              lineHeight: '1.3',
                              fontFamily: 'system-ui, sans-serif',
                              boxShadow: '0 1px 2px rgba(249, 115, 22, 0.15)'
                            }}
                            title="Insert Plus-Minus tolerance symbol (±)"
                          >
                            ±
                          </button>
                        </div>
                      )}
                      <textarea
                        id={`spec-input-${idx}`}
                        className="screen-only-input"
                        rows={2}
                        value={row.specification}
                        onChange={(e) => handleRowChange(idx, 'specification', e.target.value)}
                        readOnly={!isEditing || isHistorical}
                        placeholder={isEditing && !isHistorical ? "Specification standard (e.g. ⌀ 25 ± 0.05)..." : "—"}
                        style={{
                          width: '100%',
                          minHeight: isEditing && !isHistorical ? '54px' : '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing && !isHistorical ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isEditing && !isHistorical ? '#ffffff' : '#f8fafc',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: isEditing && !isHistorical ? 'vertical' : 'none',
                          cursor: isEditing && !isHistorical ? 'text' : 'default',
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
                        readOnly={!isEditing || isHistorical}
                        placeholder={isEditing && !isHistorical ? "Enter actual condition / observation..." : "—"}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing && !isHistorical ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isEditing && !isHistorical ? '#ffffff' : '#f8fafc',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: isEditing && !isHistorical ? 'vertical' : 'none',
                          cursor: isEditing && !isHistorical ? 'text' : 'default',
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
                        readOnly={!isEditing || isHistorical}
                        placeholder={isEditing && !isHistorical ? "Enter action taken..." : "—"}
                        style={{
                          width: '100%',
                          minHeight: '62px',
                          padding: '7px 10px',
                          borderRadius: '4px',
                          border: isEditing && !isHistorical ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isEditing && !isHistorical ? '#ffffff' : '#f8fafc',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: '#0f172a',
                          outline: 'none',
                          resize: isEditing && !isHistorical ? 'vertical' : 'none',
                          cursor: isEditing && !isHistorical ? 'text' : 'default',
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

          {/* Official Bottom 3-Column Sign-Off Block */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            border: '1.5px solid #0f172a',
            borderTop: 'none',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box'
          }}>
            {/* Column 1: Prepared By */}
            <div style={{
              padding: '12px 14px',
              borderRight: '1px solid #0f172a',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '75px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Prepared By
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  ✓ {displayPreparedBy}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  {displayCheckDate ? `Checked: ${displayCheckDate}` : ''}
                </span>
              </div>
            </div>

            {/* Column 2: Checked By */}
            <div style={{
              padding: '12px 14px',
              borderRight: '1px solid #0f172a',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '75px',
              backgroundColor: displayCheckedBy?.status === 'Verified' ? '#f0fdf4' : displayCheckedBy?.status === 'Revision Requested' ? '#fef2f2' : '#fafafa'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Checked By
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {displayCheckedBy?.name ? (
                  <>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '13px',
                      color: displayCheckedBy.status === 'Verified' ? '#16a34a' : '#dc2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {displayCheckedBy.status === 'Verified' ? '✓' : '⚠'} {displayCheckedBy.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {displayCheckedBy.status} &bull; {displayCheckedBy.date || ''}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#94a3b8' }}>
                    Pending QA Check
                  </span>
                )}
              </div>
            </div>

            {/* Column 3: Approved By */}
            <div style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '75px',
              backgroundColor: displayApprovedBy?.status === 'Approved' ? '#eff6ff' : displayApprovedBy?.status === 'Hold' ? '#fef2f2' : '#fafafa'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Approved By
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {displayApprovedBy?.name ? (
                  <>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '13px',
                      color: displayApprovedBy.status === 'Approved' ? '#2563eb' : '#dc2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {displayApprovedBy.status === 'Approved' ? '✓' : '⚠'} {displayApprovedBy.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {displayApprovedBy.status} &bull; {displayApprovedBy.date || ''}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#94a3b8' }}>
                    Pending Management Approval
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Export Modal for ONLY PREVENTIVE MAINTENANCE CHECK LIST */}
      {isExportModalOpen && (
        <PMExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          tool={tool}
          currentPMRecord={{
            id: activeRecordId,
            toolId: tool.id,
            toolNo: tool.toolNo,
            refNo,
            checkDate: displayCheckDate,
            nextDueDate,
            toolDescription,
            application,
            classification: tool.classification,
            items: displayRows,
            preparedBy: displayPreparedBy,
            checkedBy: displayCheckedBy,
            approvedBy: displayApprovedBy,
            history: historyList
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
}
