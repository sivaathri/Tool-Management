import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatNumber } from '../../data/storage';
import AddProductionModal from './AddProductionModal';
import PMChecklistSheet from './PMChecklistSheet';

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
  const searchComboRef = useRef(null);

  useEffect(() => {
    setSelectedToolId(propSelectedToolId || null);
    if (propSelectedToolId) {
      const tool = tools.find(t => t.id === propSelectedToolId);
      if (tool) {
        setSearchInput(tool.toolNo);
      }
    }
  }, [propSelectedToolId, tools]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchComboRef.current && !searchComboRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
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

  const toolLogs = useMemo(() => {
    if (!selectedTool) return [];
    // Sort chronologically (earliest to latest)
    const logs = [...productionLogs]
      .filter(l => l.toolId === selectedTool.id || (l.toolNo && l.toolNo.toLowerCase() === selectedTool.toolNo.toLowerCase()))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalFromLogs = logs.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    const baseOffset = Math.max(0, (selectedTool.cumulative || 0) - totalFromLogs);

    let running = baseOffset;
    return logs.map(l => {
      const qty = Number(l.quantity) || 0;
      running += qty;
      return {
        ...l,
        monthDisplay: formatMonthYear(l.date),
        quantityMade: qty,
        cumulativeMade: running
      };
    });
  }, [productionLogs, selectedTool]);

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
    const alreadyExists = toolLogs.some(l => (l.month || l.date || '').slice(0, 7) === targetMonth);
    if (alreadyExists) {
      showToast(`An entry for ${formatMonthYear(targetMonth + '-01')} already exists for ${selectedTool.toolNo}. You cannot add the same month twice.`, 'warning');
      return;
    }
    onAddProductionLog(newLog);
    setIsAddLogOpen(false);
    showToast(`Logged ${formatNumber(newLog.quantity)} output for ${selectedTool.toolNo} (${formatMonthYear(newLog.date)})`, 'success');
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()} title="Export PM Card">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export</span>
          </button>
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

          <div style={{ display: 'flex', gap: '8px' }}>
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

        <div className="tool-summary-meta-grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
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

      {/* QUANTITY PRODUCED (PRODUCTION TRACKING) TABLE */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Quantity Produced (Production Tracking)</div>
          </div>
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

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th
                  rowSpan="2"
                  style={{
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    width: '28%',
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
              {toolLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--slate-400)' }}>
                    No production logs recorded yet for <strong>{selectedTool.toolNo}</strong>. Click "+ Add Quantity Record" to record output.
                  </td>
                </tr>
              ) : (
                toolLogs.map((log) => (
                  <tr key={log.id}>
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

      {/* Add Production Modal */}
      {isAddLogOpen && selectedTool && (
        <AddProductionModal
          tool={selectedTool}
          existingLogs={toolLogs}
          onClose={() => setIsAddLogOpen(false)}
          onSave={handleSaveLog}
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
    </section>
  );
}
