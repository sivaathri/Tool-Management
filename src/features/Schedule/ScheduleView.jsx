import React, { useState, useMemo, useEffect } from 'react';
import {
  getSchedules,
  saveSchedule,
  getYearlyPMPlans,
  saveYearlyPMPlan,
  toggleYearlyPlanWeek,
  getDueYearlyPMSchedules
} from '../../services/toolService';
import {
  getCurrentFiscalYear,
  getFiscalYearMonths,
  getCurrentWeekSlot,
  generatePresetWeeks,
  exportYearlyScheduleMatrixCSV
} from '../../utils/pmYearlySchedule';

export default function ScheduleView({ tools = [], onNavigateToPM, showToast, onRefresh }) {
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' (48-Week Grid) or 'list' (Tool List)
  const [fiscalYear, setFiscalYear] = useState(() => getCurrentFiscalYear());
  const [yearlyPlans, setYearlyPlans] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedPartNo, setSelectedPartNo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');

  // Modal for planning an Application Part PM Schedule
  const [planningPart, setPlanningPart] = useState(null);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState('Quarterly');

  // Single tool legacy modal
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);

  const currentSlot = useMemo(() => getCurrentWeekSlot(), []);
  const months = useMemo(() => getFiscalYearMonths(fiscalYear), [fiscalYear]);

  const loadData = () => {
    const list = getSchedules();
    setSchedules(list);
    const plans = getYearlyPMPlans(fiscalYear);
    setYearlyPlans(plans);
  };

  useEffect(() => {
    loadData();
  }, [tools, fiscalYear]);

  // Due schedules for automatic notification trigger
  const dueSchedules = useMemo(() => {
    return getDueYearlyPMSchedules(fiscalYear);
  }, [yearlyPlans, fiscalYear]);

  // Check if user has explicitly searched or selected an Application Part No
  const hasActiveSearchOrSelect = Boolean(selectedPartNo || searchTerm.trim());

  // Filtered yearly plans: "without search no need to show the data"
  const filteredPlans = useMemo(() => {
    if (!hasActiveSearchOrSelect) {
      return [];
    }

    return yearlyPlans.filter(p => {
      if (selectedPartNo) {
        return (p.applicationPartNo || '').toLowerCase().trim() === selectedPartNo.toLowerCase().trim();
      }
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        (p.applicationPartNo && p.applicationPartNo.toLowerCase().includes(q)) ||
        (p.productName && p.productName.toLowerCase().includes(q)) ||
        (p.toolNos && p.toolNos.some(no => no.toLowerCase().includes(q)));

      const matchClass = !classificationFilter || p.classification === classificationFilter;
      return matchSearch && matchClass;
    });
  }, [yearlyPlans, selectedPartNo, searchTerm, classificationFilter, hasActiveSearchOrSelect]);

  // The active selected plan (if single part is selected or filtered)
  const activeSelectedPlan = useMemo(() => {
    if (selectedPartNo) {
      return yearlyPlans.find(p => (p.applicationPartNo || '').toLowerCase().trim() === selectedPartNo.toLowerCase().trim());
    }
    if (filteredPlans.length === 1) {
      return filteredPlans[0];
    }
    return null;
  }, [yearlyPlans, selectedPartNo, filteredPlans]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalParts = yearlyPlans.length;
    const allToolsSet = new Set();
    let totalPlannedSlots = 0;
    yearlyPlans.forEach(p => {
      (p.toolNos || []).forEach(t => allToolsSet.add(t));
      totalPlannedSlots += (p.plannedWeeks || []).length;
    });

    const totalDependentTools = allToolsSet.size;
    const dueCount = dueSchedules.length;
    return { totalParts, totalDependentTools, totalPlannedSlots, dueCount };
  }, [yearlyPlans, dueSchedules]);

  // Direct 1-Click Cell Toggle in 48-Week Matrix
  const handleToggleCell = (partNo, slotKey) => {
    const success = toggleYearlyPlanWeek(partNo, fiscalYear, slotKey);
    if (success) {
      loadData();
      onRefresh?.();
      const targetPlan = yearlyPlans.find(p => (p.applicationPartNo || '').toLowerCase().trim() === partNo.toLowerCase().trim());
      const isNowPlanned = !(targetPlan?.plannedWeeks || []).includes(slotKey);
      showToast?.(
        `${isNowPlanned ? 'Planned PM (*)' : 'Removed PM'} for Part #${partNo} in ${slotKey.replace('_', ' ')}`,
        'info'
      );
    }
  };

  // Open Plan Modal for Part
  const handleOpenPlanModal = (partItem) => {
    setPlanningPart(partItem);
    setSelectedWeeks(Array.isArray(partItem.plannedWeeks) ? [...partItem.plannedWeeks] : []);
    setSelectedFrequency('Custom');
  };

  // Apply Quick Recurrence Preset
  const handleApplyPreset = (freq) => {
    setSelectedFrequency(freq);
    if (freq === 'Clear') {
      setSelectedWeeks([]);
      return;
    }
    const generated = generatePresetWeeks(fiscalYear, freq);
    setSelectedWeeks(generated);
  };

  // Toggle single week in modal
  const handleModalToggleWeek = (slotKey) => {
    setSelectedWeeks(prev =>
      prev.includes(slotKey) ? prev.filter(w => w !== slotKey) : [...prev, slotKey]
    );
    setSelectedFrequency('Custom');
  };

  // Save Plan Modal
  const handleSavePlanModal = (e) => {
    e.preventDefault();
    if (!planningPart) return;

    saveYearlyPMPlan({
      ...planningPart,
      fiscalYear,
      plannedWeeks: selectedWeeks
    });

    loadData();
    onRefresh?.();
    setPlanningPart(null);
    showToast?.(`Yearly PM Schedule saved for Part #${planningPart.applicationPartNo} (${selectedWeeks.length} inspections planned)`, 'success');
  };

  // Export 48-Week CSV
  const handleExportMatrixCSV = () => {
    if (filteredPlans.length === 0) {
      showToast?.('No schedule plans to export', 'info');
      return;
    }
    exportYearlyScheduleMatrixCSV(fiscalYear, filteredPlans);
    showToast?.(`Yearly PM Schedule (${fiscalYear}) exported successfully!`, 'success');
  };

  return (
    <section className="view-section active" id="view-schedule">
      
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Preventive Maintenance Schedule
            </h1>
            <span style={{
              backgroundColor: '#1e3a5f',
              color: '#fde047',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)'
            }}>
              FY {fiscalYear}
            </span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--slate-500)', fontSize: '13px', marginTop: '4px' }}>
            Yearly PM inspection plan (48-week matrix by Application Part No & dependent tool catalog)
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Fiscal Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Year:</label>
            <select
              className="form-select"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              style={{ height: '36px', padding: '4px 10px', fontSize: '12.5px', fontWeight: 700 }}
            >
              <option value="2025-2026">FY 2025-2026 (Apr 25 - Mar 26)</option>
              <option value="2026-2027">FY 2026-2027 (Apr 26 - Mar 27)</option>
              <option value="2027-2028">FY 2027-2028 (Apr 27 - Mar 28)</option>
            </select>
          </div>

          {/* Export Matrix CSV */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportMatrixCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              height: '36px',
              fontSize: '12.5px',
              fontWeight: 600
            }}
            title="Download full 48-week yearly schedule grid in Excel/CSV format"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Plan (.csv)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '18px'
      }}>
        {/* Total Application Parts */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #1e3a5f' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Application Part Numbers
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {metrics.totalParts}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Unique part lines under PM plan
          </div>
        </div>

        {/* Dependent Tools */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Dependent Tool Catalog
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>
            {metrics.totalDependentTools}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Active dies & routing fixtures
          </div>
        </div>

        {/* PM Due This Week / Month */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', backgroundColor: metrics.dueCount > 0 ? '#fffbeb' : '#ffffff' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: metrics.dueCount > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            PM Scheduled Due Now
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: metrics.dueCount > 0 ? '#d97706' : '#0f172a', marginTop: '4px' }}>
            {metrics.dueCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {metrics.dueCount > 0 ? `Requires PM in ${currentSlot.label}` : 'No PM due this week'}
          </div>
        </div>

        {/* Active Planned Slots */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Yearly Planned Inspections
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {metrics.totalPlannedSlots}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Total scheduled inspection weeks
          </div>
        </div>
      </div>

      {/* Automatic Notification Trigger Banner if Scheduled PM is Due */}
      {dueSchedules.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🗓</span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e40af' }}>
                SCHEDULED PM INSPECTION DUE: {dueSchedules.length} part line(s) planned for {currentSlot.label}
              </div>
              <div style={{ fontSize: '12.5px', color: '#1d4ed8', marginTop: '2px' }}>
                Parts ({dueSchedules.map(d => d.applicationPartNo).join(', ')}) have planned preventive maintenance in the current period.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {dueSchedules.map((d, idx) => {
              const firstTool = tools.find(t => 
                (d.toolNos || []).some(no => no && t.toolNo && t.toolNo.toLowerCase().trim() === no.toLowerCase().trim()) ||
                (t.applicationPartNo && t.applicationPartNo.toLowerCase().trim() === (d.applicationPartNo || '').toLowerCase().trim())
              ) || { id: d.toolNos?.[0] || d.applicationPartNo, toolNo: d.toolNos?.[0] || 'Tool' };

              return (
                <button
                  key={idx}
                  type="button"
                  className="btn"
                  onClick={() => onNavigateToPM?.(firstTool)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title={`Start PM inspection for Part #${d.applicationPartNo}`}
                >
                  <span>Start PM: Part #{d.applicationPartNo}</span>
                  <span>&rarr;</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar & View Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* View Switcher Tabs */}
        <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'matrix' ? '#ffffff' : 'transparent',
              color: viewMode === 'matrix' ? '#0f172a' : '#64748b',
              boxShadow: viewMode === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🗓</span>
            <span>Yearly Schedule Matrix (48 Weeks)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
              color: viewMode === 'list' ? '#0f172a' : '#64748b',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span>
            <span>Tool-by-Tool Details</span>
          </button>
        </div>

        {/* Search & Filter - 1st Search, Select App Part No */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Part Dropdown Selector */}
          <select
            className="form-select"
            value={selectedPartNo}
            onChange={(e) => {
              setSelectedPartNo(e.target.value);
              setSearchTerm('');
            }}
            style={{
              height: '36px',
              fontSize: '12.5px',
              fontWeight: selectedPartNo ? 700 : 500,
              minWidth: '230px',
              borderColor: selectedPartNo ? '#3b82f6' : '#cbd5e1',
              backgroundColor: selectedPartNo ? '#eff6ff' : '#ffffff'
            }}
          >
            <option value="">— 🔍 1st: Select Application Part No —</option>
            {yearlyPlans.map(p => (
              <option key={p.applicationPartNo} value={p.applicationPartNo}>
                Part #{p.applicationPartNo} - {p.productName || 'Tool'} ({(p.toolNos || []).length} Tools)
              </option>
            ))}
          </select>

          {/* Text Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Or Search Part No, Tool No..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedPartNo('');
              }}
              style={{ width: '220px', height: '36px', fontSize: '12.5px', paddingRight: searchTerm ? '28px' : '10px' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
                title="Clear Search"
              >
                &times;
              </button>
            )}
          </div>

          <select
            className="form-select"
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            style={{ height: '36px', fontSize: '12.5px' }}
          >
            <option value="">All Classifications</option>
            <option value="Critical">Critical</option>
            <option value="Non-Critical">Non-Critical</option>
          </select>

          {hasActiveSearchOrSelect && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSelectedPartNo('');
                setSearchTerm('');
              }}
              style={{ height: '36px', fontSize: '12px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Reset Search and Selection"
            >
              <span>✕ Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Selected Application Part Planning Bar (When user searched & selected) */}
      {viewMode === 'matrix' && activeSelectedPlan && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1.5px solid #3b82f6',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 10px rgba(59, 130, 246, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1.5px solid #3b82f6',
              borderRadius: '8px',
              padding: '6px 14px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 900,
              fontSize: '16px',
              color: '#1d4ed8',
              letterSpacing: '0.5px'
            }}>
              Part #{activeSelectedPlan.applicationPartNo}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a' }}>
                  {activeSelectedPlan.productName || 'Manufacturing Line'}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: activeSelectedPlan.classification === 'Critical' ? '#fee2e2' : '#f1f5f9',
                  color: activeSelectedPlan.classification === 'Critical' ? '#dc2626' : '#475569'
                }}>
                  {activeSelectedPlan.classification || 'Non-Critical'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                  Dependent Tool Numbers ({(activeSelectedPlan.toolNos || []).length}):
                </span>
                {(activeSelectedPlan.toolNos || []).map(tNo => (
                  <span
                    key={tNo}
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '1px 8px',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd'
                    }}
                  >
                    {tNo}
                  </span>
                ))}
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #a7f3d0'
                }}>
                  ★ {(activeSelectedPlan.plannedWeeks || []).length} Planned Week(s) in FY {fiscalYear}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenPlanModal(activeSelectedPlan)}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                padding: '9px 18px',
                borderRadius: '6px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
              }}
              title="Open Month & Week Multi-Select Modal"
            >
              <span>🛠 Select Month & Week (Plan)</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                saveYearlyPMPlan(fiscalYear, activeSelectedPlan);
                loadData();
                onRefresh?.();
                showToast?.(`Yearly PM Schedule plan saved for Part #${activeSelectedPlan.applicationPartNo} (${(activeSelectedPlan.plannedWeeks || []).length} weeks)`, 'success');
              }}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                padding: '9px 18px',
                borderRadius: '6px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
              title="Save PM Schedule to Database"
            >
              <span>💾 Save Plan</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSelectedPartNo('');
                setSearchTerm('');
              }}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '9px 12px',
                borderRadius: '6px'
              }}
              title="Clear selection to search another part"
            >
              <span>✕ Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: THE YEARLY SCHEDULE MATRIX (48-WEEK INDUSTRIAL GRID) */}
      {viewMode === 'matrix' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div className="table-responsive" style={{ margin: 0, maxHeight: '68vh', overflowX: 'auto', overflowY: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'center',
              fontSize: '11.5px',
              fontFamily: 'inherit'
            }}>
              <thead>
                {/* Row 1: MONTH (Dark Blue Header matching the uploaded industrial sheet) */}
                <tr style={{ backgroundColor: '#132847', color: '#fde047' }}>
                  <th style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 20,
                    backgroundColor: '#132847',
                    color: '#fde047',
                    padding: '8px 12px',
                    fontWeight: 900,
                    fontSize: '11.5px',
                    letterSpacing: '0.5px',
                    borderRight: '1px solid #23416d',
                    minWidth: '130px',
                    textAlign: 'left'
                  }}>
                    APPLICATION PART NO
                  </th>
                  <th style={{
                    position: 'sticky',
                    left: '130px',
                    zIndex: 20,
                    backgroundColor: '#132847',
                    color: '#fde047',
                    padding: '8px 12px',
                    fontWeight: 900,
                    fontSize: '11.5px',
                    letterSpacing: '0.5px',
                    borderRight: '1px solid #23416d',
                    minWidth: '150px',
                    textAlign: 'left'
                  }}>
                    APPLICATION / PRODUCT
                  </th>
                  <th style={{
                    position: 'sticky',
                    left: '280px',
                    zIndex: 20,
                    backgroundColor: '#132847',
                    color: '#fde047',
                    padding: '8px 12px',
                    fontWeight: 900,
                    fontSize: '11.5px',
                    letterSpacing: '0.5px',
                    borderRight: '2px solid #3b82f6',
                    minWidth: '160px',
                    textAlign: 'left'
                  }}>
                    DEPENDENT TOOL NUMBERS
                  </th>

                  {/* 12 Month Headers (4 columns per month) */}
                  {months.map(m => (
                    <th
                      key={m.key}
                      colSpan={4}
                      style={{
                        padding: '8px 4px',
                        fontWeight: 900,
                        fontSize: '12px',
                        letterSpacing: '0.5px',
                        borderRight: '1.5px solid #23416d',
                        borderLeft: '1px solid #23416d',
                        backgroundColor: m.key === currentSlot.monthKey ? '#1e3a5f' : '#132847',
                        color: m.key === currentSlot.monthKey ? '#fde047' : '#ffffff'
                      }}
                    >
                      {m.label}
                    </th>
                  ))}

                  <th style={{
                    backgroundColor: '#132847',
                    color: '#fde047',
                    padding: '8px 12px',
                    fontWeight: 900,
                    fontSize: '11px',
                    minWidth: '110px'
                  }}>
                    ACTIONS
                  </th>
                </tr>

                {/* Row 2: WEEK (1, 2, 3, 4 under each month) */}
                <tr style={{ backgroundColor: '#0f2038', color: '#94a3b8' }}>
                  <th style={{ position: 'sticky', left: 0, zIndex: 19, backgroundColor: '#0f2038', borderRight: '1px solid #1e3a5f', padding: '4px' }}></th>
                  <th style={{ position: 'sticky', left: '130px', zIndex: 19, backgroundColor: '#0f2038', borderRight: '1px solid #1e3a5f', padding: '4px' }}></th>
                  <th style={{ position: 'sticky', left: '280px', zIndex: 19, backgroundColor: '#0f2038', borderRight: '2px solid #3b82f6', padding: '4px' }}></th>

                  {months.map(m => (
                    <React.Fragment key={`week-group-${m.key}`}>
                      {[1, 2, 3, 4].map(w => {
                        const slotKey = `${m.key}_W${w}`;
                        const isCurrent = slotKey === currentSlot.slotKey;
                        return (
                          <th
                            key={slotKey}
                            style={{
                              padding: '4px 2px',
                              width: '26px',
                              minWidth: '26px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              borderRight: w === 4 ? '1.5px solid #23416d' : '1px solid #1a3254',
                              color: isCurrent ? '#fde047' : '#cbd5e1',
                              backgroundColor: isCurrent ? '#1e40af' : '#0f2038'
                            }}
                            title={`${m.label} - Week ${w}`}
                          >
                            {w}
                          </th>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  <th style={{ backgroundColor: '#0f2038', padding: '4px' }}></th>
                </tr>
              </thead>

              <tbody>
                {!hasActiveSearchOrSelect ? (
                  <tr>
                    <td colSpan={52} style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff' }}>
                      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '30px',
                          marginBottom: '16px',
                          border: '2px solid #bfdbfe',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
                        }}>
                          🔍
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                          1st: Search & Select Application Part No to Plan Schedule
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                          Without search, no schedule data is displayed. Please select or search an Application Part Number in the search bar above to view its dependent tool numbers, plan inspection weeks, and save.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={52} style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
                        No Application Part Numbers match "{searchTerm}"
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedPartNo('');
                          }}
                          style={{ fontSize: '12.5px', padding: '6px 16px' }}
                        >
                          Clear Search
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((item, pIdx) => {
                    const rowBg = pIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
                    const firstTool = tools.find(t => 
                      (item.toolNos || []).some(no => no && t.toolNo && t.toolNo.toLowerCase().trim() === no.toLowerCase().trim()) ||
                      (t.applicationPartNo && t.applicationPartNo.toLowerCase().trim() === (item.applicationPartNo || '').toLowerCase().trim())
                    ) || { id: item.toolNos?.[0] || item.applicationPartNo, toolNo: item.toolNos?.[0] || 'Tool' };

                    return (
                      <tr key={item.id || item.applicationPartNo || pIdx} style={{ backgroundColor: rowBg, borderBottom: '1px solid #e2e8f0' }}>
                        
                        {/* Sticky Left: Part No */}
                        <td style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 10,
                          backgroundColor: rowBg,
                          padding: '8px 12px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: '#0f172a',
                          borderRight: '1px solid #cbd5e1',
                          textAlign: 'left'
                        }}>
                          {item.applicationPartNo}
                        </td>

                        {/* Sticky Left: Product Name */}
                        <td style={{
                          position: 'sticky',
                          left: '130px',
                          zIndex: 10,
                          backgroundColor: rowBg,
                          padding: '8px 12px',
                          fontWeight: 700,
                          color: '#334155',
                          borderRight: '1px solid #cbd5e1',
                          textAlign: 'left',
                          fontSize: '11px'
                        }}>
                          <div>{item.productName || '—'}</div>
                          {item.classification && (
                            <div style={{ fontSize: '10px', color: item.classification === 'Critical' ? '#dc2626' : '#64748b', marginTop: '2px' }}>
                              {item.classification}
                            </div>
                          )}
                        </td>

                        {/* Sticky Left: Dependent Tools */}
                        <td style={{
                          position: 'sticky',
                          left: '280px',
                          zIndex: 10,
                          backgroundColor: rowBg,
                          padding: '6px 10px',
                          borderRight: '2px solid #3b82f6',
                          textAlign: 'left'
                        }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(item.toolNos || []).map((tNo, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  backgroundColor: '#e0f2fe',
                                  color: '#0369a1',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-mono, monospace)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #bae6fd'
                                }}
                              >
                                {tNo}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 48 Week Slots Grid */}
                        {months.map(m => (
                          <React.Fragment key={`cells-${item.applicationPartNo}-${m.key}`}>
                            {[1, 2, 3, 4].map(w => {
                              const slotKey = `${m.key}_W${w}`;
                              const isPlanned = Array.isArray(item.plannedWeeks) && item.plannedWeeks.includes(slotKey);
                              const isCurrent = slotKey === currentSlot.slotKey;

                              return (
                                <td
                                  key={slotKey}
                                  onClick={() => handleToggleCell(item.applicationPartNo, slotKey)}
                                  style={{
                                    padding: '2px 0',
                                    borderRight: w === 4 ? '1.5px solid #cbd5e1' : '1px solid #f1f5f9',
                                    cursor: 'pointer',
                                    backgroundColor: isCurrent
                                      ? (isPlanned ? '#fef3c7' : '#eff6ff')
                                      : (isPlanned ? '#f8fafc' : 'transparent'),
                                    transition: 'background-color 0.15s ease',
                                    userSelect: 'none',
                                    height: '38px',
                                    verticalAlign: 'middle'
                                  }}
                                  title={`${item.applicationPartNo} • ${m.label} (Week ${w}): ${isPlanned ? 'Planned (*)' : 'Not Planned (Click to Plan)'}`}
                                >
                                  {isPlanned ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '22px',
                                      fontWeight: 900,
                                      color: '#0f172a',
                                      lineHeight: 1,
                                      fontFamily: 'system-ui, sans-serif'
                                    }}>
                                      *
                                    </span>
                                  ) : (
                                    <span style={{ color: 'transparent', fontSize: '11px' }}>&bull;</span>
                                  )}
                                </td>
                              );
                            })}
                          </React.Fragment>
                        ))}

                        {/* Actions */}
                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleOpenPlanModal(item)}
                              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, backgroundColor: '#ffffff' }}
                              title="Plan / Edit scheduled weeks for this part"
                            >
                              ✏ Plan
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => {
                                saveYearlyPMPlan(fiscalYear, item);
                                loadData();
                                onRefresh?.();
                                showToast?.(`Yearly PM Schedule saved for Part #${item.applicationPartNo}`, 'success');
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              title="Save PM Schedule to Database"
                            >
                              💾 Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => onNavigateToPM?.(firstTool)}
                              style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700, backgroundColor: '#2563eb' }}
                              title="Open Preventive Maintenance Checklist"
                            >
                              PM
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: DETAILED TOOL-BY-TOOL LIST */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ margin: 0 }}>
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '55px' }}>Sl.No</th>
                  <th style={{ width: '130px' }}>Tool No.</th>
                  <th>Application & Product</th>
                  <th>Classification</th>
                  <th>Frequency</th>
                  <th>Last Inspection</th>
                  <th>Next Due Date</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th style={{ textAlign: 'center' }}>Schedule Status</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item, idx) => {
                  const isOverdue = item.status === 'Overdue';
                  const isDueSoon = item.status === 'Due Soon';

                  return (
                    <tr key={item.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)' }}>
                        {item.toolNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.productName || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Part #{item.applicationPartNo || '—'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${item.classification === 'Critical' ? 'badge-danger' : 'badge-neutral'}`}>
                          {item.classification || 'Non-Critical'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                        {item.frequency || 'Quarterly'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {item.lastCheckDate || '—'}
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isOverdue ? '#dc2626' : '#0f172a' }}>
                          {item.nextDueDate}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>
                          {isOverdue ? (
                            <span style={{ color: '#dc2626' }}>
                              🚨 Overdue ({Math.abs(item.daysRemaining)}d ago)
                            </span>
                          ) : isDueSoon ? (
                            <span style={{ color: '#d97706' }}>
                              ⚠️ Due in {item.daysRemaining} days
                            </span>
                          ) : (
                            <span style={{ color: '#059669' }}>
                              ✓ In {item.daysRemaining} days
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: item.priority === 'Urgent' ? '#fee2e2' : item.priority === 'High' ? '#fef3c7' : '#f1f5f9',
                          color: item.priority === 'Urgent' ? '#b91c1c' : item.priority === 'High' ? '#b45309' : '#475569'
                        }}>
                          {item.priority || 'Normal'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        {item.assignedInspector || 'Tool Room Lead'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isOverdue ? (
                          <span className="badge badge-danger">
                            <span className="badge-dot"></span>
                            Overdue
                          </span>
                        ) : isDueSoon ? (
                          <span className="badge badge-warning">
                            <span className="badge-dot"></span>
                            Due Soon
                          </span>
                        ) : (
                          <span className="badge badge-healthy">
                            <span className="badge-dot"></span>
                            On Track
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingSchedule({
                              ...item,
                              frequency: item.frequency || 'Quarterly (3 Months)',
                              nextDueDate: item.nextDueDate || new Date().toISOString().slice(0, 10),
                              assignedInspector: item.assignedInspector || 'Tool Room Lead',
                              priority: item.priority || 'Normal',
                              notes: item.notes || ''
                            });
                            setIsToolModalOpen(true);
                          }}
                          style={{ padding: '5px 12px', fontSize: '11.5px', fontWeight: 600 }}
                        >
                          Edit Due Date
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PLAN YEARLY PM SCHEDULE FOR APPLICATION PART */}
      {planningPart && (
        <div className="modal-backdrop show" style={{ zIndex: 1250 }}>
          <div className="modal-card modal-xl" style={{ maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '12px' }}>
            <div className="modal-header" style={{ backgroundColor: '#132847', color: '#ffffff', padding: '16px 24px' }}>
              <div className="modal-title" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🗓</span>
                <span>Yearly PM Inspection Plan: Part #{planningPart.applicationPartNo}</span>
                <span style={{ fontSize: '12px', backgroundColor: '#1e3a5f', color: '#fde047', padding: '2px 8px', borderRadius: '4px' }}>
                  FY {fiscalYear}
                </span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPlanningPart(null)}
                style={{ color: '#ffffff' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePlanModal}>
              <div className="modal-body" style={{ padding: '22px 24px' }}>
                
                {/* Part & Tool Overview Info Bar */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Application Part & Product Line
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {planningPart.applicationPartNo} &bull; {planningPart.productName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Dependent Production Tools
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {(planningPart.toolNos || []).map((tNo, tIdx) => (
                        <span key={tIdx} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                          {tNo}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Inspections Selected
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
                      {selectedWeeks.length} <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Weeks Planned</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets Bar */}
                <div style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Quick Recurrence Presets:</span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>(Click to auto-populate weeks across the year)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleApplyPreset('Quarterly')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: selectedFrequency === 'Quarterly' ? '#2563eb' : '#ffffff',
                        color: selectedFrequency === 'Quarterly' ? '#ffffff' : '#334155',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px'
                      }}
                    >
                      Quarterly (May-W1, Aug-W1, Nov-W2, Feb-W2)
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleApplyPreset('Bi-Monthly')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: selectedFrequency === 'Bi-Monthly' ? '#2563eb' : '#ffffff',
                        color: selectedFrequency === 'Bi-Monthly' ? '#ffffff' : '#334155',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px'
                      }}
                    >
                      Bi-Monthly (Every 2 Months)
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleApplyPreset('Monthly')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: selectedFrequency === 'Monthly' ? '#2563eb' : '#ffffff',
                        color: selectedFrequency === 'Monthly' ? '#ffffff' : '#334155',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px'
                      }}
                    >
                      Monthly (Every Month)
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleApplyPreset('Half-Yearly')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: selectedFrequency === 'Half-Yearly' ? '#2563eb' : '#ffffff',
                        color: selectedFrequency === 'Half-Yearly' ? '#ffffff' : '#334155',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px'
                      }}
                    >
                      Half-Yearly (2 Times/Year)
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleApplyPreset('Clear')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        color: '#dc2626',
                        border: '1.5px solid #fecaca',
                        borderRadius: '6px',
                        marginLeft: 'auto'
                      }}
                    >
                      ✕ Clear All
                    </button>
                  </div>
                </div>

                {/* Visual 12-Month Card Grid with Week Checkboxes */}
                <div>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                    Select Inspection Month & Weeks (Custom Multi-Selection):
                  </label>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                  }}>
                    {months.map(m => {
                      const isCurrentMonth = m.key === currentSlot.monthKey;
                      const monthHasSelected = [1, 2, 3, 4].some(w => selectedWeeks.includes(`${m.key}_W${w}`));

                      return (
                        <div
                          key={m.key}
                          style={{
                            border: isCurrentMonth ? '2px solid #3b82f6' : monthHasSelected ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: isCurrentMonth ? '#eff6ff' : monthHasSelected ? '#f8fafc' : '#ffffff',
                            padding: '10px 12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          {/* Month Header */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            borderBottom: '1px solid #e2e8f0',
                            paddingBottom: '6px'
                          }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                              {m.label}
                            </span>
                            {isCurrentMonth && (
                              <span style={{ fontSize: '10px', backgroundColor: '#2563eb', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                Current
                              </span>
                            )}
                          </div>

                          {/* 4 Week Checkboxes */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {[1, 2, 3, 4].map(w => {
                              const slotKey = `${m.key}_W${w}`;
                              const isChecked = selectedWeeks.includes(slotKey);
                              const isSlotCurrent = slotKey === currentSlot.slotKey;

                              return (
                                <label
                                  key={slotKey}
                                  onClick={() => handleModalToggleWeek(slotKey)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 8px',
                                    borderRadius: '5px',
                                    backgroundColor: isChecked ? '#1e3a5f' : '#f1f5f9',
                                    color: isChecked ? '#fde047' : '#334155',
                                    border: isSlotCurrent ? '1.5px solid #f59e0b' : '1px solid transparent',
                                    cursor: 'pointer',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    userSelect: 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                                  />
                                  <span>Week {w}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPlanningPart(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2563eb', padding: '8px 22px', fontWeight: 700 }}
                >
                  Save Yearly Plan ({selectedWeeks.length} Weeks)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE TOOL DUE DATE EDIT */}
      {isToolModalOpen && editingSchedule && (
        <div className="modal-backdrop show" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <span>Update Schedule: {editingSchedule.toolNo}</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsToolModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveSchedule(editingSchedule);
              loadData();
              onRefresh?.();
              setIsToolModalOpen(false);
              showToast?.(`Schedule updated for ${editingSchedule.toolNo}`, 'success');
            }}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Next Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingSchedule.nextDueDate}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, nextDueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Inspection Frequency</label>
                  <select
                    className="form-select"
                    value={editingSchedule.frequency}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly (3 Months)">Quarterly (3 Months)</option>
                    <option value="Half-Yearly (6 Months)">Half-Yearly (6 Months)</option>
                    <option value="Annually (1 Year)">Annually (1 Year)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Inspector</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingSchedule.assignedInspector}
                    onChange={(e) => setEditingSchedule(prev => ({ ...prev, assignedInspector: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsToolModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
