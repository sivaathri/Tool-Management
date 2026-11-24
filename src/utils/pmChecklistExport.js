import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getPMRecords } from '../data/storage';

/**
 * Generates the clean, official HTML layout of ONLY the Preventive Maintenance Check List sheet.
 * Supports compact mode when rendering 2 or 3 PMs per page.
 */
export function generatePMChecklistHTML(tool, pmRecord = null, revisionLabel = '', compactCount = 1) {
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

  // Dynamic styling based on row count and compactCount
  const rowCount = checkItems.length;
  const is3 = compactCount === 3;
  const is2 = compactCount === 2;
  const isCompact = is3 || is2;

  // Dynamically calculate font and padding so ALL rows (1 to 25+) fit perfectly without truncation
  let tableFontSize = '11px';
  let cellPadding = '6px 8px';
  let cellLineHeight = '1.3';
  if (rowCount > 15) {
    tableFontSize = '8px';
    cellPadding = '2px 4px';
    cellLineHeight = '1.1';
  } else if (rowCount > 10) {
    tableFontSize = '9px';
    cellPadding = '3px 6px';
    cellLineHeight = '1.15';
  } else if (rowCount > 6) {
    tableFontSize = '10px';
    cellPadding = '4px 6px';
    cellLineHeight = '1.2';
  } else if (isCompact) {
    tableFontSize = '10px';
    cellPadding = '5px 6px';
  }

  const logoSize = is3 ? '30px' : is2 ? '28px' : '38px';
  const companyTitleSize = is3 ? '11px' : is2 ? '11px' : '13px';
  const sheetTitleSize = is3 ? '12px' : is2 ? '12px' : '14px';
  const metaMinHeight = is3 ? '24px' : is2 ? '24px' : '30px';
  const metaPadding = is3 ? '3px 6px' : is2 ? '3px 6px' : '5px 8px';
  const metaFontSize = is3 ? '9.5px' : is2 ? '9.5px' : '11px';
  const signoffMinHeight = is3 ? '42px' : is2 ? '42px' : '55px';
  const signoffPadding = is3 ? '5px 8px' : is2 ? '5px 8px' : '8px 12px';

  return `
    <div style="border: 1.5px solid #0f172a; border-radius: 4px; overflow: hidden; background-color: #ffffff; width: 100%; box-sizing: border-box; flex: 1; min-height: ${is3 ? '236px' : 'auto'}; display: flex; flex-direction: column; justify-content: space-between;">
      
      <!-- 1. Header Box: Logo & Title -->
      <div style="display: grid; grid-template-columns: ${is3 ? '150px 1fr' : is2 ? '140px 1fr' : '180px 1fr'}; border-bottom: 1.5px solid #0f172a; min-height: ${is3 ? '38px' : is2 ? '38px' : '52px'};">
        <div style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-right: 1.5px solid #0f172a; background-color: #f8fafc;">
          <img src="/inel-logo.png" alt="INEL" style="width: ${logoSize}; height: ${logoSize}; object-fit: contain;" />
          <div style="line-height: 1.15;">
            <div style="font-size: ${companyTitleSize}; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">INEL II</div>
            <div style="font-size: ${is3 ? '8.5px' : is2 ? '9px' : '10.5px'}; font-weight: 700; color: #475569; letter-spacing: 0.5px;">PUDUCHERRY</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px 10px; text-align: center; background-color: #ffffff;">
          <div style="font-size: ${sheetTitleSize}; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase; color: #0f172a; line-height: 1.2;">
            PREVENTIVE MAINTENANCE CHECK LIST FOR ${isCritical ? 'CRITICAL' : 'NON CRITICAL'} TOOLS
          </div>
          ${revisionLabel ? `
            <div style="font-size: ${is3 ? '9.5px' : is2 ? '9.5px' : '11px'}; font-weight: 800; color: #1e40af; margin-top: 1px; letter-spacing: 0.5px;">
              ● ${revisionLabel}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 2. Metadata Grid (3 Rows) -->
      <div style="border-bottom: 1.5px solid #0f172a; font-size: ${metaFontSize};">
        
        <!-- Row 1: Tool No | Date of check | Ref No -->
        <div style="display: grid; grid-template-columns: ${isCompact ? '105px 1fr 95px 110px 70px 105px' : '130px 1fr 120px 140px 80px 130px'}; border-bottom: 1px solid #0f172a; min-height: ${metaMinHeight}; align-items: center;">
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Tool No</div>
          <div style="padding: ${metaPadding}; font-family: monospace; font-weight: 800; color: #1e40af; font-size: ${is3 ? '11.5px' : is2 ? '11.5px' : '13.5px'}; border-right: 1px solid #0f172a;">${tool.toolNo || ''}</div>
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Date of check:</div>
          <div style="padding: ${metaPadding}; font-weight: 700; border-right: 1px solid #0f172a; color: #0f172a;">${checkDate}</div>
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Ref No.:</div>
          <div style="padding: ${metaPadding}; font-family: monospace; font-weight: 700; color: #0f172a;">${refNo}</div>
        </div>

        <!-- Row 2: Tool description | Next due Date -->
        <div style="display: grid; grid-template-columns: ${isCompact ? '105px 1fr 95px 260px' : '130px 1fr 120px 350px'}; border-bottom: 1px solid #0f172a; min-height: ${metaMinHeight}; align-items: center;">
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Tool description</div>
          <div style="padding: ${metaPadding}; font-weight: 700; text-transform: uppercase; color: #0f172a; border-right: 1px solid #0f172a;">${tool.description || 'Precision Manufacturing Tool'}</div>
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Next due Date:</div>
          <div style="padding: ${metaPadding}; font-weight: 700; color: #0f172a;">${nextDueDate}</div>
        </div>

        <!-- Row 3: Application | Tool Issued On -->
        <div style="display: grid; grid-template-columns: ${isCompact ? '105px 1fr 95px 260px' : '130px 1fr 120px 350px'}; min-height: ${metaMinHeight}; align-items: center;">
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Application</div>
          <div style="padding: ${metaPadding}; font-weight: 600; color: #0f172a; border-right: 1px solid #0f172a;">${appPartText}</div>
          <div style="padding: ${metaPadding}; font-weight: 700; background-color: #f8fafc; border-right: 1px solid #0f172a; color: #1e293b;">Tool Issued On:</div>
          <div style="padding: ${metaPadding}; font-family: monospace; font-weight: 700; color: #0f172a;">${tool.toolIssuedOn || '—'}</div>
        </div>
      </div>

      <!-- 3. Checklist Items Table -->
      <div style="flex: 1; display: flex; flex-direction: column; overflow: visible;">
        <table style="width: 100%; border-collapse: collapse; font-size: ${tableFontSize}; table-layout: fixed;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #0f172a; font-weight: 800; text-transform: uppercase;">
              <th style="width: 5%; text-align: center; padding: ${cellPadding}; border-right: 1px solid #0f172a;">S.no</th>
              <th style="width: 26%; text-align: left; padding: ${cellPadding}; border-right: 1px solid #0f172a;">Check points</th>
              <th style="width: 14%; text-align: center; padding: ${cellPadding}; border-right: 1px solid #0f172a;">Checking Method</th>
              <th style="width: 18%; text-align: left; padding: ${cellPadding}; border-right: 1px solid #0f172a;">Specification</th>
              <th style="width: 20%; text-align: left; padding: ${cellPadding}; border-right: 1px solid #0f172a; background-color: #eff6ff;">Actual condition *</th>
              <th style="width: 17%; text-align: left; padding: ${cellPadding};">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${checkItems.map((item, idx) => `
              <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="text-align: center; font-weight: 700; padding: ${cellPadding}; border-right: 1px solid #cbd5e1;">${item.sno || idx + 1}</td>
                <td style="padding: ${cellPadding}; font-weight: 800; color: #0f172a; border-right: 1px solid #cbd5e1; line-height: ${cellLineHeight};">${item.checkPoint || ''}</td>
                <td style="text-align: center; padding: ${cellPadding}; font-weight: 700; color: #334155; border-right: 1px solid #cbd5e1;">${item.method || 'Visual'}</td>
                <td style="padding: ${cellPadding}; color: #1e293b; border-right: 1px solid #cbd5e1; line-height: ${cellLineHeight};">${item.specification || '—'}</td>
                <td style="padding: ${cellPadding}; font-weight: 700; color: #1e3a8a; border-right: 1px solid #cbd5e1; background-color: #eff6ff;">${item.actualCondition || 'OK / Verified'}</td>
                <td style="padding: ${cellPadding}; color: #1e293b;">${item.actionTaken || 'None required'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 4. Sign-Off Authorization Footer (3 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1.5px solid #0f172a; background-color: #ffffff; text-align: center;">
        <div style="padding: ${signoffPadding}; border-right: 1px solid #0f172a; min-height: ${signoffMinHeight}; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: ${is3 ? '9.5px' : is2 ? '9.5px' : '11px'}; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 2px;">Prepared By</div>
          <div style="font-weight: 800; font-size: ${is3 ? '11px' : is2 ? '11px' : '13px'}; color: #0284c7;">✓ ${preparedByName}</div>
          <div style="font-size: ${is3 ? '8.5px' : is2 ? '8.5px' : '10px'}; color: #64748b; margin-top: 1px;">Checked: ${checkDate}</div>
        </div>
        <div style="padding: ${signoffPadding}; border-right: 1px solid #0f172a; min-height: ${signoffMinHeight}; display: flex; flex-direction: column; justify-content: center; background-color: ${isChecked ? '#f0fdf4' : '#fafafa'};">
          <div style="font-size: ${is3 ? '9.5px' : is2 ? '9.5px' : '11px'}; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 2px;">Checked By</div>
          ${isChecked ? `
            <div style="font-weight: 800; font-size: ${is3 ? '11px' : is2 ? '11px' : '13px'}; color: #16a34a;">✓ ${checkedByName}</div>
            <div style="font-size: ${is3 ? '8.5px' : is2 ? '8.5px' : '10px'}; color: #64748b; margin-top: 1px;">Verified &bull; ${checkedByDate}</div>
          ` : `
            <div style="font-size: ${is3 ? '10px' : is2 ? '10px' : '12px'}; font-style: italic; color: #94a3b8;">Pending QA Check</div>
          `}
        </div>
        <div style="padding: ${signoffPadding}; min-height: ${signoffMinHeight}; display: flex; flex-direction: column; justify-content: center; background-color: ${isApproved ? '#eff6ff' : '#fafafa'};">
          <div style="font-size: ${is3 ? '9.5px' : is2 ? '9.5px' : '11px'}; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 2px;">Approved By</div>
          ${isApproved ? `
            <div style="font-weight: 800; font-size: ${is3 ? '11px' : is2 ? '11px' : '13px'}; color: #2563eb;">✓ ${approvedByName}</div>
            <div style="font-size: ${is3 ? '8.5px' : is2 ? '8.5px' : '10px'}; color: #64748b; margin-top: 1px;">Approved &bull; ${approvedByDate}</div>
          ` : `
            <div style="font-size: ${is3 ? '10px' : is2 ? '10px' : '12px'}; font-style: italic; color: #94a3b8;">Pending Management Approval</div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates the photos section HTML for a PM inspection to place in the bottom half of the page.
 */
function generatePMPhotosHTML(photos = []) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return `
      <div style="border: 1.5px dashed #cbd5e1; border-radius: 4px; padding: 10px; background-color: #f8fafc; text-align: center; color: #94a3b8; font-size: 10px; display: flex; align-items: center; justify-content: center; height: 100%; box-sizing: border-box;">
        <span>No Inspection Photos Attached For This PM Check</span>
      </div>
    `;
  }

  // Display up to 4 photos side by side in the bottom half
  const displayPhotos = photos.slice(0, 4);
  return `
    <div style="border: 1.5px solid #0f172a; border-radius: 4px; padding: 6px 10px; background-color: #ffffff; box-sizing: border-box; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
      <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
        <span>📷 Preventive Maintenance Inspection Photos (${photos.length} Captured)</span>
        <span style="font-size: 9px; color: #64748b; font-weight: 600;">Standard Evidence Verification</span>
      </div>
      <div style="display: flex; gap: 10px; flex: 1; min-height: 0; align-items: stretch; justify-content: ${displayPhotos.length === 1 ? 'center' : 'space-between'}; overflow: hidden;">
        ${displayPhotos.map((p, pIdx) => `
          <div style="border: 1.5px solid #cbd5e1; border-radius: 5px; overflow: hidden; background-color: #ffffff; height: 100%; display: flex; flex-direction: column; ${displayPhotos.length === 1 ? 'width: 440px; max-width: 60%;' : 'flex: 1; min-width: 0;'} box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: #f8fafc; padding: 4px;">
              <img src="${p.dataUrl}" alt="PM Evidence ${pIdx + 1}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 3px;" />
            </div>
            <div style="padding: 3px 6px; font-size: 9.5px; font-weight: 700; color: #0f172a; background-color: #f1f5f9; border-top: 1px solid #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;">
              ${p.checkpointName || `Photo #${pIdx + 1}`}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Exports ONLY the Preventive Maintenance Check List for the current active inspection of this tool.
 * Page 1 contains: Top half = PM Checklist, Bottom half = Photos of this PM.
 */
export async function exportSinglePMChecklistPDF(tool, pmRecord = null) {
  if (!tool) return;

  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfWidth = 297;
  const pdfHeight = 210;
  const margin = 6;
  const contentWidth = pdfWidth - (margin * 2);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1120px';
  container.style.height = '780px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '6px 10px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.gap = '8px';

  const photos = Array.isArray(pmRecord?.photos) ? pmRecord.photos : [];
  const hasPhotos = photos.length > 0;

  container.innerHTML = `
    <!-- Top Half: PM Checklist Sheet -->
    <div style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
      ${generatePMChecklistHTML(tool, pmRecord, 'Current Active Inspection', 2)}
    </div>

    <!-- Bottom Half: PM Inspection Photos -->
    ${hasPhotos ? `
      <div style="flex: 0 0 185px; height: 185px; display: flex; flex-direction: column; overflow: hidden;">
        ${generatePMPhotosHTML(photos)}
      </div>
    ` : ''}
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
    const targetFullPageHeight = pdfHeight - (margin * 2);
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, targetFullPageHeight);

    const cleanToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
    const filename = `PM_Checklist_${cleanToolNo}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Exports ALL PM records of THIS TOOL:
 * Each Page contains: Top Half = That PM Inspection, Bottom Half = That PM's Photos!
 * Example: 2 PMs = Total 2 Pages (Page 1 = 1st PM + 1st PM Photos, Page 2 = 2nd PM + 2nd PM Photos).
 */
export async function exportToolAllPMHistoryPDF(tool, pmRecord = null, onProgress = null) {
  if (!tool) return;

  const allRecords = getPMRecords();
  const cleanToolNo = (tool.toolNo || '').toLowerCase().trim();
  const saved = allRecords.find(r => 
    (tool.id && r.toolId === tool.id) ||
    (r.toolNo && r.toolNo.toLowerCase().trim() === cleanToolNo)
  );

  const history = Array.isArray(pmRecord?.history) && pmRecord.history.length > 0
    ? pmRecord.history
    : (Array.isArray(saved?.history) ? saved.history : []);

  const allInspections = [];

  // 1. Add all past revisions in chronological order
  history.forEach((h, idx) => {
    allInspections.push({
      ...h,
      refNo: pmRecord?.refNo || 'MFG/FR/075',
      toolDescription: tool.description,
      application: tool.applicationPartNo ? `${tool.applicationPartNo}${tool.productName ? ' - ' + tool.productName : ''}` : (tool.productName || ''),
      classification: tool.classification,
      revisionLabel: `Historical Inspection: Revision ${h.revisionNumber || (idx + 1)} (${h.checkDate || ''})`,
      photos: Array.isArray(h.photos) ? h.photos : []
    });
  });

  // 2. Add current active inspection
  allInspections.push({
    ...pmRecord,
    refNo: pmRecord?.refNo || 'MFG/FR/075',
    toolDescription: tool.description,
    application: tool.applicationPartNo ? `${tool.applicationPartNo}${tool.productName ? ' - ' + tool.productName : ''}` : (tool.productName || ''),
    classification: tool.classification,
    items: pmRecord?.items || pmRecord?.rows || [],
    photos: Array.isArray(pmRecord?.photos) ? pmRecord.photos : (Array.isArray(saved?.photos) ? saved.photos : []),
    revisionLabel: history.length > 0 
      ? `Current Active Inspection: Revision ${history.length + 1} (${pmRecord?.checkDate || ''})`
      : `Current Active Inspection (${pmRecord?.checkDate || ''})`
  });

  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfWidth = 297;
  const pdfHeight = 210;
  const margin = 6;
  const contentWidth = pdfWidth - (margin * 2);
  const targetFullPageHeight = pdfHeight - (margin * 2);

  for (let pIdx = 0; pIdx < allInspections.length; pIdx++) {
    const insp = allInspections[pIdx];
    const inspPhotos = Array.isArray(insp.photos) ? insp.photos : [];
    const hasPhotos = inspPhotos.length > 0;

    onProgress?.(`Generating Page ${pIdx + 1} of ${allInspections.length} (${insp.revisionLabel})...`, pIdx + 1, allInspections.length);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1120px';
    container.style.height = '780px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.padding = '6px 10px';
    container.style.boxSizing = 'border-box';
    container.style.zIndex = '-9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'space-between';
    container.style.gap = '8px';

    container.innerHTML = `
      <!-- Top Half: PM Checklist -->
      <div style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
        ${generatePMChecklistHTML(tool, insp, insp.revisionLabel, 2)}
      </div>

      <!-- Bottom Half: This PM's Photos -->
      ${hasPhotos ? `
        <div style="flex: 0 0 185px; height: 185px; display: flex; flex-direction: column; overflow: hidden;">
          ${generatePMPhotosHTML(inspPhotos)}
        </div>
      ` : ''}
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

      if (pIdx > 0) {
        pdf.addPage('a4', 'l');
      }

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, targetFullPageHeight);
    } finally {
      document.body.removeChild(container);
    }
  }

  const safeToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
  const filename = `All_PM_History_${safeToolNo}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}

/**
 * Exports ONLY the Preventive Maintenance Check List for the current active inspection to CSV format.
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
  lines.push('"S.No","Check points","Checking Method","Specification","Actual condition","Remarks"');

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
 * Exports ALL PM records of THIS TOOL (all past revision snapshots + current active PM) to CSV format.
 */
export function exportToolAllPMHistoryCSV(tool, pmRecord = null) {
  if (!tool) return;

  const allRecords = getPMRecords();
  const cleanToolNo = (tool.toolNo || '').toLowerCase().trim();
  const saved = allRecords.find(r => 
    (tool.id && r.toolId === tool.id) ||
    (r.toolNo && r.toolNo.toLowerCase().trim() === cleanToolNo)
  );

  const history = Array.isArray(pmRecord?.history) && pmRecord.history.length > 0
    ? pmRecord.history
    : (Array.isArray(saved?.history) ? saved.history : []);

  const allInspections = [];

  // Add historical revisions
  history.forEach((h, idx) => {
    allInspections.push({
      ...h,
      revisionLabel: `Revision ${h.revisionNumber || (idx + 1)}`,
      checkDate: h.checkDate || '',
      nextDueDate: h.nextDueDate || '',
      preparedBy: h.preparedBy || 'Maintenance Technician',
      checkedBy: h.checkedBy?.name ? `${h.checkedBy.name} (${h.checkedBy.status})` : 'Pending QA Check',
      approvedBy: h.approvedBy?.name ? `${h.approvedBy.name} (${h.approvedBy.status})` : 'Pending Management Approval',
      items: h.items || []
    });
  });

  // Add current active inspection
  allInspections.push({
    ...pmRecord,
    revisionLabel: history.length > 0 ? `Current Active (Rev ${history.length + 1})` : 'Current Active PM',
    checkDate: pmRecord?.checkDate || '',
    nextDueDate: pmRecord?.nextDueDate || '',
    preparedBy: pmRecord?.preparedBy || 'Maintenance Technician',
    checkedBy: pmRecord?.checkedBy?.name ? `${pmRecord.checkedBy.name} (${pmRecord.checkedBy.status})` : 'Pending QA Check',
    approvedBy: pmRecord?.approvedBy?.name ? `${pmRecord.approvedBy.name} (${pmRecord.approvedBy.status})` : 'Pending Management Approval',
    items: pmRecord?.items || pmRecord?.rows || []
  });

  const lines = [];
  lines.push(`"INEL II PUDUCHERRY - ALL PREVENTIVE MAINTENANCE INSPECTIONS FOR ${tool.toolNo}"`);
  lines.push(`"Generated On","${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}"`);
  lines.push(`"Document Reference","MFG/FR/075"`);
  lines.push(`"Tool Number","${tool.toolNo}","Application","${tool.applicationPartNo || ''} - ${tool.productName || ''}","Description","${tool.description || ''}"`);
  lines.push('');
  lines.push('"Inspection / Revision","Date of Check","Next Due Date","Ref No","S.No","Check Points","Checking Method","Specification","Actual Condition","Remarks","Prepared By","Checked By (QA)","Approved By (Management)"');

  allInspections.forEach(insp => {
    const items = insp.items && insp.items.length > 0 ? insp.items : [];
    if (items.length === 0) {
      lines.push(`"${insp.revisionLabel}","${insp.checkDate}","${insp.nextDueDate}","MFG/FR/075","1","No check points recorded","—","—","—","—","${insp.preparedBy}","${insp.checkedBy}","${insp.approvedBy}"`);
    } else {
      items.forEach((item, idx) => {
        lines.push(`"${insp.revisionLabel}","${insp.checkDate}","${insp.nextDueDate}","MFG/FR/075","${item.sno || idx + 1}","${(item.checkPoint || '').replace(/"/g, '""')}","${(item.method || 'Visual').replace(/"/g, '""')}","${(item.specification || '').replace(/"/g, '""')}","${(item.actualCondition || '').replace(/"/g, '""')}","${(item.actionTaken || '').replace(/"/g, '""')}","${insp.preparedBy}","${insp.checkedBy}","${insp.approvedBy}"`);
      });
    }
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeToolNo = (tool.toolNo || 'TOOL').replace(/\s+/g, '_');
  a.download = `All_PM_History_${safeToolNo}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
