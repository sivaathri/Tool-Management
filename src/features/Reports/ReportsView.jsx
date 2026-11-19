import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatters';
import { exportToolsToCSV } from '../../services/reportService';

export default function ReportsView({ tools, metrics, showToast }) {
  const [reportType, setReportType] = useState('FLEET');

  const criticalTools = tools.filter(t => t.classification === 'Critical');
  const alertTools = tools.filter(t => t.status === 'Replacement Due' || t.status === 'Near Limit' || t.status === 'Critical Overrun');

  const displayedTools = reportType === 'CRITICAL' ? criticalTools : reportType === 'ALERTS' ? alertTools : tools;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportToolsToCSV(displayedTools, 'tool_report.csv');
    showToast('Report data exported to CSV', 'success');
  };

  return (
    <section className="view-section active" id="view-reports">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Management & Audit Reports</h1>
          <p className="page-subtitle">Standardized IATF 16949 / ISO 9001 compliance audit sheets and tool room analytics</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Template Selector Tabs */}
      <div className="filter-card">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${reportType === 'FLEET' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('FLEET')}
          >
            1. Tool Master Fleet Audit ({tools.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${reportType === 'CRITICAL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('CRITICAL')}
          >
            2. Critical Tools Lifecycle Audit ({criticalTools.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${reportType === 'ALERTS' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('ALERTS')}
          >
            3. Replacement Forecast Report ({alertTools.length})
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="card" id="reportPreviewContainer" style={{ padding: '28px', backgroundColor: '#fff' }}>
        <div style={{ borderBottom: '2px solid var(--slate-900)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', fontWeight: 700 }}>
                Manufacturing Plant Audit Document
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px', textTransform: 'uppercase' }}>
                {reportType === 'CRITICAL' 
                  ? 'Critical Tooling Life Cycle Audit Report'
                  : reportType === 'ALERTS'
                  ? 'Tooling Replacement & Overhaul Forecast'
                  : 'Plant Tool Master List & Fleet Health Report'}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                Generated on: {new Date().toLocaleDateString()} • System: Tools History Management System
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'var(--slate-100)', border: '1px solid var(--border-medium)' }}>
                CONFIDENTIAL AUDIT
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px' }}>
            <div>
              <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Audited Tools:</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>{displayedTools.length}</div>
            </div>
            <div>
              <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Total Cumulative Output:</div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-700)' }}>
                {formatNumber(metrics.totalProduced)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Replacement Due:</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>{metrics.criticalAlertsCount}</div>
            </div>
            <div>
              <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Near Limit Warnings:</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706' }}>{metrics.warningAlertsCount}</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="enterprise-table" style={{ border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--slate-100)' }}>
                <th>Tool No.</th>
                <th>App Part No.</th>
                <th>Product Name</th>
                <th>Classification</th>
                <th style={{ textAlign: 'center' }}>Tool Count</th>
                <th className="col-numeric">Life Time</th>
                <th className="col-numeric">Cumulative</th>
                <th className="col-numeric">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedTools.map(tool => (
                <tr key={tool.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-600)' }}>
                      {tool.toolNo}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {tool.applicationPartNo}
                    </span>
                  </td>
                  <td>{tool.productName}</td>
                  <td>{tool.classification || 'Non-Critical'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {tool.toolCount ?? 0}
                    </span>
                  </td>
                  <td className="col-numeric">
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(tool.lifetime)}</span>
                  </td>
                  <td className="col-numeric">
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatNumber(tool.cumulative)}</span>
                  </td>
                  <td className="col-numeric">
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: tool.balance <= 0 ? '#dc2626' : 'inherit' }}>
                      {formatNumber(tool.balance)}
                    </span>
                  </td>
                  <td>{tool.status === 'Active' ? 'Healthy' : tool.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign-offs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px' }}>
          <div>
            <div style={{ borderBottom: '1px solid var(--slate-400)', height: '40px', marginBottom: '6px' }}></div>
            <strong>Tool Room Engineer</strong>
            <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Signature & Date</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid var(--slate-400)', height: '40px', marginBottom: '6px' }}></div>
            <strong>Production Manager</strong>
            <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Signature & Date</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid var(--slate-400)', height: '40px', marginBottom: '6px' }}></div>
            <strong>Quality Assurance Head</strong>
            <div style={{ color: 'var(--slate-500)', fontSize: '11px' }}>Signature & Date</div>
          </div>
        </div>
      </div>
    </section>
  );
}
