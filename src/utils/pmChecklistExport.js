import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates the clean, official HTML layout of ONLY the Preventive Maintenance Check List sheet.
 * Excludes production logs, replacement history, and tool life summary graphs.
 */
export function generatePMChecklistHTML(tool, pmRecord = null) {
  if (!tool) return '';

  const isCritical = tool.classification === 'Critical';
  const checkDate = pmRecord?.checkDate || new Date().toISOString().slice(0, 10);
  const nextDueDate = pmRecord?.nextDueDate || (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  })();
  const refNo = pmRecord?.refNo || 'MFG/FR/075';

  // Derive checklist items
  let checkItems = [];
  if (pmRecord && Array.isArray(pmRecord.items) && pmRecord.items.length > 0) {
    checkItems = pmRecord.items;
  } else if (pmRecord && Array.isArray(pmRecord.rows) && pmRecord.rows.length > 0) {
    checkItems = pmRecord.rows;
  } else if (Array.isArray(tool.checkPoints) && tool.checkPoints.length > 0) {
    checkItems = tool.checkPoints.map((cp, idx) => {
      const text = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
      return {
        sno: idx + 1,
        checkPoint: text,
        method: (typeof cp === 'object' && cp.method) ? cp.method : 'Visual',
        specification: (typeof cp === 'object' && (cp.spec || cp.specification)) ? (cp.spec || cp.specification) : '—',
        actualCondition: 'OK / Verified',
        actionTaken: 'None required'
      };
    });
  }

  if (checkItems.length === 0) {
    checkItems = [
      { sno: 1, checkPoint: 'Check Overall Tool Assembly & Fasteners', method: 'Visual', specification: 'Firm & Secure', actualCondition: 'OK', actionTaken: 'None required' }
    ];
  }

  const preparedByName = pmRecord?.preparedBy || pmRecord?.inspectedBy || 'Maintenance Technician';
  const checkedByName = pmRecord?.checkedBy?.name || '';
  const checkedByDate = pmRecord?.checkedBy?.date || '';
  const isChecked = pmRecord?.checkedBy?.status === 'Verified';

  const approvedByName = pmRecord?.approvedBy?.name || '';
  const approvedByDate = pmRecord?.approvedBy?.date || '';
  const isApproved = pmRecord?.approvedBy?.status === 'Approved';

  const appPartText = tool.applicationPartNo
    ? `${tool.applicationPartNo}${tool.productName ? ' - ' + tool.productName : ''}`
    : (tool.productName || '—');

  return `
    <div style="border: 1.5px solid #0f172a; border-radius: 4px; overflow: hidden; background-color: #ffffff; width: 100%; box-sizing: border-box;">
      
      <!-- 1. Header Box: Logo & Title -->
      <div style="display: grid; grid-template-columns: 180px 1fr; border-bottom: 1.5px solid #0f172a; min-height: 52px;">
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-right: 1.5px solid #0f172a; background-color: #f8fafc;">
          <img src="/inel-logo.png" alt="INEL" style="width: 38px; height: 38px; object-fit: contain;" />
          <div style="line-height: 1.2;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">INEL II</div>
            <div style="font-size: 10.5px; font-weight: 700; color: #475569; letter-spacing: 0.5px;">PUDUCHERRY</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; padding: 10px 16px; text-align: center; background-color: #ffffff;">
          <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: #0f172a;">
            PREVENTIVE MAINTENANCE CHECK LIST FOR ${isCritical ? 'CRITICAL' : 'NON CRITICAL'} TOOLS
          </div>
        </div>
      </div>

      <!-- 2. Metadata Grid (3 Rows) -->
      <div style="border-bottom: 1.5px solid #0f172a; font-size: 11.5px;">
        
        <!-- Row 1: Tool No | Date of check | Ref No -->
        <div style="display: grid; grid-template-columns: 130px 1fr 120px 140px 80px 130px; border-bottom: 1px solid #0f172a; min-height: 34px; align-items: center;">
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Tool No</div>
          <div style="padding: 6px 12px; font-family: monospace; font-weight: 800; color: #1e40af; font-size: 13.5px; border-right: 1px solid #0f172a;">${tool.toolNo || ''}</div>
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Date of check:</div>
          <div style="padding: 6px 10px; font-weight: 700; border-right: 1px solid #0f172a; color: #0f172a;">${checkDate}</div>
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Ref No.:</div>
          <div style="padding: 6px 10px; font-family: monospace; font-weight: 700; color: #0f172a;">${refNo}</div>
        </div>

        <!-- Row 2: Tool description | Next due Date -->
        <div style="display: grid; grid-template-columns: 130px 1fr 120px 350px; border-bottom: 1px solid #0f172a; min-height: 34px; align-items: center;">
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Tool description</div>
          <div style="padding: 6px 12px; font-weight: 700; text-transform: uppercase; color: #0f172a; border-right: 1px solid #0f172a;">${tool.description || 'Precision Manufacturing Tool'}</div>
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Next due Date:</div>
          <div style="padding: 6px 10px; font-weight: 700; color: #0f172a;">${nextDueDate}</div>
        </div>

        <!-- Row 3: Application | Tool Issued On -->
        <div style="display: grid; grid-template-columns: 130px 1fr 120px 350px; min-height: 34px; align-items: center;">
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Application</div>
          <div style="padding: 6px 12px; font-weight: 600; color: #0f172a; border-right: 1px solid #0f172a;">${appPartText}</div>
          <div style="padding: 6px 10px; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Tool Issued On:</div>
          <div style="padding: 6px 10px; font-family: monospace; font-weight: 700; color: #0f172a;">${tool.toolIssuedOn || '—'}</div>
        </div>
      </div>

      <!-- 3. Checklist Items Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #0f172a; font-weight: 800; text-transform: uppercase;">
            <th style="width: 5%; text-align: center; padding: 8px 4px; border-right: 1px solid #0f172a;">S.no</th>
            <th style="width: 26%; text-align: left; padding: 8px 10px; border-right: 1px solid #0f172a;">Check points</th>
            <th style="width: 14%; text-align: center; padding: 8px 6px; border-right: 1px solid #0f172a;">Checking Method</th>
            <th style="width: 18%; text-align: left; padding: 8px 10px; border-right: 1px solid #0f172a;">Specification</th>
            <th style="width: 20%; text-align: left; padding: 8px 10px; border-right: 1px solid #0f172a; background-color: #eff6ff;">Actual condition *</th>
            <th style="width: 17%; text-align: left; padding: 8px 10px;">Action Taken</th>
          </tr>
        </thead>
        <tbody>
          ${checkItems.map((item, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="text-align: center; font-weight: 700; padding: 8px 4px; border-right: 1px solid #cbd5e1;">${item.sno || idx + 1}</td>
              <td style="padding: 8px 10px; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1; line-height: 1.35;">${item.checkPoint || ''}</td>
              <td style="text-align: center; padding: 8px 6px; font-weight: 700; color: #334155; border-right: 1px solid #cbd5e1;">${item.method || 'Visual'}</td>
              <td style="padding: 8px 10px; color: #1e293b; border-right: 1px solid #cbd5e1; line-height: 1.35;">${item.specification || '—'}</td>
              <td style="padding: 8px 10px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #cbd5e1; background-color: #eff6ff;">${item.actualCondition || 'OK / Verified'}</td>
              <td style="padding: 8px 10px; color: #1e293b;">${item.actionTaken || 'None required'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 4. Sign-Off Authorization Footer (3 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1.5px solid #0f172a; background-color: #ffffff; text-align: center;">
        <div style="padding: 12px 14px; border-right: 1px solid #0f172a; min-height: 65px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 6px;">Prepared By</div>
          <div style="font-weight: 800; font-size: 13px; color: #0284c7;">✓ ${preparedByName}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Checked: ${checkDate}</div>
        </div>
        <div style="padding: 12px 14px; border-right: 1px solid #0f172a; min-height: 65px; display: flex; flex-direction: column; justify-content: center; background-color: ${isChecked ? '#f0fdf4' : '#fafafa'};">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 6px;">Checked By</div>
          ${isChecked ? `
            <div style="font-weight: 800; font-size: 13px; color: #16a34a;">✓ ${checkedByName}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Verified &bull; ${checkedByDate}</div>
          ` : `
            <div style="font-size: 12px; font-style: italic; color: #94a3b8;">Pending QA Check</div>
          `}
        </div>
        <div style="padding: 12px 14px; min-height: 65px; display: flex; flex-direction: column; justify-content: center; background-color: ${isApproved ? '#eff6ff' : '#fafafa'};">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 6px;">Approved By</div>
          ${isApproved ? `
            <div style="font-weight: 800; font-size: 13px; color: #2563eb;">✓ ${approvedByName}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Approved &bull; ${approvedByDate}</div>
          ` : `
            <div style="font-size: 12px; font-style: italic; color: #94a3b8;">Pending Management Approval</div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Exports ONLY the Preventive Maintenance Check List for a single tool as a landscape A4 PDF.
 */
