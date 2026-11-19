import {
  calculateMetrics,
  exportToolsToCSV,
  exportPMReportToCSV
} from '../data/storage';
import { exportPMReportToPDF } from '../utils/pdfExport';

export const reportService = {
  calculateMetrics,
  exportToolsToCSV,
  exportPMReportToCSV,
  exportPMReportToPDF
};

export {
  calculateMetrics,
  exportToolsToCSV,
  exportPMReportToCSV,
  exportPMReportToPDF
};
