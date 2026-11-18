import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatNumber, exportToolsToCSV, exportPMReportToCSV } from '../../data/storage';
import AddProductionModal from './AddProductionModal';
import PMChecklistSheet from './PMChecklistSheet';
import ToolReplacementModal from './ToolReplacementModal';
import ExportReportModal from './ExportReportModal';

// Format date string to "MMM-YY" (e.g. "Oct-18", "Nov-18", "Feb-23")
function formatMonthYear(dateStr) {
  if (!dateStr) return '—';
  const str = String(dateStr).trim();
  if (/^[A-Za-z]{3}-\d{2}$/.test(str)) {
    return str;
  }
  const parts = str.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthNum >= 1 && monthNum <= 12) {
      const shortYear = year.slice(-2);
      return `${months[monthNum - 1]}-${shortYear}`;
    }
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
    }
  } catch (e) {}
  return str;
}

export default function ServiceHistoryView({ 
  tools, 
  productionLogs, 
  onAddProductionLog, 
  onDeleteProductionLog,
  onReplaceTool,
  showToast,
  selectedToolId: propSelectedToolId = null,
  onSelectToolId,
  onBackToMaster
}) {
  const [selectedToolId, setSelectedToolId] = useState(propSelectedToolId || null);
  const [searchInput, setSearchInput] = useState(() => {
    if (propSelectedToolId && Array.isArray(tools)) {
      const t = tools.find(x => x.id === propSelectedToolId);
      return t ? t.toolNo : '';
    }
    return '';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedCycleTab, setSelectedCycleTab] = useState('current');
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const searchComboRef = useRef(null);
  const cycleDropdownRef = useRef(null);

  useEffect(() => {
    setSelectedToolId(propSelectedToolId || null);
    if (propSelectedToolId) {
      const tool = tools.find(t => t.id === propSelectedToolId);
      if (tool) {
        setSearchInput(tool.toolNo);
      }
    }
  }, [propSelectedToolId, tools]);

  // Reset cycle tab whenever selected tool changes
  useEffect(() => {
    setSelectedCycleTab('current');
    setIsCycleDropdownOpen(false);
  }, [selectedToolId]);

  // Close search & cycle dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchComboRef.current && !searchComboRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(e.target)) {
        setIsCycleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTool = (id) => {
    setSelectedToolId(id);
    onSelectToolId?.(id);
    if (id) {
      const tool = tools.find(t => t.id === id);
      if (tool) {
        setSearchInput(tool.toolNo);
      }
    } else {
      setSearchInput('');
    }
  };

  const selectedTool = useMemo(() => {
    if (!selectedToolId) return null;
    return tools.find(t => t.id === selectedToolId) || null;
  }, [tools, selectedToolId]);

  const currentCycle = selectedTool ? (selectedTool.toolCount || 0) : 0;

  // Identify all past retired cycles for this tool
  const pastCycles = useMemo(() => {
    if (!selectedTool) return [];
    const set = new Set();
    (selectedTool.replacements || []).forEach(r => {
      if (r.cycle !== undefined && r.cycle !== null) set.add(Number(r.cycle));
    });
    productionLogs.forEach(l => {
      if (l.toolId === selectedTool.id || (l.toolNo && l.toolNo.toLowerCase() === selectedTool.toolNo.toLowerCase())) {
        const c = l.cycle !== undefined && l.cycle !== null ? Number(l.cycle) : 0;
        if (c < currentCycle) set.add(c);
      }
    });
    for (let i = 0; i < currentCycle; i++) {
      set.add(i);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [selectedTool, productionLogs, currentCycle]);

  // All logs belonging to this tool sorted chronologically
  const allToolLogs = useMemo(() => {
    if (!selectedTool) return [];
    return [...productionLogs]
      .filter(l => l.toolId === selectedTool.id || (l.toolNo && l.toolNo.toLowerCase() === selectedTool.toolNo.toLowerCase()))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [productionLogs, selectedTool]);

  // Calculate cumulative per cycle (starts fresh at 0 for each new cycle)
  const logsWithCycleCumulative = useMemo(() => {
    if (!selectedTool) return [];
    const byCycle = {};
    allToolLogs.forEach(l => {
      const c = l.cycle !== undefined && l.cycle !== null ? Number(l.cycle) : 0;
      if (!byCycle[c]) byCycle[c] = [];
      byCycle[c].push(l);
    });

    const result = [];
    Object.keys(byCycle).forEach(cStr => {
      const c = Number(cStr);
      const cycleLogs = byCycle[c];

      let running = 0;
      if (c === 0 && selectedTool.toolCount === 0) {
        const totalFromLogs = cycleLogs.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
        running = Math.max(0, (selectedTool.cumulative || 0) - totalFromLogs);
      }

      cycleLogs.forEach(l => {
        const qty = Number(l.quantity) || 0;
        running += qty;
        result.push({
          ...l,
          cycle: c,
          monthDisplay: formatMonthYear(l.date),
          quantityMade: qty,
          cumulativeMade: running
        });
      });
    });

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allToolLogs, selectedTool]);

  // Current displayed logs based on selected cycle tab
  const displayedLogs = useMemo(() => {
    if (!selectedTool) return [];
    if (selectedCycleTab === 'current') {
      return logsWithCycleCumulative.filter(l => (l.cycle ?? 0) === currentCycle);
    }
    if (selectedCycleTab === 'all') {
      return logsWithCycleCumulative;
    }
    const targetCycle = Number(selectedCycleTab);
    return logsWithCycleCumulative.filter(l => (l.cycle ?? 0) === targetCycle);
  }, [logsWithCycleCumulative, selectedCycleTab, currentCycle, selectedTool]);

  // Filter tools for autocomplete dropdown as user types
  const matchingTools = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) {
      return tools.slice(0, 8);
    }
    return tools.filter(t => 
      t.toolNo.toLowerCase().includes(q) || 
      (t.applicationPartNo && String(t.applicationPartNo).toLowerCase().includes(q)) ||
      (t.productName && t.productName.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tools, searchInput]);

  const handleSelectDropdownTool = (tool) => {
    handleSelectTool(tool.id);
    setSearchInput(tool.toolNo);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    showToast?.(`Selected tool ${tool.toolNo}`, 'info');
  };

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < matchingTools.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : matchingTools.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matchingTools.length) {
        e.preventDefault();
        handleSelectDropdownTool(matchingTools[highlightedIndex]);
      } else if (matchingTools.length === 1) {
        e.preventDefault();
        handleSelectDropdownTool(matchingTools[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (matchingTools.length > 0) {
      const best = (highlightedIndex >= 0 && highlightedIndex < matchingTools.length)
        ? matchingTools[highlightedIndex]
        : matchingTools[0];
      handleSelectDropdownTool(best);
      return;
    }
    if (!searchInput.trim()) {
      showToast('Please enter a tool number to search', 'warning');
      return;
    }
    showToast(`No tool found matching "${searchInput}"`, 'warning');
  };

  const handleSaveLog = (newLog) => {
    if (!selectedTool) return;
    const targetMonth = (newLog.month || newLog.date || '').slice(0, 7);
    const alreadyExists = allToolLogs.some(l => {
      const lCycle = l.cycle !== undefined && l.cycle !== null ? Number(l.cycle) : 0;
      return lCycle === currentCycle && (l.month || l.date || '').slice(0, 7) === targetMonth;
    });
    if (alreadyExists) {
      showToast(`An entry for ${formatMonthYear(targetMonth + '-01')} already exists for ${selectedTool.toolNo} in Cycle ${currentCycle}. You cannot add the same month twice.`, 'warning');
      return;
    }
    onAddProductionLog(newLog);
    setIsAddLogOpen(false);
    showToast(`Logged ${formatNumber(newLog.quantity)} output for ${selectedTool.toolNo} (${formatMonthYear(newLog.date)})`, 'success');
  };

  const handleConfirmReplace = (replacementData) => {
    if (!selectedTool) return;
    onReplaceTool?.(selectedTool.id, replacementData);
    setIsReplaceModalOpen(false);
    setSelectedCycleTab('current');
  };

  const handleExportExcel = () => {
    if (selectedTool) {
      exportPMReportToCSV(selectedTool, displayedLogs);
      showToast?.(`Preventive Maintenance report for ${selectedTool.toolNo} exported to Excel (.csv)`, 'success');
    } else {
      exportToolsToCSV(tools, 'pm_tools_summary.csv');
      showToast?.('Tools summary exported to Excel (.csv)', 'success');
    }
  };

  const handleExportPDF = () => {
    showToast?.('Opening Print view to save as PDF...', 'info');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const pct = selectedTool ? Math.min(100, Math.round((selectedTool.cumulative / (selectedTool.lifetime || 1)) * 100)) : 0;
  const isHealthy = selectedTool ? (selectedTool.status === 'Active' || selectedTool.status === 'Healthy') : false;
  const isNear = selectedTool ? selectedTool.status === 'Near Limit' : false;
  const progressClass = isHealthy ? 'progress-healthy' : isNear ? 'progress-warning' : 'progress-danger';

  return (
    <section className="view-section active" id="view-service-history">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
         
          <div>
            <h1 className="page-title">Preventive Maintenance</h1>
          </div>
        </div>
        <div className="header-actions">
          {selectedTool && (
            <button
              type="button"
              className="btn-export-pill"
              onClick={() => setIsExportModalOpen(true)}
              title="Export Report"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT SEARCH CARD */}
      <div className="prominent-search-box">
        <div className="prominent-search-header">
          <div className="prominent-search-title">Search Tool PM Card</div>
          
        </div>
        <form className="prominent-search-bar" onSubmit={handleSearchSubmit}>
          <div className="search-input-combo" ref={searchComboRef}>
            <svg className="prominent-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="prominent-input"
              id="serviceSearchInput"
              placeholder="Enter Tool Number (e.g. INE T 1122, INE T 0652)..."
              value={searchInput}
              onChange={handleInputChange}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleInputKeyDown}
              autoComplete="off"
            />

            {/* RELATED TOOLS DROPDOWN */}
            {isDropdownOpen && (
              <div className="pm-search-dropdown">
                <div className="pm-search-header-hint">
                  {matchingTools.length === 0
                    ? `No matching tools found for "${searchInput}"`
                    : `Matching Tools (${matchingTools.length}) — Click to Select`}
                </div>

                {matchingTools.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--slate-500)' }}>
                    No tool found matching "{searchInput}". Please enter a valid tool number.
                  </div>
                ) : (
                  matchingTools.map((t, idx) => {
                    const isSelected = selectedTool?.id === t.id;
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <div
                        key={t.id}
                        className={`pm-search-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelectDropdownTool(t)}
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-50)' : isHighlighted ? 'var(--slate-100)' : 'transparent'
                        }}
                      >
                        <div className="pm-search-item-left">
                          <span className="pm-search-tool-no">{t.toolNo}</span>
                          <span className="pm-search-item-meta">
                            Part #{t.applicationPartNo} • {t.productName || 'Tool'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              backgroundColor: t.status === 'Active' || t.status === 'Healthy' ? '#dcfce7' : t.status === 'Near Limit' ? '#fef3c7' : '#fee2e2',
                              color: t.status === 'Active' || t.status === 'Healthy' ? '#15803d' : t.status === 'Near Limit' ? '#b45309' : '#b91c1c'
                            }}
                          >
                            {t.status || 'Active'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--accent-600)', fontWeight: 600 }}>
                            Select ↵
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" id="btnSearchServiceTool" style={{ padding: '0 24px' }}>
            Search Tool
          </button>
          {selectedTool && (
            <button
              type="button"
              className="btn btn-secondary btn-reset-filter"
              onClick={() => {
                handleSelectTool(null);
                setSearchInput('');
              }}
              style={{ padding: '0 16px' }}
              title="Clear search"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* SHOW SERVICE DATA ONLY WHEN A TOOL HAS BEEN SEARCHED / SELECTED */}
      {selectedTool ? (
        <>
          {/* SELECTED TOOL SUMMARY DIGITAL CARD */}
          <div className="tool-summary-card" id="selectedToolSummaryCard">
        <div className="tool-summary-top">
          <div className="tool-summary-left">
            <div className="tool-badge-large" id="shToolTypeBadge">
              {selectedTool.toolNo.charAt(0) || 'T'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--slate-900)' }} id="shToolNumber">
                  {selectedTool.toolNo}
                </h2>
                <span className={`badge ${isHealthy ? 'badge-healthy' : isNear ? 'badge-warning' : 'badge-danger'}`} id="shToolStatusBadge">
                  <span className="badge-dot"></span>
                  <span>{selectedTool.status}</span>
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '2px' }} id="shToolDescription">
                {selectedTool.description || 'Precision Manufacturing Tool'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Quick button to toggle & view old preserved data */}
            {pastCycles.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                id="btnToggleOldRecordsTop"
                onClick={() => {
                  setSelectedCycleTab(selectedCycleTab === 'current' ? (pastCycles[pastCycles.length - 1].toString()) : 'current');
                  const el = document.getElementById('quantityProducedCard');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '9px 15px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: selectedCycleTab !== 'current' ? '#eff6ff' : '#ffffff',
                  color: selectedCycleTab !== 'current' ? '#1d4ed8' : 'var(--slate-700)',
                  borderColor: selectedCycleTab !== 'current' ? '#bfdbfe' : '#cbd5e1'
                }}
                title={selectedCycleTab === 'current' ? 'Click to jump down and view old preserved data' : 'Click to view fresh active cycle'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{selectedCycleTab === 'current' ? '📜 View Old Data' : '✨ View Fresh Cycle'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              id="btnAddProductionRecordBtn"
              onClick={() => setIsAddLogOpen(true)}
              style={{
                backgroundColor: '#059669',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Monthly Production</span>
            </button>
          </div>
        </div>

        <div className="tool-summary-meta-grid" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
          <div className="meta-item">
            <span className="meta-label">App Part No (Parent)</span>
            <span className="meta-val" id="shAppPartVal" style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
              {selectedTool.applicationPartNo}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Product Name</span>
            <span className="meta-val" id="shProductVal" style={{ textAlign: 'left' }}>{selectedTool.productName || '—'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Classification</span>
            <span className="meta-val" id="shClassificationVal" style={{ textAlign: 'left' }}>{selectedTool.classification || 'Non-Critical'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Tool Issued On</span>
            <span className="meta-val" id="shToolIssuedOnVal" style={{ fontSize: '13.5px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--slate-700)', textAlign: 'left' }}>
              {selectedTool.toolIssuedOn || '—'}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Tool Count</span>
            <span className="meta-val" id="shToolCountVal" style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
              {selectedTool.toolCount ?? 0}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Life Time Limit</span>
            <span className="meta-val" id="shRepLimitVal" style={{ fontSize: '15px', color: 'var(--accent-700)', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'left' }}>
              {formatNumber(selectedTool.lifetime)}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Current Cumulative</span>
            <span className="meta-val" id="shCumulativeVal" style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'left' }}>
              {formatNumber(selectedTool.cumulative)}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Remaining Balance</span>
            <span
              className="meta-val"
              id="shBalanceVal"
              style={{ fontSize: '15px', color: selectedTool.balance <= 0 ? '#dc2626' : '#d97706', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'left' }}
            >
              {formatNumber(selectedTool.balance)}
            </span>
          </div>
        </div>

        <div className="tool-summary-progress">
          <div className="progress-info-row">
            <span>Tool Life Utilization</span>
            <span id="shUtilizationPct">{pct}% Used (Replacement threshold at 80% and 100%)</span>
          </div>
          <div className="progress-bar-wrap">
            <div
              className={`progress-bar-fill ${progressClass}`}
              id="shProgressBarFill"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* PREVENTIVE MAINTENANCE CHECK LIST SHEET (ENTER DATA) */}
      <PMChecklistSheet tool={selectedTool} showToast={showToast} />

      {/* LIFE TIME LIMIT OVERRUN ALERT BANNER */}
      {selectedTool.status === 'Replacement Due' && (
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#991b1b', fontSize: '15px', fontWeight: 800 }}>
                Tool Life Time Limit Reached: {formatNumber(selectedTool.cumulative)} / {formatNumber(selectedTool.lifetime)} strokes (100% Used)
              </div>
              <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '3px', lineHeight: 1.45 }}>
                This tool has completed its rated life limit. Click <strong>Replace Tool</strong> to start a fresh production cycle (cumulative reset to 0, full balance restored). All historical records are permanently preserved.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setIsReplaceModalOpen(true)}
            style={{
              padding: '9px 20px',
              fontSize: '13.5px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              backgroundColor: '#dc2626',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)'
            }}
          >
            Replace Tool Now
          </button>
        </div>
      )}

      {/* QUANTITY PRODUCED (PRODUCTION TRACKING) TABLE WITH CYCLE SEGREGATION */}
      <div className="card" id="quantityProducedCard" style={{ marginTop: '24px' }}>
        <div className="card-header" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Quantity Produced (Production Tracking)
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
              Cycle-based production history. Replacing a tool starts a fresh cycle while preserving all historical records.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Dedicated button to click and see old data */}
            {pastCycles.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                id="btnClickToSeeOldData"
                onClick={() => setSelectedCycleTab(selectedCycleTab === 'current' ? (pastCycles[pastCycles.length - 1].toString()) : 'current')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  backgroundColor: selectedCycleTab === 'current' ? '#eff6ff' : '#0284c7',
                  color: selectedCycleTab === 'current' ? '#1d4ed8' : '#ffffff',
                  borderColor: selectedCycleTab === 'current' ? '#bfdbfe' : '#0284c7'
                }}
                title={selectedCycleTab === 'current' ? 'Click to see previous cycle records' : 'Click to see fresh active cycle'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{selectedCycleTab === 'current' ? '📜 Click to View Old Data' : '✨ Back to Fresh Active Cycle'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddLogOpen(true)}
              style={{
                backgroundColor: '#059669',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Quantity Record</span>
            </button>
          </div>
        </div>

        {/* CYCLE SELECTOR TABS / NAVIGATION BAR */}
        <div style={{
          padding: '12px 18px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '4px' }}>
              Cycle View:
            </span>

            {/* Current Active / Fresh Cycle Tab */}
            <button
              type="button"
              className={`btn btn-sm ${selectedCycleTab === 'current' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCycleTab('current')}
              style={{
                fontWeight: 700,
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: selectedCycleTab === 'current' ? '#0284c7' : '#ffffff',
                borderColor: selectedCycleTab === 'current' ? '#0284c7' : '#cbd5e1'
              }}
            >
              🟢 Current Cycle (Cycle {currentCycle}) {selectedCycleTab === 'current' ? '• Fresh' : ''}
            </button>

            {/* Previous Retired Cycles: Dropdown if more than 1 cycle, or single button if 1 cycle */}
            {pastCycles.length > 1 ? (
              <div style={{ position: 'relative', display: 'inline-block' }} ref={cycleDropdownRef}>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedCycleTab !== 'current' && selectedCycleTab !== 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                  style={{
                    fontWeight: 700,
                    fontSize: '12.5px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: selectedCycleTab !== 'current' && selectedCycleTab !== 'all' ? '#334155' : '#ffffff',
                    color: selectedCycleTab !== 'current' && selectedCycleTab !== 'all' ? '#ffffff' : '#334155',
                    borderColor: selectedCycleTab !== 'current' && selectedCycleTab !== 'all' ? '#334155' : '#cbd5e1'
                  }}
                  title="Click dropdown to select and view a past cycle"
                >
                  <span>
                    📁 {selectedCycleTab !== 'current' && selectedCycleTab !== 'all' 
                      ? `Cycle ${selectedCycleTab} (History)` 
                      : `Past Cycles (${pastCycles.length})`}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: isCycleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.18s ease'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown Menu to click and view any past cycle */}
                {isCycleDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
                    minWidth: '220px',
                    zIndex: 100,
                    overflow: 'hidden',
                    padding: '6px 0'
                  }}>
                    <div style={{
                      padding: '6px 14px 4px 14px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Select Past Cycle ({pastCycles.length} available)
                    </div>

                    {pastCycles.map(c => {
                      const isSelected = selectedCycleTab === String(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCycleTab(String(c));
                            setIsCycleDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '9px 14px',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            backgroundColor: isSelected ? '#f1f5f9' : '#ffffff',
                            color: isSelected ? '#0f172a' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>📁</span>
                            <span>Cycle {c} (History)</span>
                          </span>
                          {isSelected && (
                            <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '14px' }}>✓</span>
                          )}
                        </button>
                      );
                    })}

                    <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }}></div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCycleTab('all');
                        setIsCycleDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 14px',
                        fontSize: '13px',
                        fontWeight: selectedCycleTab === 'all' ? 700 : 500,
                        backgroundColor: selectedCycleTab === 'all' ? '#f1f5f9' : '#ffffff',
                        color: selectedCycleTab === 'all' ? '#0f172a' : '#334155',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCycleTab !== 'all') e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCycleTab !== 'all') e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>📑</span>
                        <span>All Cycles Combined</span>
                      </span>
                      {selectedCycleTab === 'all' && (
                        <span style={{ color: '#0284c7', fontWeight: 800, fontSize: '14px' }}>✓</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : pastCycles.length === 1 ? (
              <button
                key={pastCycles[0]}
                type="button"
                className={`btn btn-sm ${selectedCycleTab === String(pastCycles[0]) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCycleTab(String(pastCycles[0]))}
                style={{
                  fontWeight: 600,
                  fontSize: '12.5px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: selectedCycleTab === String(pastCycles[0]) ? '#475569' : '#ffffff',
                  borderColor: selectedCycleTab === String(pastCycles[0]) ? '#475569' : '#cbd5e1'
                }}
              >
                📁 Cycle {pastCycles[0]} (History)
              </button>
            ) : null}

            {/* All Cycles Combined Tab */}
            {(pastCycles.length > 0 || currentCycle > 0) && (
              <button
                type="button"
                className={`btn btn-sm ${selectedCycleTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCycleTab('all')}
                style={{
                  fontWeight: 600,
                  fontSize: '12.5px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: selectedCycleTab === 'all' ? '#1e293b' : '#ffffff',
                  borderColor: selectedCycleTab === 'all' ? '#1e293b' : '#cbd5e1'
                }}
              >
                📑 All Cycles History
              </button>
            )}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>ℹ️</span>
            {selectedCycleTab === 'current' ? (
              <span>Showing fresh production records for active <strong>Cycle {currentCycle}</strong> (Fresh Cumulative: {formatNumber(selectedTool.cumulative)})</span>
            ) : selectedCycleTab === 'all' ? (
              <span>Showing complete history across all cycles. Old records are permanently preserved.</span>
            ) : (
              <span>Showing preserved historical production records for retired <strong>Cycle {selectedCycleTab}</strong></span>
            )}
          </div>
        </div>

        {/* Historical View Active Notice */}
        {selectedCycleTab !== 'current' && (
          <div style={{
            margin: '12px 18px',
            padding: '10px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#1e40af' }}>
              <span style={{ fontSize: '15px' }}>🔒</span>
              <span>
                <strong>Old Records View:</strong> You are viewing preserved historical data for {selectedCycleTab === 'all' ? 'All Past Cycles' : `Cycle ${selectedCycleTab}`}. Old data is never deleted.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setSelectedCycleTab('current')}
              style={{ fontSize: '12px', padding: '4px 14px', fontWeight: 700, backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              ✨ Switch Back to Fresh Active Cycle
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                {selectedCycleTab === 'all' && (
                  <th
                    rowSpan="2"
                    style={{
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      width: '120px',
                      borderRight: '1px solid var(--border-subtle)'
                    }}
                  >
                    CYCLE
                  </th>
                )}
                <th
                  rowSpan="2"
                  style={{
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    width: selectedCycleTab === 'all' ? '22%' : '28%',
                    borderRight: '1px solid var(--border-subtle)'
                  }}
                >
                  MONTH
                </th>
                <th
                  colSpan="2"
                  style={{
                    textAlign: 'center',
                    borderRight: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  QUANTITY
                </th>
                <th
                  rowSpan="2"
                  style={{
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    width: '100px'
                  }}
                >
                  ACTION
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    textAlign: 'center',
                    width: '32%',
                    borderRight: '1px solid var(--border-subtle)'
                  }}
                >
                  MADE
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    width: '32%',
                    borderRight: '1px solid var(--border-subtle)'
                  }}
                >
                  CUMULATIVE
                </th>
              </tr>
            </thead>
            <tbody id="quantityProducedTableBody">
              {displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={selectedCycleTab === 'all' ? 5 : 4} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--slate-500)' }}>
                    {selectedCycleTab === 'current' ? (
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                          ✨ Fresh Cycle {currentCycle} Active (0 strokes logged)
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--slate-500)', maxWidth: '520px', margin: '0 auto 12px auto' }}>
                          This tool is currently running on a fresh replacement cycle. Full stroke limit balance of <strong>{formatNumber(selectedTool.lifetime)}</strong> is available. Click <strong>+ Add Quantity Record</strong> above to begin logging monthly production.
                        </div>
                        {pastCycles.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#1e40af', backgroundColor: '#eff6ff', display: 'inline-block', padding: '4px 12px', borderRadius: '12px' }}>
                            🔒 Previous cycle records are preserved and available under the <strong>📁 Cycle {pastCycles.join(', ')}</strong> tabs above.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        No records found for Cycle {selectedCycleTab}.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                displayedLogs.map((log) => (
                  <tr key={log.id}>
                    {/* Optional CYCLE column when viewing All Cycles */}
                    {selectedCycleTab === 'all' && (
                      <td style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: log.cycle === currentCycle ? '#dbeafe' : '#f1f5f9',
                          color: log.cycle === currentCycle ? '#1d4ed8' : '#475569',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          Cycle {log.cycle ?? 0} {log.cycle === currentCycle ? '(Active)' : ''}
                        </span>
                      </td>
                    )}

                    {/* MONTH */}
                    <td style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--slate-800)', fontSize: '13.5px' }}>
                        {log.monthDisplay}
                      </span>
                    </td>

                    {/* MADE */}
                    <td style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-700)', fontSize: '14px' }}>
                        {formatNumber(log.quantityMade)}
                      </span>
                    </td>

                    {/* CUMULATIVE */}
                    <td style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#1e40af', fontSize: '14px' }}>
                        {formatNumber(log.cumulativeMade)}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-trash-outline"
                        onClick={() => onDeleteProductionLog(log.id)}
                        title="Delete entry"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 7V4.5C9 3.67 9.67 3 10.5 3h3c.83 0 1.5.67 1.5 1.5V7" />
                          <line x1="4" y1="7" x2="20" y2="7" />
                          <path d="M6 7l1.2 11.5c.08.84.78 1.5 1.63 1.5h6.34c.85 0 1.55-.66 1.63-1.5L18 7" />
                          <line x1="10" y1="11" x2="10" y2="16" />
                          <line x1="14" y1="11" x2="14" y2="16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOOL REPLACEMENT & OVERHAUL HISTORY LOG */}
      {selectedTool.replacements && selectedTool.replacements.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>
              <div>
                <div className="card-title" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)' }}>
                  Tool Replacement & Overhaul History ({selectedTool.replacements.length})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                  Permanent log of life limit completions, die set renewals, and cycle transitions
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '130px', textAlign: 'center' }}>DATE</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>CYCLE TRANSITION</th>
                  <th style={{ width: '170px', textAlign: 'right' }}>STROKES AT RETIREMENT</th>
                  <th style={{ width: '180px' }}>AUTHORIZED BY</th>
                  <th>REASON & REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {selectedTool.replacements.map((rep) => (
                  <tr key={rep.id}>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                      {rep.replacementDate}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        Cycle {rep.cycle} ➔ Cycle {rep.newCycle}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#dc2626', fontSize: '13.5px' }}>
                      {formatNumber(rep.finalCumulative)} / {formatNumber(rep.lifetimeLimit)}
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-800)' }}>
                      {rep.replacedBy}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
                      {rep.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Production Modal */}
      {isAddLogOpen && selectedTool && (
        <AddProductionModal
          tool={selectedTool}
          existingLogs={allToolLogs}
          onClose={() => setIsAddLogOpen(false)}
          onSave={handleSaveLog}
        />
      )}

      {/* Tool Replacement Modal */}
      {isReplaceModalOpen && selectedTool && (
        <ToolReplacementModal
          tool={selectedTool}
          isOpen={isReplaceModalOpen}
          onClose={() => setIsReplaceModalOpen(false)}
          onConfirm={handleConfirmReplace}
        />
      )}
        </>
      ) : (
        /* Empty State: Shown before searching for a tool */
        <div
          className="card"
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            marginTop: '20px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--slate-100)',
              color: 'var(--accent-600)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
            Search for a Tool to View Preventive Maintenance
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
            Please enter a Tool Number in the search box above (e.g. <strong style={{ color: 'var(--accent-600)', fontFamily: 'var(--font-mono)' }}>INE T 1122</strong>) or select a tool from the Master List to display its full preventive maintenance card, specifications, inspection check points, and production records.
          </p>
        </div>
      )}

      {/* Export Report Choice Modal (Excel vs PDF) */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        tool={selectedTool}
      />
    </section>
  );
}
