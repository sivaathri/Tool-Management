import { INITIAL_TOOLS, INITIAL_MACHINES, INITIAL_PRODUCTION, INITIAL_USERS } from './initialData';
import { STORAGE_KEYS } from '../constants/storageKeys';

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
  lines.push(`Application Part No (Parent),"${tool.applicationPartNo || ''}"`);
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
  const criticalAlertsCount = tools.filter(t => t.status === 'Replacement Due' || t.status === 'Critical Overrun').length;
  const warningAlertsCount = tools.filter(t => t.status === 'Near Limit').length;
  const activeCount = tools.filter(t => t.status === 'Active' || t.status === 'Healthy').length;

  return {
    totalTools,
    uniquePartsCount,
    totalProduced,
    criticalAlertsCount,
    warningAlertsCount,
    activeCount
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