export async function exportSinglePMChecklistPDF(tool, pmRecord = null) {
  if (!tool) return;

  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfWidth = 297;
  const pdfHeight = 210;
  const margin = 8;
  const contentWidth = pdfWidth - (margin * 2);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '14px 18px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  container.innerHTML = generatePMChecklistHTML(tool, pmRecord);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - (margin * 2));

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage('a4', 'l');
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));
    }

    const cleanToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
    const filename = `PM_Checklist_${cleanToolNo}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Exports ALL PM Checklists across all tools into a single multi-page landscape A4 PDF.
 * Each tool's PM Checklist begins on its own clean page.
 */
export async function exportAllPMChecklistsPDF(tools = [], pmRecords = [], onProgress = null) {
  if (!tools || tools.length === 0) return;

  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfWidth = 297;
  const pdfHeight = 210;
  const margin = 8;
  const contentWidth = pdfWidth - (margin * 2);

  let pageCount = 0;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const cleanToolNo = (tool.toolNo || '').toLowerCase().trim();
    const pmRecord = pmRecords.find(r => 
      (tool.id && r.toolId === tool.id) ||
      (r.toolNo && r.toolNo.toLowerCase().trim() === cleanToolNo)
    );

    onProgress?.(`Generating PM sheet ${i + 1} of ${tools.length} (${tool.toolNo})...`, i + 1, tools.length);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1120px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.padding = '14px 18px';
    container.style.boxSizing = 'border-box';
    container.style.zIndex = '-9999';

    container.innerHTML = generatePMChecklistHTML(tool, pmRecord);
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (pageCount > 0) {
        pdf.addPage('a4', 'l');
      }
      pageCount++;

      let heightLeft = contentHeight;
      let position = margin;
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage('a4', 'l');
        pageCount++;
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }
    } finally {
      document.body.removeChild(container);
    }
  }

  const filename = `All_Preventive_Maintenance_Checklists_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}

