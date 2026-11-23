import { INITIAL_TOOLS, INITIAL_MACHINES, INITIAL_PRODUCTION, INITIAL_USERS } from './initialData';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getCurrentFiscalYear, getCurrentWeekSlot } from '../utils/pmYearlySchedule';

// Format numbers with commas (e.g. 200,000)
export function formatNumber(val) {
  if (val === undefined || val === null || val === '') return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

// Export tool list to downloadable CSV
export function exportToolsToCSV(toolsList, filename = 'tools_master_list.csv') {
  const headers = [
    'Sl.No',
    'Tool No',
    'Application Part No',
    'Product Name',
    'Description',
    'Classification',
    'Tool Count (Cycles)',
    'Tool Issued On',
    'Life Time',
    'Cumulative Produced',
    'Remaining Balance',
    'Status'
  ];

  const rows = toolsList.map((t, idx) => [
    idx + 1,
    `"${(t.toolNo || '').replace(/"/g, '""')}"`,
    `"${(t.applicationPartNo || '').replace(/"/g, '""')}"`,
    `"${(t.productName || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.classification || 'Non-Critical').replace(/"/g, '""')}"`,
    t.toolCount ?? 0,
    `"${(t.toolIssuedOn || '').replace(/"/g, '""')}"`,
    t.lifetime || 0,
    t.cumulative || 0,
    t.balance || 0,
    `"${(t.status || 'Healthy').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export complete Preventive Maintenance Card & Production History for a Tool to CSV (Excel format)
export function exportPMReportToCSV(tool, logs = []) {
  if (!tool) return;
  const lines = [];
  const pct = Math.min(100, Math.round(((tool.cumulative || 0) / (tool.lifetime || 1)) * 100));

  // Retrieve any recorded PM inspection data
  let savedRows = [];
  let pmDate = new Date().toISOString().slice(0, 10);
  try {
    const rawPM = localStorage.getItem('tms_pm_records');
    if (rawPM) {
      const pmList = JSON.parse(rawPM);
      const toolPM = pmList.find(p => 
        p.toolId === tool.id || 
        (p.toolNo && tool.toolNo && p.toolNo.toLowerCase().trim() === tool.toolNo.toLowerCase().trim())
      );
      if (toolPM) {
        if (Array.isArray(toolPM.items) && toolPM.items.length > 0) {
          savedRows = toolPM.items;
        } else if (Array.isArray(toolPM.rows) && toolPM.rows.length > 0) {
          savedRows = toolPM.rows;
        }
        if (toolPM.checkDate) pmDate = toolPM.checkDate;
        else if (toolPM.date) pmDate = toolPM.date;
      }
    }
  } catch (e) {}

  lines.push('PREVENTIVE MAINTENANCE & TOOL SERVICE RECORD');
  lines.push(`Generated On,"${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}"`);
  lines.push('Document Reference,"MFG/FR/075"');
  lines.push('');

  lines.push('1. TOOL SPECIFICATION & METADATA');
  lines.push(`Tool No,"${tool.toolNo || ''}"`);
  lines.push(`Application Part No ,"${tool.applicationPartNo || ''}"`);
  lines.push(`Product Name,"${(tool.productName || '').replace(/"/g, '""')}"`);
  lines.push(`Description,"${(tool.description || '').replace(/"/g, '""')}"`);
  lines.push(`Classification,"${tool.classification || 'Non-Critical'}"`);
  lines.push(`Tool Issued On,"${tool.toolIssuedOn || ''}"`);
  lines.push(`Tool Count (Current Cycle),Cycle ${tool.toolCount ?? 0}`);
  lines.push(`Life Time Limit (Stroke / Cycle Limit),${tool.lifetime || 0}`);
  lines.push(`Current Cumulative Produced (Strokes),${tool.cumulative || 0}`);
  lines.push(`Remaining Balance (Strokes),${tool.balance || 0}`);
  lines.push(`Life Utilization,${pct}%`);
  lines.push(`Tool Status,"${tool.status || 'Healthy'}"`);
  lines.push('');

  lines.push('2. PREVENTIVE MAINTENANCE CHECK POINTS & INSPECTION RECORD');
  lines.push('S.No,Check Points,Checking Method,Specification,Actual Condition / Observation,Action Taken');
  
  if (savedRows.length > 0) {
    savedRows.forEach((r, idx) => {
      lines.push(`${idx + 1},"${(r.checkPoint || '').replace(/"/g, '""')}","${(r.method || '').replace(/"/g, '""')}","${(r.specification || '').replace(/"/g, '""')}","${(r.actualCondition || '').replace(/"/g, '""')}","${(r.actionTaken || '').replace(/"/g, '""')}"`);
    });
  } else {
    (tool.checkPoints || []).forEach((cp, idx) => {
      const pointText = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
      const method = typeof cp === 'object' && cp !== null && cp.method ? cp.method : '';
      const spec = typeof cp === 'object' && cp !== null && (cp.spec || cp.specification) ? (cp.spec || cp.specification) : '';
      lines.push(`${idx + 1},"${pointText.replace(/"/g, '""')}","${method.replace(/"/g, '""')}","${spec.replace(/"/g, '""')}","",""`);
    });
  }
  lines.push('');

  lines.push('3. QUANTITY PRODUCED (PRODUCTION TRACKING HISTORY)');
  lines.push('Month,Quantity Made (Strokes),Cumulative Made,Cycle,Operator');
  if (logs.length === 0) {
    lines.push('No production logs recorded yet,,,,');
  } else {
    // Sort chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    sortedLogs.forEach(l => {
      const mDisplay = l.monthDisplay || l.date || l.month || '';
      lines.push(`"${mDisplay}",${l.quantityMade || l.quantity || 0},${l.cumulativeMade || l.cumulative || 0},Cycle ${l.cycle ?? 0},"${(l.operator || 'Operator').replace(/"/g, '""')}"`);
    });
  }
  lines.push('');

  if (tool.replacements && tool.replacements.length > 0) {
    lines.push('4. TOOL REPLACEMENT & OVERHAUL HISTORY');
    lines.push('Date,Cycle Transition,Strokes at Retirement,Authorized By,Remarks');
    tool.replacements.forEach(r => {
      lines.push(`"${r.replacementDate || ''}","Cycle ${r.cycle} -> Cycle ${r.newCycle}",${r.finalCumulative || 0},"${(r.replacedBy || '').replace(/"/g, '""')}","${(r.remarks || '').replace(/"/g, '""')}"`);
    });
    lines.push('');
  }

  lines.push('5. SUMMARY TOTALS');
  lines.push(`Total All-Time Output Produced across all cycles,${tool.totalAllTime || tool.cumulative || 0}`);
  lines.push(`Active Cycle Cumulative,${tool.cumulative || 0}`);
  lines.push(`Remaining Active Balance,${tool.balance || 0}`);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const cleanToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PM_Report_${cleanToolNo}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper to strictly enforce "INE T " prefix on all tool numbers
