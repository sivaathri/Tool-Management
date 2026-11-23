// Preventive Maintenance Yearly Schedule Utilities
// Handles 12-Month Financial Year (Apr to Mar) 48-Week PM Planning Grid

export function getCurrentFiscalYear(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr, 11 = Dec
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function getFiscalYearMonths(fiscalYear = '2026-2027') {
  const parts = String(fiscalYear).split('-');
  const startYear = parseInt(parts[0], 10) || 2026;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  const startShort = String(startYear).slice(-2);
  const endShort = String(endYear).slice(-2);

  return [
    { key: `Apr-${startShort}`, name: 'Apr', label: `Apr-${startShort}`, monthNum: 4, monthIndex: 3, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `May-${startShort}`, name: 'May', label: `May-${startShort}`, monthNum: 5, monthIndex: 4, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Jun-${startShort}`, name: 'Jun', label: `Jun-${startShort}`, monthNum: 6, monthIndex: 5, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Jul-${startShort}`, name: 'Jul', label: `Jul-${startShort}`, monthNum: 7, monthIndex: 6, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Aug-${startShort}`, name: 'Aug', label: `Aug-${startShort}`, monthNum: 8, monthIndex: 7, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Sep-${startShort}`, name: 'Sep', label: `Sep-${startShort}`, monthNum: 9, monthIndex: 8, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Oct-${startShort}`, name: 'Oct', label: `Oct-${startShort}`, monthNum: 10, monthIndex: 9, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Nov-${startShort}`, name: 'Nov', label: `Nov-${startShort}`, monthNum: 11, monthIndex: 10, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Dec-${startShort}`, name: 'Dec', label: `Dec-${startShort}`, monthNum: 12, monthIndex: 11, year: startYear, weeks: [1, 2, 3, 4] },
    { key: `Jan-${endShort}`, name: 'Jan', label: `Jan-${endShort}`, monthNum: 1, monthIndex: 0, year: endYear, weeks: [1, 2, 3, 4] },
    { key: `Feb-${endShort}`, name: 'Feb', label: `Feb-${endShort}`, monthNum: 2, monthIndex: 1, year: endYear, weeks: [1, 2, 3, 4] },
    { key: `Mar-${endShort}`, name: 'Mar', label: `Mar-${endShort}`, monthNum: 3, monthIndex: 2, year: endYear, weeks: [1, 2, 3, 4] },
  ];
}

export function getCurrentWeekSlot(date = new Date()) {
  const d = new Date(date);
  const yearShort = String(d.getFullYear()).slice(-2);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthKey = `${monthNames[d.getMonth()]}-${yearShort}`;

  const day = d.getDate();
  const weekNum = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;

  return {
    monthKey,
    weekNum,
    slotKey: `${monthKey}_W${weekNum}`,
    label: `${monthKey} (Week ${weekNum})`
  };
}

export function parseSlotKey(slotKey = '') {
  // Format: "May-26_W2" -> monthKey: "May-26", weekNum: 2
  const parts = String(slotKey).split('_W');
  return {
    monthKey: parts[0] || '',
    weekNum: parseInt(parts[1], 10) || 1
  };
}

// Preset generator for common industrial recurrence
export function generatePresetWeeks(fiscalYear = '2026-2027', frequency = 'Quarterly') {
  const months = getFiscalYearMonths(fiscalYear);
  const weeks = [];

  if (frequency === 'Quarterly') {
    // 4 times per year: e.g. May-W1, Aug-W1, Nov-W2, Feb-W2 (matching user sample)
    weeks.push(`${months[1].key}_W1`); // May
    weeks.push(`${months[4].key}_W1`); // Aug
    weeks.push(`${months[7].key}_W2`); // Nov
    weeks.push(`${months[10].key}_W2`); // Feb
  } else if (frequency === 'Bi-Monthly') {
    // Every 2 months (6 times/year)
    for (let i = 0; i < months.length; i += 2) {
      weeks.push(`${months[i].key}_W2`);
    }
  } else if (frequency === 'Monthly') {
    // Every month (12 times/year)
    months.forEach(m => {
      weeks.push(`${m.key}_W2`);
    });
  } else if (frequency === 'Half-Yearly') {
    // Twice a year (6 months apart)
    weeks.push(`${months[1].key}_W2`); // May
    weeks.push(`${months[7].key}_W2`); // Nov
  }

  return weeks;
}

// Export Yearly Schedule Matrix to CSV matching the user's manual layout
export function exportYearlyScheduleMatrixCSV(fiscalYear, partRows = []) {
  const months = getFiscalYearMonths(fiscalYear);

  // Row 1: Header MONTH (Each month spans 4 week columns)
  const row1 = ['APPLICATION PART NO', 'APPLICATION / PRODUCT', 'DEPENDENT TOOL NUMBERS'];
  months.forEach(m => {
    row1.push(m.label, '', '', '');
  });

  // Row 2: Header WEEK (1, 2, 3, 4 under each month)
  const row2 = ['', '', ''];
  months.forEach(() => {
    row2.push('1', '2', '3', '4');
  });

  // Data Rows
  const dataRows = partRows.map(item => {
    const r = [
      `"${item.applicationPartNo || ''}"`,
      `"${(item.productName || item.description || '').replace(/"/g, '""')}"`,
      `"${(item.toolNos || []).join(', ')}"`
    ];

    months.forEach(m => {
      [1, 2, 3, 4].forEach(w => {
        const slotKey = `${m.key}_W${w}`;
        const isPlanned = Array.isArray(item.plannedWeeks) && item.plannedWeeks.includes(slotKey);
        r.push(isPlanned ? '"*"' : '""');
      });
    });

    return r;
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [
    row1.map(c => `"${c}"`).join(','),
    row2.map(c => `"${c}"`).join(','),
    ...dataRows.map(r => r.join(','))
  ].join('\n');

  const encoded = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encoded);
  link.setAttribute('download', `Yearly_PM_Schedule_${fiscalYear}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