/**
 * Exports ONLY the Preventive Maintenance Check List for a single tool to CSV/Excel format.
 */
export function exportPMChecklistOnlyCSV(tool, pmRecord = null) {
  if (!tool) return;

  const isCritical = tool.classification === 'Critical';
  const checkDate = pmRecord?.checkDate || new Date().toISOString().slice(0, 10);
  const nextDueDate = pmRecord?.nextDueDate || '';
  const refNo = pmRecord?.refNo || 'MFG/FR/075';

  let checkItems = [];
  if (pmRecord && Array.isArray(pmRecord.items) && pmRecord.items.length > 0) {
    checkItems = pmRecord.items;
  } else if (pmRecord && Array.isArray(pmRecord.rows) && pmRecord.rows.length > 0) {
    checkItems = pmRecord.rows;
  } else if (Array.isArray(tool.checkPoints) && tool.checkPoints.length > 0) {
    checkItems = tool.checkPoints.map((cp, idx) => ({
      sno: idx + 1,
      checkPoint: typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || ''),
      method: (typeof cp === 'object' && cp.method) ? cp.method : 'Visual',
      specification: (typeof cp === 'object' && (cp.spec || cp.specification)) ? (cp.spec || cp.specification) : '—',
      actualCondition: 'OK / Verified',
      actionTaken: 'None required'
    }));
  }

  const lines = [];
  lines.push(`"INEL II PUDUCHERRY"`);
  lines.push(`"PREVENTIVE MAINTENANCE CHECK LIST FOR ${isCritical ? 'CRITICAL' : 'NON CRITICAL'} TOOLS"`);
  lines.push('');
  lines.push(`"Tool No","${tool.toolNo || ''}","Date of check","${checkDate}","Ref No.","${refNo}"`);
  lines.push(`"Tool description","${(tool.description || '').replace(/"/g, '""')}","Next due Date","${nextDueDate}"`);
  lines.push(`"Application","${((tool.applicationPartNo ? tool.applicationPartNo + ' - ' : '') + (tool.productName || '')).replace(/"/g, '""')}","Tool Issued On","${tool.toolIssuedOn || ''}"`);
  lines.push('');
  lines.push('"S.No","Check points","Checking Method","Specification","Actual condition","Action Taken"');

  checkItems.forEach((r, idx) => {
    lines.push(`${idx + 1},"${(r.checkPoint || '').replace(/"/g, '""')}","${(r.method || 'Visual').replace(/"/g, '""')}","${(r.specification || '').replace(/"/g, '""')}","${(r.actualCondition || '').replace(/"/g, '""')}","${(r.actionTaken || '').replace(/"/g, '""')}"`);
  });

  lines.push('');
  lines.push(`"PREPARED BY","${pmRecord?.preparedBy || pmRecord?.inspectedBy || 'Maintenance Technician'}"`);
  lines.push(`"CHECKED BY","${pmRecord?.checkedBy?.name ? pmRecord.checkedBy.name + ' (' + pmRecord.checkedBy.status + ')' : 'Pending QA Check'}"`);
  lines.push(`"APPROVED BY","${pmRecord?.approvedBy?.name ? pmRecord.approvedBy.name + ' (' + pmRecord.approvedBy.status + ')' : 'Pending Management Approval'}"`);

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
  a.download = `PM_Checklist_${cleanToolNo}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports ALL PM Checklists across all tools into a single comprehensive CSV/Excel spreadsheet.
 */
export function exportAllPMChecklistsCSV(tools = [], pmRecords = []) {
  if (!tools || tools.length === 0) return;

  const lines = [];
  lines.push(`"INEL II PUDUCHERRY - PREVENTIVE MAINTENANCE CHECK LISTS (ALL TOOLS)"`);
  lines.push(`"Generated On","${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}"`);
  lines.push(`"Document Reference","MFG/FR/075"`);
  lines.push('');
  lines.push('"Tool No","Application Part No","Product Name","Classification","Tool Issued On","Date of Check","Next Due Date","Ref No","S.No","Check Points","Checking Method","Specification","Actual Condition","Action Taken","Prepared By","Checked By (QA)","Approved By (Management)"');

  tools.forEach(tool => {
    const cleanToolNo = (tool.toolNo || '').toLowerCase().trim();
    const pmRecord = pmRecords.find(r => 
      (tool.id && r.toolId === tool.id) ||
      (r.toolNo && r.toolNo.toLowerCase().trim() === cleanToolNo)
    );

    const checkDate = pmRecord?.checkDate || '';
    const nextDueDate = pmRecord?.nextDueDate || '';
    const preparedBy = pmRecord?.preparedBy || pmRecord?.inspectedBy || '';
    const checkedBy = pmRecord?.checkedBy?.name ? `${pmRecord.checkedBy.name} (${pmRecord.checkedBy.status})` : 'Pending QA Check';
    const approvedBy = pmRecord?.approvedBy?.name ? `${pmRecord.approvedBy.name} (${pmRecord.approvedBy.status})` : 'Pending Management Approval';

    let items = [];
    if (pmRecord && Array.isArray(pmRecord.items) && pmRecord.items.length > 0) {
      items = pmRecord.items;
    } else if (pmRecord && Array.isArray(pmRecord.rows) && pmRecord.rows.length > 0) {
      items = pmRecord.rows;
    } else if (Array.isArray(tool.checkPoints) && tool.checkPoints.length > 0) {
      items = tool.checkPoints.map((cp, idx) => ({
        sno: idx + 1,
        checkPoint: typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || ''),
        method: (typeof cp === 'object' && cp.method) ? cp.method : 'Visual',
        specification: (typeof cp === 'object' && (cp.spec || cp.specification)) ? (cp.spec || cp.specification) : '—',
        actualCondition: '—',
        actionTaken: '—'
      }));
    }

    if (items.length === 0) {
      lines.push(`"${tool.toolNo || ''}","${tool.applicationPartNo || ''}","${(tool.productName || '').replace(/"/g, '""')}","${tool.classification || 'Non-Critical'}","${tool.toolIssuedOn || ''}","${checkDate}","${nextDueDate}","MFG/FR/075","1","No check points recorded","—","—","—","—","${preparedBy}","${checkedBy}","${approvedBy}"`);
    } else {
      items.forEach((item, idx) => {
        lines.push(`"${tool.toolNo || ''}","${tool.applicationPartNo || ''}","${(tool.productName || '').replace(/"/g, '""')}","${tool.classification || 'Non-Critical'}","${tool.toolIssuedOn || ''}","${checkDate}","${nextDueDate}","MFG/FR/075","${item.sno || idx + 1}","${(item.checkPoint || '').replace(/"/g, '""')}","${(item.method || 'Visual').replace(/"/g, '""')}","${(item.specification || '').replace(/"/g, '""')}","${(item.actualCondition || '').replace(/"/g, '""')}","${(item.actionTaken || '').replace(/"/g, '""')}","${preparedBy}","${checkedBy}","${approvedBy}"`);
      });
    }
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `All_Preventive_Maintenance_Checklists_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