export function formatToolNumber(val) {
  if (!val) return 'INE T 0000';
  let str = String(val).trim();
  if (str.toUpperCase().startsWith('INE T')) {
    return str.replace(/^INE\s*T\s*/i, 'INE T ');
  }
  const digits = str.replace(/[^0-9]/g, '');
  return `INE T ${digits ? digits.padStart(4, '0') : str}`;
}

// Convert raw initial tools to standardized model
function normalizeToolItem(raw, productionLogs = []) {
  const id = raw.id || `tool-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const toolNo = formatToolNumber(raw.toolNo || raw.toolNumber);
  const applicationPartNo = String(raw.applicationPartNo || '001').trim();
  const productName = String(raw.productName || raw.application || '').trim();
  const description = String(raw.description || raw.toolDescription || '').trim();
  const toolIssuedOn = raw.toolIssuedOn || raw.issuedDate || new Date().toISOString().slice(0, 10);
  const lifetime = Number(raw.lifetime || raw.lifeTime || raw.replacementFrequency || 0);
  const classification = raw.classification === 'Critical' ? 'Critical' : 'Non-Critical';
  const toolCount = Number(raw.toolCount !== undefined && raw.toolCount !== null ? raw.toolCount : 0);
  const replacements = Array.isArray(raw.replacements) ? raw.replacements : [];

  // Normalize checkPoints to array of string strings
  let checkPoints = [];
  if (Array.isArray(raw.checkPoints)) {
    checkPoints = raw.checkPoints.map(cp => {
      if (typeof cp === 'string') return cp;
      if (cp && typeof cp === 'object') return cp.point || cp.text || '';
      return '';
    }).filter(Boolean);
  }

  // All matching logs for this tool across all time
  const matchingLogs = productionLogs.filter(p => 
    p.toolId === id || (p.toolNo && p.toolNo.toLowerCase() === toolNo.toLowerCase())
  );
  
  // Total cumulative across ALL cycles ever logged
  const totalAllTimeLogs = matchingLogs.reduce((acc, curr) => acc + (Number(curr.quantity) || Number(curr.quantityMade) || 0), 0);

  // Filter logs for the CURRENT ACTIVE cycle (toolCount)
  const currentCycleLogs = matchingLogs.filter(p => {
    const logCycle = p.cycle !== undefined && p.cycle !== null ? Number(p.cycle) : 0;
    return logCycle === toolCount;
  });

  const currentLoggedCumulative = currentCycleLogs.reduce((acc, curr) => acc + (Number(curr.quantity) || Number(curr.quantityMade) || 0), 0);
  
  // For cycle 0, allow baseCumulative if set
  const baseCumulative = toolCount === 0 ? Number(raw.cumulative || raw.cumulativeQuantity || 0) : 0;
  const cumulative = Math.max(currentLoggedCumulative, baseCumulative);

  // Remaining balance for current active cycle
  const rawBalance = lifetime > 0 ? (lifetime - cumulative) : 0;
  const balance = rawBalance < 0 ? 0 : rawBalance;

  // Lifecycle status for current active cycle
  let status = 'Healthy';
  if (lifetime > 0) {
    const wearPct = (cumulative / lifetime) * 100;
    if (wearPct >= 100) {
      status = 'Replacement Due';
    } else if (wearPct >= 80) {
      status = 'Near Limit';
    }
  }

  return {
    id,
    toolNo,
    applicationPartNo,
    productName,
    description,
    toolIssuedOn,
    lifetime,
    classification,
    toolCount,
    checkPoints,
    cumulative,
    totalAllTime: Math.max(totalAllTimeLogs, cumulative),
    balance,
    status,
    replacements
  };
}

// Convert raw initial production to standardized model
function normalizeProductionItem(raw) {
  let dateVal = raw.date || raw.productionDate;
  if (raw.month && !dateVal) {
    dateVal = String(raw.month).length === 7 ? `${raw.month}-01` : String(raw.month);
  }
  if (!dateVal) {
    dateVal = new Date().toISOString().slice(0, 10);
  }

  const cycleVal = Number(raw.cycle !== undefined && raw.cycle !== null ? raw.cycle : 0);

  return {
    id: raw.id || `prd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    toolId: raw.toolId || null,
    toolNo: formatToolNumber(raw.toolNo || raw.toolNumber),
    date: dateVal,
    month: raw.month || dateVal.slice(0, 7),
    quantity: Number(raw.quantity || raw.quantityMade || 0),
    cycle: cycleVal,
    operator: raw.operator || 'Operator',
    notes: raw.notes || raw.remarks || ''
  };
}

