import { INITIAL_TOOLS, INITIAL_MACHINES, INITIAL_PRODUCTION } from './initialData';

const STORAGE_KEYS = {
  TOOLS: 'tms_tools_v4',
  PRODUCTION: 'tms_production_v4',
};

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

  const rows = toolsList.map(t => [
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
    `"${(t.status || 'Active').replace(/"/g, '""')}"`
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

  // Normalize checkPoints to array of string strings
  let checkPoints = [];
  if (Array.isArray(raw.checkPoints)) {
    checkPoints = raw.checkPoints.map(cp => {
      if (typeof cp === 'string') return cp;
      if (cp && typeof cp === 'object') return cp.point || cp.text || '';
      return '';
    }).filter(Boolean);
  }

  // Calculate cumulative from matching production logs
  const matchingLogs = productionLogs.filter(p => 
    p.toolId === id || (p.toolNo && p.toolNo.toLowerCase() === toolNo.toLowerCase())
  );
  
  const loggedCumulative = matchingLogs.reduce((acc, curr) => acc + (Number(curr.quantity) || Number(curr.quantityMade) || 0), 0);
  const baseCumulative = Number(raw.cumulative || raw.cumulativeQuantity || 0);
  const cumulative = Math.max(loggedCumulative, baseCumulative);

  // Remaining balance
  const rawBalance = lifetime > 0 ? (lifetime - cumulative) : 0;
  const balance = rawBalance < 0 ? 0 : rawBalance;

  // Tool Count: auto-calculated cycle count (starts at 0, increments to 1, 2... as cumulative exceeds lifetime)
  const computedCycles = lifetime > 0 ? Math.floor(cumulative / lifetime) : 0;
  const toolCount = computedCycles;

  // Lifecycle status
  let status = 'Active';
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
    balance,
    status
  };
}

// Convert raw initial production to standardized model
function normalizeProductionItem(raw) {
  return {
    id: raw.id || `prd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    toolId: raw.toolId || null,
    toolNo: formatToolNumber(raw.toolNo || raw.toolNumber),
    date: raw.date || raw.productionDate || new Date().toISOString().slice(0, 10),
    quantity: Number(raw.quantity || raw.quantityMade || 0),
    operator: raw.operator || 'Operator',
    notes: raw.notes || raw.remarks || ''
  };
}

// Initialize seed data if not present
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.TOOLS)) {
    const prods = (INITIAL_PRODUCTION || []).map(normalizeProductionItem);
    const tools = (INITIAL_TOOLS || []).map(t => normalizeToolItem(t, prods));
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(prods));
  }
}

// Get all tools enriched with cumulative & cycle counts
export function getTools() {
  initStorage();
  try {
    const logs = getProductionLogs();
    const rawData = localStorage.getItem(STORAGE_KEYS.TOOLS);
    const tools = rawData ? JSON.parse(rawData) : INITIAL_TOOLS;
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
  const tools = getTools();
  toolData.toolNo = formatToolNumber(toolData.toolNo || toolData.toolNumber);
  const normalized = normalizeToolItem(toolData, logs);

  const existingIdx = tools.findIndex(t => t.id === normalized.id || t.toolNo.toLowerCase() === normalized.toolNo.toLowerCase());
  if (existingIdx >= 0) {
    tools[existingIdx] = normalized;
  } else {
    tools.unshift(normalized);
  }

  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
  return normalized;
}

// Delete a tool
export function deleteTool(toolId) {
  initStorage();
  const tools = getTools().filter(t => t.id !== toolId);
  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
}

// Get all production logs
export function getProductionLogs() {
  initStorage();
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.PRODUCTION);
    const logs = rawData ? JSON.parse(rawData) : INITIAL_PRODUCTION;
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
  initStorage();
}

export const TMSStorage = {
  getTools,
  saveTool,
  deleteTool,
  getProductionLogs,
  addProductionLog,
  deleteProductionLog,
  calculateMetrics,
  resetToInitialData,
  formatNumber,
  formatToolNumber,
  exportToolsToCSV
};
