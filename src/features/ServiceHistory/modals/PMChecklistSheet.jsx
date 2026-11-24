import React, { useState, useEffect } from 'react';
import { savePMRecord, getPMRecords } from '../../../services/toolService';
import { authService } from '../../../services/authService';
import PMExportModal from './PMExportModal';
import { compressImage } from '../../../utils/imageCompressor';

export default function PMChecklistSheet({ tool, currentUser, showToast, onRefresh }) {
  if (!tool) return null;

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Format today's date (YYYY-MM-DD)
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  
  // Format date 3 months from now (YYYY-MM-DD)
  const getNextDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  };

  // Default rows derived directly from tool checkPoints created in Master List
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
      const text = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || cp.checkPoint || '') : String(cp || '');
      const method = (typeof cp === 'object' && cp !== null && cp.method) ? cp.method : '';
      const specification = (typeof cp === 'object' && cp !== null && (cp.specification || cp.spec)) ? (cp.specification || cp.spec) : '';
      const actualCondition = (typeof cp === 'object' && cp !== null && cp.actualCondition) ? cp.actualCondition : '';
      return {
        sno: idx + 1,
        checkPoint: text,
        method: method,
        specification: specification,
        actualCondition: actualCondition,
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
  const [hasDraft, setHasDraft] = useState(false);

  // Helper key to identify draft in localStorage
  const getDraftKey = () => `pm_draft_${tool.id || (tool.toolNo ? tool.toolNo.replace(/\s+/g, '_') : 'unknown')}`;

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

    // Check if there is an unsaved draft
    let draftData = null;
    try {
      const rawDraft = localStorage.getItem(getDraftKey());
      if (rawDraft) {
        draftData = JSON.parse(rawDraft);
      }
    } catch (e) {}

    const sourceData = draftData || saved;
    const isFromDraft = Boolean(draftData);
    setHasDraft(isFromDraft);

    if (sourceData && Array.isArray(sourceData.items) && sourceData.items.length > 0) {
      const mergedRows = defaultRows.map((dRow, idx) => {
        // Match primarily by row index, or fallback by distinct checkpoint name
        let match = null;
        if (sourceData.items[idx]) {
          match = sourceData.items[idx];
        } else {
          match = sourceData.items.find(s => 
            s.checkPoint && dRow.checkPoint &&
            s.checkPoint.trim().toLowerCase() === dRow.checkPoint.trim().toLowerCase()
          );
        }

        if (match) {
          return {
            ...dRow,
            method: dRow.method || match.method || '',
            specification: dRow.specification || match.specification || '',
            actualCondition: (dRow.actualCondition !== undefined && dRow.actualCondition !== '') 
              ? dRow.actualCondition 
              : (match.actualCondition !== undefined ? match.actualCondition : ''),
            actionTaken: match.actionTaken !== undefined ? match.actionTaken : ''
          };
        }
        return dRow;
      });

      const extraItems = sourceData.items.slice(defaultRows.length);

      setRows([...mergedRows, ...extraItems]);
      if (sourceData.checkDate) setCheckDate(sourceData.checkDate);
      if (sourceData.nextDueDate) setNextDueDate(sourceData.nextDueDate);
      setPhotos(Array.isArray(sourceData.photos) ? sourceData.photos : []);
      setPreparedBy(sourceData.preparedBy || sourceData.inspectedBy || loggedName);
      setCheckedByInfo(saved?.checkedBy || null);
      setApprovedByInfo(saved?.approvedBy || null);
      setActiveRecordId(saved?.id || null);
      setHistoryList(Array.isArray(saved?.history) ? saved.history : []);
      setSelectedRevisionIndex(-1);
    } else {
      // Show empty text boxes by default ready for entering inspection data
      setRows(defaultRows);
      setPhotos([]);
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

      // Auto-save draft so unsaved edits persist when reopening or navigating away
      try {
        const draftObj = {
          toolId: tool.id,
          toolNo: tool.toolNo,
          checkDate,
          nextDueDate,
          items: updated,
          photos,
          preparedBy,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(draftObj));
        setHasDraft(true);
      } catch (e) {}

      return updated;
    });
  };

  // Helper to insert symbols (⌀, ±) into specification or actual condition at cursor position or append
  const handleInsertSymbol = (index, symbol, field = 'specification') => {
    if (!isEditing) return;
    setRows(prev => {
      const updated = [...prev];
      const currentText = updated[index]?.[field] || '';
      const inputId = field === 'actualCondition' ? `actual-input-${index}` : `spec-input-${index}`;
      const inputEl = document.getElementById(inputId);
      if (inputEl && typeof inputEl.selectionStart === 'number') {
        const start = inputEl.selectionStart;
        const end = inputEl.selectionEnd;
        const newText = currentText.substring(0, start) + symbol + currentText.substring(end);
        updated[index] = { ...updated[index], [field]: newText };
        setTimeout(() => {
          inputEl.focus();
          inputEl.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 10);
      } else {
        updated[index] = { ...updated[index], [field]: currentText ? `${currentText}${symbol}` : symbol };
      }

      // Auto-save draft
      try {
        const draftObj = {
          toolId: tool.id,
          toolNo: tool.toolNo,
          checkDate,
          nextDueDate,
          items: updated,
          photos,
          preparedBy,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(draftObj));
        setHasDraft(true);
      } catch (e) {}

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
        items: existing.items || existing.rows || [],
        photos: Array.isArray(existing.photos) ? existing.photos : []
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
      photos: photos,
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
    try {
      localStorage.removeItem(getDraftKey());
    } catch (e) {}
    setHasDraft(false);
    onRefresh?.();
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
  const displayPhotos = isHistorical ? (Array.isArray(currentHist?.photos) ? currentHist.photos : []) : photos;

  // Photo Upload & Camera Helpers
  const handleFilesUpload = async (e, checkpointIdx = null) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const compressedList = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 960, quality: 0.72 });
        const dataUrl = typeof compressed === 'string' ? compressed : (compressed?.dataUrl || '');
        const size = typeof compressed === 'object' && compressed?.size ? compressed.size : `${Math.round(file.size / 1024)} KB`;

        if (!dataUrl) continue;

        compressedList.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          dataUrl: dataUrl,
          name: file.name || 'Inspection Photo',
          size: size,
          checkpointIdx: checkpointIdx !== null ? checkpointIdx : null,
          checkpointName: checkpointIdx !== null
            ? (displayRows[checkpointIdx]?.checkPoint || `Check Point #${checkpointIdx + 1}`)
            : 'General Inspection',
          capturedAt: new Date().toISOString()
        });
      }
      if (compressedList.length > 0) {
        setPhotos(prev => [...prev, ...compressedList]);
        showToast?.(`Added ${compressedList.length} inspection photo(s)`, 'success');
      }
    } catch (err) {
      console.error('Image compression error:', err);
      showToast?.('Error processing image: ' + err.message, 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleDeletePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    showToast?.('Photo removed', 'info');
  };

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
              Edit Mode Active (Auto-saved as Draft)
            </span>
          ) : hasDraft ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11.5px',
                padding: '4px 12px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                borderRadius: '12px',
                fontWeight: 700,
                border: '1.5px solid #f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#d97706' }}></span>
                Draft In Progress (Unsaved Edits)
              </span>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(getDraftKey());
                  } catch (e) {}
                  setHasDraft(false);
                  loadPMDataForTool();
                  showToast?.('Draft discarded. Restored saved inspection.', 'info');
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#dc2626',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  cursor: 'pointer'
                }}
                title="Discard unsaved draft changes"
              >
                Discard Draft
              </button>
            </div>
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

      {/* Rejection Alert Banner if rejected by Management */}
      {displayApprovedBy?.status === 'Rejected' && !isHistorical && (
        <div style={{
          backgroundColor: '#fff1f2',
          borderBottom: '1.5px solid #fecdd3',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'inset 0 1px 3px rgba(225, 29, 72, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>🚨</span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>PM Checklist Rejected by Management</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#be123c', textTransform: 'none' }}>
                  ({displayApprovedBy?.name || 'Plant Incharge'} &bull; {displayApprovedBy?.date})
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#881337', marginTop: '4px', fontWeight: 600, backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '5px', border: '1px solid #fda4af' }}>
                <strong>Rejection Reason / Rework Instructions:</strong> "{displayApprovedBy?.remarks || 'Inspection rejected. Please rework and re-submit.'}"
              </div>
              <div style={{ fontSize: '11.5px', color: '#be123c', marginTop: '4px' }}>
                Please update the check points / actual condition below and click <strong>Save PM Record</strong> to re-submit for QA & Management authorization.
              </div>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setIsEditing(true);
                showToast?.('Rework mode activated. Update the inspection details and save.', 'info');
              }}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                boxShadow: '0 2px 5px rgba(220, 38, 38, 0.25)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>🛠</span>
              <span>Click to Rework PM Checklist</span>
            </button>
          )}
        </div>
      )}

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
                    Remarks
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
                      borderRight: '1px solid #334155',
                      verticalAlign: 'top'
                    }}>
                      {row.sno}
                    </td>

                    {/* Check point description (Directly retrieved from Master List) */}
                    <td style={{
                      padding: '10px 14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      borderRight: '1px solid #334155',
                      verticalAlign: 'top',
                      lineHeight: 1.5,
                      fontSize: '12.5px'
                    }}>
                      {row.checkPoint}
                    </td>

                    {/* Checking Method (Fixed specification from Master List - Read-only in PM sheet) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #334155',
                      verticalAlign: 'top',
                      width: '140px'
                    }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'center', fontWeight: 600 }}>
                        {row.method || '—'}
                      </div>
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
                    </td>

                    {/* Specification (Fixed standard from Master List - Read-only in PM sheet, no quick buttons) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #334155',
                      verticalAlign: 'top'
                    }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left' }}>
                        {row.specification || '—'}
                      </div>
                      <div
                        className="screen-only-input"
                        style={{
                          width: '100%',
                          minHeight: '54px',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: row.specification ? '#0f172a' : '#94a3b8',
                          fontWeight: 500,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          boxSizing: 'border-box'
                        }}
                      >
                        {row.specification || '—'}
                      </div>
                    </td>

                    {/* Actual Condition (Multi-line Textarea with ⌀ and ± quick insert buttons) */}
                    <td style={{
                      padding: '6px 8px',
                      borderRight: '1px solid #334155',
                      backgroundColor: '#f0f9ff',
                      verticalAlign: 'top'
                    }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>
                        {row.actualCondition || '—'}
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
                            onClick={() => handleInsertSymbol(idx, '⌀', 'actualCondition')}
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
                            onClick={() => handleInsertSymbol(idx, '±', 'actualCondition')}
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
                        id={`actual-input-${idx}`}
                        className="screen-only-input"
                        rows={2}
                        value={row.actualCondition}
                        onChange={(e) => handleRowChange(idx, 'actualCondition', e.target.value)}
                        readOnly={!isEditing || isHistorical}
                        placeholder={isEditing && !isHistorical ? "Enter actual condition / observation..." : "—"}
                        style={{
                          width: '100%',
                          minHeight: isEditing && !isHistorical ? '54px' : '62px',
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

                    {/* Remarks (Read-only observation / notes) */}
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <div className="print-only-text" style={{ fontSize: '11px', textAlign: 'left' }}>
                        {row.actionTaken || '—'}
                      </div>
                      <div
                        className="screen-only-input"
                        style={{
                          width: '100%',
                          minHeight: '54px',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '12px',
                          lineHeight: 1.45,
                          color: row.actionTaken ? '#0f172a' : '#94a3b8',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          boxSizing: 'border-box'
                        }}
                      >
                        {row.actionTaken || '—'}
                      </div>

                      {/* Row-associated inspection photos */}
                      {(() => {
                        const rowPhotos = displayPhotos.filter(p => p.checkpointIdx === idx);
                        if (rowPhotos.length === 0) return null;
                        return (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                              {rowPhotos.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => setPreviewPhoto(p)}
                                  style={{
                                    position: 'relative',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    border: '1.5px solid #2563eb',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    backgroundColor: '#0f172a'
                                  }}
                                  title="Click to view full photo"
                                >
                                  <img
                                    src={p.dataUrl}
                                    alt="Checkpoint Evidence"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              ))}
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb' }}>
                                ({rowPhotos.length} {rowPhotos.length === 1 ? 'photo' : 'photos'})
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inspection Photos & Visual Evidence Gallery */}
          <div style={{
            borderTop: '1.5px solid #334155',
            padding: '16px 18px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Inspection Photos &amp; Visual Evidence
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '12px',
                  backgroundColor: displayPhotos.length > 0 ? '#eff6ff' : '#f1f5f9',
                  color: displayPhotos.length > 0 ? '#1d4ed8' : '#64748b',
                  border: displayPhotos.length > 0 ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                }}>
                  {displayPhotos.length} {displayPhotos.length === 1 ? 'Photo' : 'Photos'}
                </span>
              </div>

              {isEditing && !isHistorical && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Device Camera Access Button */}
                  <label
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      padding: '7px 14px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(37,99,235,0.25)'
                    }}
                    title="Open device camera to capture inspection photo"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span>Device Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFilesUpload(e, null)}
                    />
                  </label>

                  {/* Upload Images Button */}
                  <label
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      border: '1.5px solid #cbd5e1',
                      fontWeight: 700,
                      padding: '7px 14px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Upload image files from computer or device"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Upload Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleFilesUpload(e, null)}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Photos List Grid */}
            {displayPhotos.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1.5px dashed #cbd5e1'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>📷</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {isEditing ? 'No photos attached yet. Click Device Camera or Upload Images to add inspection evidence.' : 'No inspection photos recorded for this PM revision.'}
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '14px'
              }}>
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      onClick={() => setPreviewPhoto(photo)}
                      style={{ cursor: 'pointer', position: 'relative', width: '100%', height: '120px', backgroundColor: '#0f172a' }}
                      title="Click to zoom / view full size"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.name || 'Inspection'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#1d4ed8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={photo.checkpointName || 'General Inspection'}>
                          {photo.checkpointName || 'General Inspection'}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: '#64748b',
                          marginTop: '3px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{photo.capturedAt ? new Date(photo.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          {photo.size && <span>{photo.size}</span>}
                        </div>
                      </div>

                      {isEditing && !isHistorical && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#dc2626',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Official Bottom 3-Column Sign-Off Block */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
           
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
              backgroundColor: displayApprovedBy?.status === 'Approved' ? '#eff6ff' : displayApprovedBy?.status === 'Rejected' ? '#fff1f2' : displayApprovedBy?.status === 'Hold' ? '#fef2f2' : '#fafafa'
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
                      {displayApprovedBy.status === 'Approved' ? '✓' : '✕'} {displayApprovedBy.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {displayApprovedBy.status} &bull; {displayApprovedBy.date || ''}
                    </span>
                    {displayApprovedBy.status === 'Rejected' && displayApprovedBy.remarks && (
                      <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, marginTop: '2px', textAlign: 'center', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayApprovedBy.remarks}>
                        Reason: {displayApprovedBy.remarks}
                      </span>
                    )}
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
            photos: displayPhotos,
            preparedBy: displayPreparedBy,
            checkedBy: displayCheckedBy,
            approvedBy: displayApprovedBy,
            history: historyList
          }}
          showToast={showToast}
        />
      )}

      {/* Lightbox Zoom / Full View Modal */}
      {previewPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  {previewPhoto.checkpointName || 'Inspection Photo'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Captured: {previewPhoto.capturedAt ? new Date(previewPhoto.capturedAt).toLocaleString() : 'N/A'} {previewPhoto.size ? `• ${previewPhoto.size}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#64748b',
                  cursor: 'pointer',
                  lineHeight: '1'
                }}
              >
                &times;
              </button>
            </div>
            <div style={{
              backgroundColor: '#090d16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              minHeight: '240px',
              maxHeight: '75vh'
            }}>
              {previewPhoto.dataUrl ? (
                <img
                  src={previewPhoto.dataUrl}
                  alt={previewPhoto.name || 'Inspection full view'}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
                  No preview available for this photo
                </div>
              )}
            </div>
            <div style={{ padding: '10px 18px', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewPhoto(null)}
                style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 700 }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