// Initialize real storage
function initStorage() {
  // Purge legacy mock data keys once on upgrade, avoiding current active keys
  try {
    const isCleaned = localStorage.getItem('tms_mock_purged_flag_v2');
    if (!isCleaned) {
      [
        'tms_tools_v4', 'tms_production_v4', 'tms_tools_v3', 'tms_tools_v2', 'tms_tools_v1',
        'tms_users_v1', 'tms_pm_records_mock'
      ].forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
      });
      localStorage.setItem('tms_mock_purged_flag_v2', 'true');
    }
  } catch (e) {}

  if (!localStorage.getItem(STORAGE_KEYS.TOOLS)) {
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTION)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
}

// Get all tools enriched with cumulative & cycle counts
export function getTools() {
  initStorage();
  try {
    const logs = getProductionLogs();
    const rawData = localStorage.getItem(STORAGE_KEYS.TOOLS);
    const tools = rawData ? JSON.parse(rawData) : [];
    return tools.map(t => normalizeToolItem(t, logs));
  } catch (err) {
    console.error('Error reading tools from storage', err);
    return [];
  }
}

// Save or update a tool
export function saveTool(toolData) {
  initStorage();
  const logs = getProductionLogs();
  const rawData = localStorage.getItem(STORAGE_KEYS.TOOLS);
  const tools = rawData ? JSON.parse(rawData) : [];
  toolData.toolNo = formatToolNumber(toolData.toolNo || toolData.toolNumber);
  const normalized = normalizeToolItem(toolData, logs);

  const existingIdx = tools.findIndex(t => 
    t.id === normalized.id || 
    (t.toolNo && normalized.toolNo && t.toolNo.toLowerCase().trim() === normalized.toolNo.toLowerCase().trim())
  );
  if (existingIdx >= 0) {
    tools[existingIdx] = normalized;
  } else {
    tools.unshift(normalized);
  }

  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
  return normalized;
}

// Record a tool replacement: advances cycle, preserves history, starts fresh current cycle
export function replaceTool(toolId, replacementData = {}) {
  initStorage();
  const logs = getProductionLogs();
  const rawData = localStorage.getItem(STORAGE_KEYS.TOOLS);
  const tools = rawData ? JSON.parse(rawData) : [];
  
  const existingIdx = tools.findIndex(t => t.id === toolId || formatToolNumber(t.toolNo || t.toolNumber).toLowerCase() === formatToolNumber(toolId).toLowerCase());
  if (existingIdx === -1) return null;

  const rawTool = tools[existingIdx];
  const oldCycle = Number(rawTool.toolCount !== undefined && rawTool.toolCount !== null ? rawTool.toolCount : 0);
  const newCycle = oldCycle + 1;

  // Get current cycle cumulative to preserve in replacement history event
  const currentToolModel = normalizeToolItem(rawTool, logs);
  const finalCumulative = currentToolModel.cumulative;

  const repEvent = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    toolId: rawTool.id,
    toolNo: currentToolModel.toolNo,
    cycle: oldCycle,
    newCycle: newCycle,
    replacementDate: replacementData.date || new Date().toISOString().slice(0, 10),
    finalCumulative: finalCumulative,
    lifetimeLimit: currentToolModel.lifetime,
    replacedBy: replacementData.replacedBy || 'Tool Room Lead',
    remarks: replacementData.remarks || 'Standard lifecycle replacement upon reaching rated stroke limit'
  };

  const updatedReplacements = [...(rawTool.replacements || []), repEvent];

  // Update lifetime limit if adjusted for new cycle
  const newLimit = Number(replacementData.newLifetimeLimit || replacementData.lifetime);
  if (!isNaN(newLimit) && newLimit > 0) {
    rawTool.lifetime = newLimit;
    rawTool.lifeTimeLimit = newLimit;
    rawTool.frequencyLimit = newLimit;
  }

  // Update raw tool for the new cycle
  rawTool.toolCount = newCycle;
  rawTool.replacements = updatedReplacements;
  rawTool.cumulative = 0; // reset base cumulative for new cycle
  rawTool.cumulativeQuantity = 0;
  rawTool.toolIssuedOn = replacementData.date || new Date().toISOString().slice(0, 10);
  rawTool.issuedDate = rawTool.toolIssuedOn;

  tools[existingIdx] = rawTool;
  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));

  return normalizeToolItem(rawTool, logs);
}

