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
  const [searchInput, setSearchInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const searchComboRef = useRef(null);

  useEffect(() => {
    setSelectedToolId(propSelectedToolId || null);
  }, [propSelectedToolId]);

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
    onAddProductionLog(newLog);
    setIsAddLogOpen(false);
    showToast(`Logged ${formatNumber(newLog.quantity)} output for ${selectedTool.toolNo}`, 'success');
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print PM Card</span>
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
              className="btn btn-primary btn-sm"
              id="btnAddProductionRecordBtn"
              onClick={() => setIsAddLogOpen(true)}
              style={{ backgroundColor: '#059669' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add Monthly Production</span>
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

      {/* QUANTITY PRODUCED TABLE - OFFICIAL YELLOW CARD FORMAT */}
      <div className="card" style={{ marginTop: '24px', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Quantity Produced (Production Tracking)
            </div>
            <div className="card-subtitle" style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
              Official Tool Production Card tracking monthly quantity made and progressive cumulative count
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddLogOpen(true)}
            style={{ backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Add Quantity Record</span>
          </button>
        </div>

        {/* Physical Yellow Card Container */}
        <div style={{ padding: '24px 20px', backgroundColor: '#f8fafc' }}>
          <div style={{
            maxWidth: '620px',
            margin: '0 auto',
            backgroundColor: '#fef08a',
            border: '2px solid #000000',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: '#000000',
              fontFamily: 'var(--font-sans)'
            }}>
              <thead>
                {/* Header Row 1 */}
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <th
                    rowSpan="2"
                    style={{
                      width: '32%',
                      padding: '10px 14px',
                      borderRight: '2px solid #000000',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      backgroundColor: '#fef08a'
                    }}
                  >
                    MONTH
                  </th>
                  <th
                    colSpan="2"
                    style={{
                      padding: '8px 14px',
                      borderRight: '2px solid #000000',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      backgroundColor: '#fef08a',
                      borderBottom: '2px solid #000000'
                    }}
                  >
                    QUANTITY
                  </th>
                  <th
                    rowSpan="2"
                    style={{
                      width: '12%',
                      padding: '8px',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      backgroundColor: '#fef08a',
                      color: '#475569'
                    }}
                  >
                    ACTION
                  </th>
                </tr>

                {/* Header Row 2 */}
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <th
                    style={{
                      width: '28%',
                      padding: '8px 12px',
                      borderRight: '2px solid #000000',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      backgroundColor: '#fef08a'
                    }}
                  >
                    MADE
                  </th>
                  <th
                    style={{
                      width: '28%',
                      padding: '8px 12px',
                      borderRight: '2px solid #000000',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      backgroundColor: '#fef08a'
                    }}
                  >
                    CUMULATIVE
                  </th>
                </tr>
              </thead>
              <tbody id="quantityProducedTableBody">
                {toolLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '36px 16px', textAlign: 'center', color: '#475569', fontSize: '13px', backgroundColor: '#fef9c3' }}>
                      No production logs recorded yet for <strong>{selectedTool.toolNo}</strong>.<br />
                      Click <strong>"+ Add Quantity Record"</strong> to add monthly output.
                    </td>
                  </tr>
                ) : (
                  toolLogs.map((log, idx) => (
                    <tr
                      key={log.id || idx}
                      style={{
                        borderBottom: idx === toolLogs.length - 1 ? 'none' : '1.5px solid #000000',
                        backgroundColor: '#fef08a'
                      }}
                    >
                      {/* MONTH */}
                      <td style={{
                        padding: '10px 14px',
                        borderRight: '2px solid #000000',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: '#000000',
                        textAlign: 'center'
                      }}>
                        {log.monthDisplay}
                      </td>

                      {/* MADE */}
                      <td style={{
                        padding: '10px 14px',
                        borderRight: '2px solid #000000',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: '#000000',
                        textAlign: 'center'
                      }}>
                        {formatNumber(log.quantityMade)}
                      </td>

                      {/* CUMULATIVE */}
                      <td style={{
                        padding: '10px 14px',
                        borderRight: '2px solid #000000',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: '#000000',
                        textAlign: 'center'
                      }}>
                        {formatNumber(log.cumulativeMade)}
                      </td>

                      {/* ACTION */}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-delete"
                          onClick={() => onDeleteProductionLog(log.id)}
                          title="Delete entry"
                          style={{
                            width: '26px',
                            height: '26px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#b91c1c',
                            cursor: 'pointer'
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
      </div>

      {/* Add Production Modal */}
      {isAddLogOpen && selectedTool && (
        <AddProductionModal
          tool={selectedTool}
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
