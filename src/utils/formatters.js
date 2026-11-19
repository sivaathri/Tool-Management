// Format numbers with commas (e.g. 200,000)
export function formatNumber(val) {
  if (val === undefined || val === null || val === '') return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

// Format date string to "MMM-YY" (e.g. "Oct-18", "Nov-18", "Feb-23")
export function formatMonthYear(dateStr) {
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

// Format month (YYYY-MM) to full name (e.g. "February 2023")
export function formatMonthName(monthStr) {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  return monthStr;
}

// Helper to strictly enforce "INE T " prefix on all tool numbers
export const ensureInetPrefix = (val) => {
  if (!val) return 'INE T 0000';
  const str = String(val).trim();
  if (str.toUpperCase().startsWith('INE T')) {
    return str.replace(/^INE\s*T\s*/i, 'INE T ');
  }
  const digits = str.replace(/\D/g, '');
  return `INE T ${digits ? digits.padStart(4, '0') : str}`;
};
