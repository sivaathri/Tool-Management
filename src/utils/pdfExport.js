import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportPMReportToPDF(tool, logs = [], pmRecord = null) {
  if (!tool) return;

  const cleanToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
  const filename = `PM_Report_${cleanToolNo}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Format numbers
  const fmt = (num) => Number(num || 0).toLocaleString();
  const pct = tool.lifetime > 0 ? Math.min(100, Math.round(((tool.cumulative || 0) / tool.lifetime) * 100)) : 0;
  const status = tool.status === 'Active' ? 'Healthy' : (tool.status || 'Healthy');

  // Derive checklist items
  let checkItems = [];
  if (pmRecord && Array.isArray(pmRecord.items) && pmRecord.items.length > 0) {
    checkItems = pmRecord.items;
  } else if (Array.isArray(tool.checkPoints) && tool.checkPoints.length > 0) {
    checkItems = tool.checkPoints.map((cp, idx) => {
      const text = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
      return {
        sno: idx + 1,
        checkPoint: text,
        method: (typeof cp === 'object' && cp.method) ? cp.method : 'Visual',
        specification: (typeof cp === 'object' && cp.spec) ? cp.spec : 'Free from damage and chip off',
        actualCondition: 'OK / Free from damage',
        actionTaken: 'None required'
      };
    });
  } else {
    checkItems = [
      { sno: 1, checkPoint: 'CHECK COIL LOCATOR FOR ANY DAMAGES', method: 'Visual', specification: 'Free from chip off and damages', actualCondition: 'Free from Damages', actionTaken: 'None required' },
      { sno: 2, checkPoint: 'CHECK COUPLER LOCATOR FOR ANY DAMAGES', method: 'Visual', specification: 'Free from chip off and damages', actualCondition: 'OK', actionTaken: 'None required' },
      { sno: 3, checkPoint: 'CHECK COUPLER LOCATOR ANY PLAY', method: 'Visual', specification: 'Free from play', actualCondition: 'Locator OK', actionTaken: 'None required' },
      { sno: 4, checkPoint: 'CHECK WIRE GUIDE FOR ANY DAMAGES', method: 'Visual', specification: 'Free from chip off and damages', actualCondition: 'OK', actionTaken: 'None required' },
      { sno: 5, checkPoint: 'ENSURE TOOL IDENTIFICATION NUMBER', method: 'Visual', specification: 'As per Master List', actualCondition: tool.toolNo, actionTaken: 'Verified OK' }
    ];
  }

  // Create an off-screen container styled exactly for A4 landscape PDF
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '24px 28px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  const checkDate = pmRecord?.checkDate || new Date().toISOString().slice(0, 10);
  const nextDueDate = pmRecord?.nextDueDate || (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  })();

  const isCritical = tool.classification === 'Critical';

  container.innerHTML = `
    <!-- 1. OFFICIAL DOCUMENT HEADER -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="/inel-logo.png" alt="INEL" style="width: 44px; height: 44px; object-fit: contain;" />
        <div>
          <div style="font-size: 19px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #0f172a;">
            TOOLS HISTORY MANAGEMENT SYSTEM
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #1e40af; margin-top: 2px;">
            PREVENTIVE MAINTENANCE & LIFECYCLE SERVICE REPORT (INEL II PUDUCHERRY)
          </div>
        </div>
      </div>
      <div style="text-align: right; font-size: 11.5px; color: #475569; line-height: 1.5;">
        <div><strong>DOC REF:</strong> MFG/FR/075</div>
        <div><strong>TOOL NUMBER:</strong> <span style="font-family: monospace; font-weight: 700; color: #1e40af;">${tool.toolNo}</span></div>
        <div><strong>DATE GENERATED:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      </div>
    </div>

    <!-- 2. TOOL MASTER SUMMARY CARD -->
    <div style="border: 1.5px solid #0f172a; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; background-color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px; font-weight: 800; color: #0f172a;">${tool.toolNo}</span>
          <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; border: 1px solid #a7f3d0; background-color: #ecfdf5; color: #065f46;">
            ● ${status}
          </span>
          <span style="font-size: 13px; color: #475569; margin-left: 6px;">${tool.description || 'Precision Manufacturing Tool'}</span>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #1e40af;">
          Cycle ${tool.toolCount ?? 0}
        </div>
      </div>

      <!-- 9 Meta Items Grid -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px;">
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">App Part No (Parent)</div>
          <div style="font-size: 12.5px; font-weight: 800; font-family: monospace; color: #1e40af; margin-top: 2px;">${tool.applicationPartNo || '—'}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Product Name</div>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">${tool.productName || '—'}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Tool Description</div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px;">${tool.description || '—'}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Classification</div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px;">${tool.classification || 'Non-Critical'}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Tool Issued On</div>
          <div style="font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a; margin-top: 2px;">${tool.toolIssuedOn || '—'}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Cycle Count</div>
          <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #0f172a; margin-top: 2px;">${tool.toolCount ?? 0}</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Life Time Limit</div>
          <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #2563eb; margin-top: 2px;">${fmt(tool.lifetime)} strokes</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Current Cumulative</div>
          <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #0f172a; margin-top: 2px;">${fmt(tool.cumulative)} strokes</div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Remaining Balance</div>
          <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: ${tool.balance <= 0 ? '#dc2626' : '#d97706'}; margin-top: 2px;">${fmt(tool.balance)} strokes</div>
        </div>
      </div>

      <!-- Life Utilization Progress -->
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
          <span>Tool Life Utilization</span>
          <span>${pct}% Used (${fmt(tool.cumulative)} / ${fmt(tool.lifetime)} strokes)</span>
        </div>
        <div style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1;">
          <div style="width: ${pct}%; height: 100%; background-color: ${pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'};"></div>
        </div>
      </div>
    </div>

    <!-- 3. PREVENTIVE MAINTENANCE CHECK LIST SHEET -->
    <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
      <!-- Title Box -->
      <div style="background-color: #f1f5f9; border-bottom: 1px solid #0f172a; padding: 8px 12px; text-align: center;">
        <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; color: #0f172a;">
          PREVENTIVE MAINTENANCE CHECK LIST FOR ${isCritical ? 'CRITICAL' : 'NON CRITICAL'} TOOLS
        </div>
      </div>

      <!-- Metadata 3 Rows -->
      <div style="display: grid; grid-template-columns: 130px 1fr 120px 160px 80px 130px; border-bottom: 1px solid #0f172a; font-size: 11px; align-items: center;">
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Tool No</div>
        <div style="padding: 5px 10px; font-weight: 800; font-family: monospace; color: #1e40af; border-right: 1px solid #0f172a;">${tool.toolNo}</div>
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Date of check:</div>
        <div style="padding: 5px 8px; font-weight: 700; border-right: 1px solid #0f172a;">${checkDate}</div>
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Ref No.:</div>
        <div style="padding: 5px 8px; font-family: monospace; font-weight: 700;">MFG/FR/075</div>
      </div>

      <div style="display: grid; grid-template-columns: 130px 1fr 120px 240px; border-bottom: 1px solid #0f172a; font-size: 11px; align-items: center;">
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Tool description</div>
        <div style="padding: 5px 10px; font-weight: 600; border-right: 1px solid #0f172a;">${tool.description || 'Precision Manufacturing Tool'}</div>
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Next due Date:</div>
        <div style="padding: 5px 8px; font-weight: 700;">${nextDueDate}</div>
      </div>

      <div style="display: grid; grid-template-columns: 130px 1fr 120px 240px; border-bottom: 1px solid #0f172a; font-size: 11px; align-items: center;">
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Application</div>
        <div style="padding: 5px 10px; font-weight: 600; border-right: 1px solid #0f172a;">${tool.applicationPartNo ? tool.applicationPartNo + ' - ' + (tool.productName || '') : (tool.productName || '—')}</div>
        <div style="padding: 5px 8px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a;">Tool Issued On:</div>
        <div style="padding: 5px 8px; font-family: monospace; font-weight: 700;">${tool.toolIssuedOn || '—'}</div>
      </div>

      <!-- Checklist Items Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1px solid #0f172a; font-weight: 800; text-transform: uppercase;">
            <th style="width: 5%; text-align: center; padding: 6px 4px; border-right: 1px solid #0f172a;">S.no</th>
            <th style="width: 27%; text-align: left; padding: 6px 10px; border-right: 1px solid #0f172a;">Check points</th>
            <th style="width: 14%; text-align: center; padding: 6px 8px; border-right: 1px solid #0f172a;">Checking Method</th>
            <th style="width: 18%; text-align: left; padding: 6px 10px; border-right: 1px solid #0f172a;">Specification</th>
            <th style="width: 20%; text-align: left; padding: 6px 10px; border-right: 1px solid #0f172a; background-color: #eff6ff;">Actual condition *</th>
            <th style="width: 16%; text-align: left; padding: 6px 10px;">Action Taken</th>
          </tr>
        </thead>
        <tbody>
          ${checkItems.map((item, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="text-align: center; font-weight: 700; padding: 6px 4px; border-right: 1px solid #cbd5e1;">${item.sno || idx + 1}</td>
              <td style="padding: 6px 10px; font-weight: 700; color: #0f172a; border-right: 1px solid #cbd5e1; line-height: 1.35;">${item.checkPoint || ''}</td>
              <td style="text-align: center; padding: 6px 8px; font-weight: 600; color: #475569; border-right: 1px solid #cbd5e1;">${item.method || 'Visual'}</td>
              <td style="padding: 6px 10px; color: #334155; border-right: 1px solid #cbd5e1; line-height: 1.3;">${item.specification || '—'}</td>
              <td style="padding: 6px 10px; font-weight: 600; color: #1e3a8a; border-right: 1px solid #cbd5e1; background-color: #eff6ff;">${item.actualCondition || 'OK / Free from damage'}</td>
              <td style="padding: 6px 10px; color: #334155;">${item.actionTaken || 'None required'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 4. QUANTITY PRODUCED TABLE -->
    <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
      <div style="background-color: #f1f5f9; border-bottom: 1px solid #0f172a; padding: 8px 12px; font-weight: 800; font-size: 12px; text-transform: uppercase;">
        Quantity Produced (Production Tracking - Active Cycle ${tool.toolCount ?? 0})
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #0f172a; font-weight: 800; text-transform: uppercase;">
            <th style="width: 25%; text-align: left; padding: 6px 10px; border-right: 1px solid #0f172a;">Month / Date</th>
            <th style="width: 35%; text-align: center; padding: 6px 10px; border-right: 1px solid #0f172a;">Quantity Output Made</th>
            <th style="width: 40%; text-align: center; padding: 6px 10px;">Cumulative Output (Strokes)</th>
          </tr>
        </thead>
        <tbody>
          ${logs.length === 0 ? `
            <tr>
              <td colspan="3" style="text-align: center; padding: 18px 10px; color: #64748b;">
                No production batches recorded yet for Cycle ${tool.toolCount ?? 0}.
              </td>
            </tr>
          ` : logs.map((l, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 6px 10px; font-family: monospace; font-weight: 600; border-right: 1px solid #e2e8f0;">${l.month || l.date}</td>
              <td style="text-align: center; padding: 6px 10px; font-family: monospace; font-weight: 700; border-right: 1px solid #e2e8f0;">${fmt(l.quantity)}</td>
              <td style="text-align: center; padding: 6px 10px; font-family: monospace; font-weight: 700; color: #1e40af;">${fmt(l.cumulative || l.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 5. REPLACEMENT HISTORY (If any) -->
    ${tool.replacements && tool.replacements.length > 0 ? `
      <div style="border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
        <div style="background-color: #fef2f2; border-bottom: 1px solid #0f172a; padding: 8px 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: #991b1b;">
          Tool Replacement & Overhaul History (${tool.replacements.length} Records)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #0f172a; font-weight: 800;">
              <th style="padding: 5px 8px; text-align: left; border-right: 1px solid #0f172a;">Replacement Date</th>
              <th style="padding: 5px 8px; text-align: center; border-right: 1px solid #0f172a;">Cycle Transition</th>
              <th style="padding: 5px 8px; text-align: center; border-right: 1px solid #0f172a;">Strokes at Retirement</th>
              <th style="padding: 5px 8px; text-align: left; border-right: 1px solid #0f172a;">Replaced By</th>
              <th style="padding: 5px 8px; text-align: left;">Reason / Action</th>
            </tr>
          </thead>
          <tbody>
            ${tool.replacements.map((r, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 5px 8px; font-family: monospace; border-right: 1px solid #e2e8f0;">${r.replacementDate || '—'}</td>
                <td style="padding: 5px 8px; text-align: center; font-weight: 700; border-right: 1px solid #e2e8f0;">Cycle ${r.cycle} → Cycle ${r.newCycle}</td>
                <td style="padding: 5px 8px; text-align: center; font-family: monospace; font-weight: 700; border-right: 1px solid #e2e8f0;">${fmt(r.finalCumulative)}</td>
                <td style="padding: 5px 8px; border-right: 1px solid #e2e8f0;">${r.replacedBy || 'Tool Room Lead'}</td>
                <td style="padding: 5px 8px;">${r.remarks || 'Replaced at stroke limit'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- 6. OFFICIAL SIGN-OFF BLOCK -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); border: 1.5px solid #0f172a; text-align: center; background-color: #ffffff; margin-top: 18px;">
      <div style="padding: 10px 12px; border-right: 1px solid #0f172a;">
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Inspected & Prepared By</div>
        <div style="height: 38px;"></div>
        <div style="font-size: 11.5px; font-weight: 700; border-top: 1px dashed #94a3b8; padding-top: 4px; color: #0f172a;">
          Tool Maintenance Technician
        </div>
      </div>
      <div style="padding: 10px 12px; border-right: 1px solid #0f172a;">
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Verified & Checked By</div>
        <div style="height: 38px;"></div>
        <div style="font-size: 11.5px; font-weight: 700; border-top: 1px dashed #94a3b8; padding-top: 4px; color: #0f172a;">
          Quality Assurance Lead
        </div>
      </div>
      <div style="padding: 10px 12px;">
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Approved By</div>
        <div style="height: 38px;"></div>
        <div style="font-size: 11.5px; font-weight: 700; border-top: 1px dashed #94a3b8; padding-top: 4px; color: #0f172a;">
          Tool Room Lead / Plant Incharge
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = 297;
    const pdfHeight = 210;
    const margin = 8;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - (margin * 2));

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