// Delete a tool
export function deleteTool(toolId) {
  initStorage();
  const rawData = localStorage.getItem(STORAGE_KEYS.TOOLS);
  const tools = rawData ? JSON.parse(rawData) : [];
  const filtered = tools.filter(t => t.id !== toolId && t.toolNo !== toolId);
  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(filtered));
}

// Get all production logs
export function getProductionLogs() {
  initStorage();
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.PRODUCTION);
    const logs = rawData ? JSON.parse(rawData) : [];
    return logs.map(normalizeProductionItem);
  } catch (err) {
    console.error('Error reading production logs from storage', err);
    return [];
  }
}

// Add a production log
export function addProductionLog(logData) {
  initStorage();
  const logs = getProductionLogs();
  logData.toolNo = formatToolNumber(logData.toolNo || logData.toolNumber);
  const normalized = normalizeProductionItem(logData);
  logs.unshift(normalized);
  localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(logs));
  return normalized;
}

// Delete a production log
export function deleteProductionLog(logId) {
  initStorage();
  const logs = getProductionLogs().filter(l => l.id !== logId);
  localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(logs));
}

// Calculate dashboard KPIs
export function calculateMetrics(tools = [], logs = []) {
  const totalTools = tools.length;
  const uniqueParts = new Set(tools.map(t => t.applicationPartNo).filter(Boolean));
  const uniquePartsCount = uniqueParts.size;
  const totalProduced = tools.reduce((sum, t) => sum + (t.cumulative || 0), 0);
  const pmRecords = getPMRecords();
  const rejectedPMCount = Array.isArray(pmRecords) ? pmRecords.filter(p => p.approvedBy?.status === 'Rejected' || p.checkedBy?.status === 'Revision Requested').length : 0;
  
  // Calculate yearly scheduled PMs due this week/month
  const dueYearlySchedules = getDueYearlyPMSchedules();
  const dueYearlyCount = Array.isArray(dueYearlySchedules) ? dueYearlySchedules.length : 0;

  const criticalAlertsCount = tools.filter(t => t.status === 'Replacement Due' || t.status === 'Critical Overrun').length + rejectedPMCount + dueYearlyCount;
  const warningAlertsCount = tools.filter(t => t.status === 'Near Limit').length;
  const activeCount = tools.filter(t => t.status === 'Active' || t.status === 'Healthy').length;

  return {
    totalTools,
    uniquePartsCount,
    totalProduced,
    criticalAlertsCount,
    warningAlertsCount,
    activeCount,
    rejectedPMCount,
    dueYearlyCount,
    dueYearlySchedules
  };
}

// Reset storage to factory default data
export function resetToInitialData() {
  localStorage.removeItem(STORAGE_KEYS.TOOLS);
  localStorage.removeItem(STORAGE_KEYS.PRODUCTION);
  localStorage.removeItem('tms_pm_records');
  initStorage();
}

// Preventive Maintenance Inspection Checklist Records
export function getPMRecords() {
  try {
    const raw = localStorage.getItem('tms_pm_records');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function savePMRecord(record) {
  try {
    const existing = getPMRecords();
    const cleanToolNo = (record.toolNo || '').toLowerCase().trim();
    const idx = existing.findIndex(r => 
      (record.id && r.id === record.id) ||
      (record.toolId && r.toolId === record.toolId) ||
      (cleanToolNo && r.toolNo && r.toolNo.toLowerCase().trim() === cleanToolNo)
    );

    const normalizedRecord = {
      ...record,
      items: record.items || record.rows || [],
      rows: record.rows || record.items || [],
      checkDate: record.checkDate || record.date || new Date().toISOString().slice(0, 10),
      date: record.checkDate || record.date || new Date().toISOString().slice(0, 10)
    };

    let updated;
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = { 
        ...existing[idx], 
        ...normalizedRecord, 
        id: existing[idx].id || normalizedRecord.id, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      const newRec = {
        ...normalizedRecord,
        id: normalizedRecord.id || ('pm_' + (record.toolId || (record.toolNo ? record.toolNo.replace(/\s+/g, '_') : Date.now()))),
        createdAt: new Date().toISOString()
      };
      updated = [newRec, ...existing];
    }
    localStorage.setItem('tms_pm_records', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving PM record', e);
    return [];
  }
}

export function deletePMRecord(id) {
  try {
    const existing = getPMRecords();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem('tms_pm_records', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting PM record', e);
    return [];
  }
}

// Schedule Management
export function getSchedules() {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    const savedSchedules = raw ? JSON.parse(raw) : [];
    const tools = getTools();
    const pmRecords = getPMRecords();
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr);

    return tools.map(t => {
      const toolNoClean = (t.toolNo || '').toLowerCase().trim();
      const savedSch = savedSchedules.find(s => 
        (s.toolId && s.toolId === t.id) || 
        (s.toolNo && s.toolNo.toLowerCase().trim() === toolNoClean)
      );

      const pm = pmRecords.find(p => 
        (p.toolId && p.toolId === t.id) || 
        (p.toolNo && p.toolNo.toLowerCase().trim() === toolNoClean)
      );

      // Default next due date: from PM record, or saved schedule, or 3 months from today
      let nextDue = savedSch?.nextDueDate || pm?.nextDueDate;
      if (!nextDue) {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        nextDue = d.toISOString().slice(0, 10);
      }

      const lastCheck = pm?.checkDate || pm?.date || savedSch?.lastCheckDate || t.toolIssuedOn || '—';
      const frequency = savedSch?.frequency || 'Quarterly (3 Months)';
      const assignedInspector = savedSch?.assignedInspector || 'Tool Room Lead';
      const priority = savedSch?.priority || (t.classification === 'Critical' ? 'High' : 'Normal');

      // Calculate schedule status & days remaining
      let status = 'On Track';
      let daysRemaining = 0;
      if (nextDue) {
        const dueDate = new Date(nextDue);
        const diffTime = dueDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          status = 'Overdue';
        } else if (daysRemaining <= 7) {
          status = 'Due Soon';
        } else {
          status = 'On Track';
        }
      }

      return {
        id: savedSch?.id || `sch-${t.id}`,
        toolId: t.id,
        toolNo: t.toolNo,
        applicationPartNo: t.applicationPartNo,
        productName: t.productName,
        classification: t.classification,
        lifetime: t.lifetime,
        cumulative: t.cumulative,
        frequency,
        lastCheckDate: lastCheck,
        nextDueDate: nextDue,
        daysRemaining,
        status,
        assignedInspector,
        priority,
        notes: savedSch?.notes || '',
        updatedAt: savedSch?.updatedAt || null
      };
    });
  } catch (e) {
    console.error('Error getting schedules', e);
    return [];
  }
}

export function saveSchedule(scheduleData) {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    const existing = raw ? JSON.parse(raw) : [];
    const cleanToolNo = (scheduleData.toolNo || '').toLowerCase().trim();
    const idx = existing.findIndex(s => 
      (scheduleData.toolId && s.toolId === scheduleData.toolId) ||
      (cleanToolNo && s.toolNo && s.toolNo.toLowerCase().trim() === cleanToolNo)
    );

    const item = {
      ...scheduleData,
      id: scheduleData.id || `sch-${scheduleData.toolId || Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = { ...existing[idx], ...item };
    } else {
      updated = [item, ...existing];
    }
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
    return item;
  } catch (e) {
    console.error('Error saving schedule', e);
    return null;
  }
}

// Storage for 48-Week Yearly PM Schedule Plans
const YEARLY_PLANS_KEY = 'tms_yearly_pm_plans';

export function getYearlyPMPlans(fiscalYear = '2026-2027') {
  try {
    const raw = localStorage.getItem(YEARLY_PLANS_KEY);
    let plans = raw ? JSON.parse(raw) : [];

    // Filter out any invalid or empty plans
    plans = Array.isArray(plans) ? plans.filter(p => p && typeof p.applicationPartNo === 'string' && p.applicationPartNo.trim() !== '' && p.applicationPartNo.trim() !== '—') : [];

    // Group active tools by valid applicationPartNo only
    const tools = getTools();
    const partMap = {};
    tools.forEach(t => {
      const rawPart = (t.applicationPartNo || '').trim();
      if (!rawPart || rawPart === '—') return; // Skip tools without a valid application part number

      if (!partMap[rawPart]) {
        partMap[rawPart] = {
          applicationPartNo: rawPart,
          productName: t.productName || t.application || 'Tool',
          classification: t.classification || 'Non-Critical',
          description: t.description || '',
          tools: []
        };
      }
      partMap[rawPart].tools.push(t);
    });

    let modified = false;

    // Ensure every existing application part has a plan entry for this fiscal year
    Object.keys(partMap).forEach(partNo => {
      const info = partMap[partNo];
      const cleanPart = partNo.toLowerCase().trim();
      let existingPlan = plans.find(p => 
        p.fiscalYear === fiscalYear && 
        (p.applicationPartNo || '').toLowerCase().trim() === cleanPart
      );

      const toolNos = info.tools.map(t => t.toolNo);
      const toolIds = info.tools.map(t => t.id);

      if (!existingPlan) {
        // Auto-initialize plan entry with sample quarters: May-W1, Aug-W1, Nov-W2, Feb-W2 (matching user sample)
        const startShort = fiscalYear.split('-')[0]?.slice(-2) || '26';
        const endShort = fiscalYear.split('-')[1]?.slice(-2) || '27';
        const defaultPlannedWeeks = [
          `May-${startShort}_W1`,
          `Aug-${startShort}_W1`,
          `Nov-${startShort}_W2`,
          `Feb-${endShort}_W2`
        ];

        existingPlan = {
          id: `plan_${partNo.replace(/[^a-zA-Z0-9]/g, '_')}_${fiscalYear}`,
          fiscalYear,
          applicationPartNo: partNo,
          productName: info.productName,
          classification: info.classification,
          description: info.description,
          toolNos,
          toolIds,
          plannedWeeks: defaultPlannedWeeks,
          updatedAt: new Date().toISOString()
        };
        plans.push(existingPlan);
        modified = true;
      } else {
        // Keep toolNos and toolIds synchronized with tools in master list
        existingPlan.toolNos = toolNos;
        existingPlan.toolIds = toolIds;
        existingPlan.productName = info.productName || existingPlan.productName;
        existingPlan.classification = info.classification || existingPlan.classification;
      }
    });

    // Save cleaned plans to localStorage
    localStorage.setItem(YEARLY_PLANS_KEY, JSON.stringify(plans));

    return plans.filter(p => 
      p.fiscalYear === fiscalYear && 
      p.applicationPartNo && 
      p.applicationPartNo.trim() !== '' && 
      p.applicationPartNo.trim() !== '—' &&
      Array.isArray(p.toolNos) &&
      p.toolNos.length > 0
    );
  } catch (e) {
    console.error('Error getting yearly PM plans', e);
    return [];
  }
}

export function saveYearlyPMPlan(planData) {
  try {
    const raw = localStorage.getItem(YEARLY_PLANS_KEY);
    const plans = raw ? JSON.parse(raw) : [];
    const fiscalYear = planData.fiscalYear || '2026-2027';
    const cleanPart = (planData.applicationPartNo || '').toLowerCase().trim();

    const idx = plans.findIndex(p => 
      p.fiscalYear === fiscalYear && 
      (p.applicationPartNo || '').toLowerCase().trim() === cleanPart
    );

    const item = {
      ...planData,
      id: planData.id || `plan_${(planData.applicationPartNo || 'part').replace(/[^a-zA-Z0-9]/g, '_')}_${fiscalYear}`,
      fiscalYear,
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      plans[idx] = { ...plans[idx], ...item };
    } else {
      plans.push(item);
    }

    localStorage.setItem(YEARLY_PLANS_KEY, JSON.stringify(plans));
    return item;
  } catch (e) {
    console.error('Error saving yearly PM plan', e);
    return null;
  }
}

export function toggleYearlyPlanWeek(applicationPartNo, fiscalYear = '2026-2027', slotKey) {
  try {
    const raw = localStorage.getItem(YEARLY_PLANS_KEY);
    const plans = raw ? JSON.parse(raw) : [];
    const cleanPart = (applicationPartNo || '').toLowerCase().trim();

    let plan = plans.find(p => 
      p.fiscalYear === fiscalYear && 
      (p.applicationPartNo || '').toLowerCase().trim() === cleanPart
    );

    if (!plan) {
      const allPlans = getYearlyPMPlans(fiscalYear);
      plan = allPlans.find(p => (p.applicationPartNo || '').toLowerCase().trim() === cleanPart);
      if (!plan) return false;
      plans.push(plan);
    }

    const currentWeeks = Array.isArray(plan.plannedWeeks) ? [...plan.plannedWeeks] : [];
    const existingIndex = currentWeeks.indexOf(slotKey);

    if (existingIndex >= 0) {
      currentWeeks.splice(existingIndex, 1);
    } else {
      currentWeeks.push(slotKey);
    }

    plan.plannedWeeks = currentWeeks;
    plan.updatedAt = new Date().toISOString();

    localStorage.setItem(YEARLY_PLANS_KEY, JSON.stringify(plans));
    return true;
  } catch (e) {
    console.error('Error toggling yearly plan week', e);
    return false;
  }
}

export function getDueYearlyPMSchedules(fiscalYear = '2026-2027') {
  try {
    const currentSlot = getCurrentWeekSlot();
    const plans = getYearlyPMPlans(fiscalYear);
    const pmRecords = getPMRecords();

    const dueList = [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth0 = now.getMonth(); // 0 to 11
    const currentMonthIso = now.toISOString().slice(0, 7); // e.g. "2026-11"
    const currentMonthNumStr = String(currentMonth0 + 1).padStart(2, '0'); // e.g. "11"

    // Helper: checks whether a PM record is valid, completed/updated in the current month, and not rejected
    const isPMRecordCompletedInCurrentMonth = (pm) => {
      if (!pm) return false;

      // If rejected by Management or Revision Requested by QA, inspection rework is pending
      const isRejected = pm.approvedBy?.status === 'Rejected' || pm.checkedBy?.status === 'Revision Requested';
      if (isRejected) return false;

      // Check if inspection has been prepared/inspected/updated or approved
      const hasContentOrPrepared = Boolean(
        pm.preparedBy ||
        pm.inspectedBy ||
        pm.checkedBy?.status === 'Verified' ||
        pm.approvedBy?.status === 'Approved' ||
        (Array.isArray(pm.items) && pm.items.length > 0)
      );
      if (!hasContentOrPrepared) return false;

      // Check date of inspection
      const pmDateStr = pm.checkDate || pm.lastModifiedAt || pm.updatedAt || pm.date || '';
      let isThisMonth = false;

      if (pmDateStr) {
        if (pmDateStr.includes(currentMonthIso)) {
          isThisMonth = true;
        } else {
          // Parse formats like MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
          const parts = pmDateStr.split(/[\/\-]/);
          if (parts.length === 3) {
            const p0 = parseInt(parts[0], 10);
            const p1 = parseInt(parts[1], 10);
            const yearPart = parts[2];
            // MM/DD/YYYY check
            if (p0 === (currentMonth0 + 1) && (yearPart.includes(String(currentYear)) || yearPart.length === 4)) {
              isThisMonth = true;
            }
            // DD/MM/YYYY check
            else if (p1 === (currentMonth0 + 1) && (yearPart.includes(String(currentYear)) || yearPart.length === 4)) {
              isThisMonth = true;
            }
            // YYYY-MM-DD check
            else if (parts[0] === String(currentYear) && p1 === (currentMonth0 + 1)) {
              isThisMonth = true;
            }
          }

          if (!isThisMonth) {
            const parsed = new Date(pmDateStr);
            if (!isNaN(parsed.getTime())) {
              isThisMonth = parsed.getFullYear() === currentYear && parsed.getMonth() === currentMonth0;
            }
          }
        }
      }

      // Also check revision history in case an inspection was saved this month
      if (!isThisMonth && Array.isArray(pm.history)) {
        isThisMonth = pm.history.some(h => {
          const hDate = h.checkDate || h.archivedAt || h.savedAt || '';
          if (!hDate) return false;
          if (hDate.includes(currentMonthIso)) return true;
          const d = new Date(hDate);
          return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth0;
        });
      }

      return isThisMonth;
    };

    plans.forEach(plan => {
      const weeks = Array.isArray(plan.plannedWeeks) ? plan.plannedWeeks : [];
      // Check if current week slot is planned
      const isDueThisWeek = weeks.includes(currentSlot.slotKey);
      // Check if any slot in current month is planned
      const isDueThisMonth = weeks.some(w => w.startsWith(`${currentSlot.monthKey}_`));

      if (isDueThisWeek || isDueThisMonth) {
        const allTools = Array.isArray(plan.toolNos) ? plan.toolNos.filter(t => t && String(t).trim()) : [];
        if (allTools.length === 0) return;

        const completedToolNos = [];
        const pendingToolNos = [];

        allTools.forEach(tNo => {
          const cleanToolNo = String(tNo).toLowerCase().trim();
          
          // Check if this specific tool has a completed PM record for this month
          const isToolDone = pmRecords.some(pm => {
            const pmToolNo = (pm.toolNo || '').toLowerCase().trim();
            if (pmToolNo !== cleanToolNo) return false;

            return isPMRecordCompletedInCurrentMonth(pm);
          });

          if (isToolDone) {
            completedToolNos.push(tNo);
          } else {
            pendingToolNos.push(tNo);
          }
        });

        // User requirement:
        // "all the tool no updated the PM of all Tool then only clear the notofication"
        // An application part no can have between 1 and 50+ tools.
        // The notification will ONLY clear when ALL dependent tools have completed PM!
        const allToolsCompleted = allTools.length > 0 && pendingToolNos.length === 0;

        if (!allToolsCompleted) {
          dueList.push({
            plan,
            applicationPartNo: plan.applicationPartNo,
            productName: plan.productName,
            classification: plan.classification,
            toolNos: allTools,
            completedToolNos,
            pendingToolNos,
            totalToolsCount: allTools.length,
            completedCount: completedToolNos.length,
            pendingCount: pendingToolNos.length,
            isDueThisWeek,
            currentSlotKey: currentSlot.slotKey,
            currentSlotLabel: currentSlot.label,
            currentSlot
          });
        }
      }
    });

    return dueList;
  } catch (e) {
    console.error('Error getting due yearly schedules', e);
    return [];
  }
}

// Sign-off helper for Checked By (QA)
export function updateCheckedBySignOff(toolIdOrNo, signOffData) {
  try {
    const records = getPMRecords();
    const cleanNo = String(toolIdOrNo).toLowerCase().trim();
    let pm = records.find(r => 
      r.id === toolIdOrNo || 
      (r.toolId && r.toolId === toolIdOrNo) || 
      (r.toolNo && r.toolNo.toLowerCase().trim() === cleanNo)
    );

    const checkedObj = {
      name: signOffData.name || 'Quality Assurance Lead',
      date: signOffData.date || new Date().toISOString().slice(0, 10),
      remarks: signOffData.remarks || 'Check points and observation verified OK as per standards.',
      status: signOffData.status || 'Verified',
      timestamp: new Date().toISOString()
    };

    if (pm) {
      pm.checkedBy = checkedObj;
      pm.sentToApprovedBy = false; // Freshly verified: waiting for QA to send to Approved By
      savePMRecord(pm);
      return pm;
    } else {
      const tools = getTools();
      const tool = tools.find(t => t.id === toolIdOrNo || t.toolNo.toLowerCase().trim() === cleanNo);
      const newPm = {
        id: `pm_${tool?.id || Date.now()}`,
        toolId: tool?.id || toolIdOrNo,
        toolNo: tool?.toolNo || toolIdOrNo,
        checkDate: new Date().toISOString().slice(0, 10),
        checkedBy: checkedObj,
        sentToApprovedBy: false,
        items: []
      };
      savePMRecord(newPm);
      return newPm;
    }
  } catch (e) {
    console.error('Error updating Checked By sign-off', e);
    return null;
  }
}

// Bulk send verified PM tools from QA (Checked By) to Management (Approved By)
export function sendPMToolsToApprovedBy(toolIdsOrNos = [], senderName = 'Quality Assurance Lead') {
  try {
    const records = getPMRecords();
    const cleanTargets = toolIdsOrNos.map(id => String(id).toLowerCase().trim());

    let updatedCount = 0;
    records.forEach(pm => {
      const pmId = String(pm.id || '').toLowerCase().trim();
      const toolId = String(pm.toolId || '').toLowerCase().trim();
      const toolNo = String(pm.toolNo || '').toLowerCase().trim();

      if (cleanTargets.includes(pmId) || cleanTargets.includes(toolId) || cleanTargets.includes(toolNo)) {
        pm.sentToApprovedBy = true;
        pm.sentToApprovedAt = new Date().toISOString();
        pm.sentToApprovedBySender = senderName;
        updatedCount++;
      }
    });

    localStorage.setItem('tms_pm_records', JSON.stringify(records));
    return updatedCount;
  } catch (e) {
    console.error('Error sending PM tools to Approved By', e);
    return 0;
  }
}

// Sign-off helper for Approved By (Management / Plant Incharge)
export function updateApprovedBySignOff(toolIdOrNo, signOffData) {
  try {
    const records = getPMRecords();
    const cleanNo = String(toolIdOrNo).toLowerCase().trim();
    let pm = records.find(r => 
      r.id === toolIdOrNo || 
      (r.toolId && r.toolId === toolIdOrNo) || 
      (r.toolNo && r.toolNo.toLowerCase().trim() === cleanNo)
    );

    const approvedObj = {
      name: signOffData.name || 'Tool Room Lead / Plant Incharge',
      date: signOffData.date || new Date().toISOString().slice(0, 10),
      remarks: signOffData.remarks || 'Tool maintenance and PM checklist reviewed and authorized for production release.',
      status: signOffData.status || 'Approved',
      timestamp: new Date().toISOString()
    };

    if (pm) {
      pm.approvedBy = approvedObj;
      if (approvedObj.status === 'Rejected') {
        pm.sentToApprovedBy = false;
      }
      savePMRecord(pm);
      return pm;
    } else {
      const tools = getTools();
      const tool = tools.find(t => t.id === toolIdOrNo || t.toolNo.toLowerCase().trim() === cleanNo);
      const newPm = {
        id: `pm_${tool?.id || Date.now()}`,
        toolId: tool?.id || toolIdOrNo,
        toolNo: tool?.toolNo || toolIdOrNo,
        checkDate: new Date().toISOString().slice(0, 10),
        approvedBy: approvedObj,
        items: []
      };
      savePMRecord(newPm);
      return newPm;
    }
  } catch (e) {
    console.error('Error updating Approved By sign-off', e);
    return null;
  }
}

// User Management Storage
export function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function saveUser(userData) {
  try {
    const users = getUsers();
    const cleanId = userData.id || `USR-${String(Date.now()).slice(-4)}`;
    const initials = (userData.name || 'User')
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const userObj = {
      ...userData,
      id: cleanId,
      avatar: userData.avatar || initials,
      createdDate: userData.createdDate || new Date().toISOString().slice(0, 10),
      status: userData.status || 'Active'
    };

    const existingIndex = users.findIndex(u => u.id === cleanId || (userData.empId && u.empId === userData.empId));
    let updated;
    if (existingIndex >= 0) {
      updated = [...users];
      updated[existingIndex] = { ...updated[existingIndex], ...userObj };
    } else {
      updated = [userObj, ...users];
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving user', e);
    return [];
  }
}

export function deleteUser(userId) {
  try {
    const users = getUsers();
    const updated = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting user', e);
    return [];
  }
}

export const TMSStorage = {
  getTools,
  saveTool,
  replaceTool,
  deleteTool,
  getProductionLogs,
  addProductionLog,
  deleteProductionLog,
  getPMRecords,
  savePMRecord,
  deletePMRecord,
  getSchedules,
  saveSchedule,
  getYearlyPMPlans,
  saveYearlyPMPlan,
  toggleYearlyPlanWeek,
  getDueYearlyPMSchedules,
  updateCheckedBySignOff,
  updateApprovedBySignOff,
  sendPMToolsToApprovedBy,
  getUsers,
  saveUser,
  deleteUser,
  calculateMetrics,
  resetToInitialData,
  formatNumber,
  formatToolNumber,
  exportToolsToCSV,
  exportPMReportToCSV
};
