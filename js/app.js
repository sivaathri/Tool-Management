/**
 * Tool Management System - Enterprise Application Controller
 * Handles UI views, calculations, event listeners, charts, modals, and exports
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global application state
  const State = {
    currentView: 'dashboard',
    selectedToolNumber: 'TOOL-001',
    editingToolNumber: null,
    alertFilter: 'all',
    confirmCallback: null
  };

  // DOM Elements
  const DOM = {
    // Navigation
    sidebar: document.getElementById('appSidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    sidebarToolCount: document.getElementById('sidebarToolCount'),
    sidebarAlertCount: document.getElementById('sidebarAlertCount'),
    headerNotificationDot: document.getElementById('headerNotificationDot'),
    btnResetData: document.getElementById('btnResetData'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    globalSearchResults: document.getElementById('globalSearchResults'),
    headerNotificationsBtn: document.getElementById('headerNotificationsBtn'),
    btnQuickAddTool: document.getElementById('btnQuickAddTool'),

    // Dashboard
    btnRefreshDashboard: document.getElementById('btnRefreshDashboard'),
    kpiTotalMachines: document.getElementById('kpiTotalMachines'),
    kpiTotalTools: document.getElementById('kpiTotalTools'),
    kpiHealthyTools: document.getElementById('kpiHealthyTools'),
    kpiNearLimit: document.getElementById('kpiNearLimit'),
    kpiReplacementDue: document.getElementById('kpiReplacementDue'),
    statusDonutChartContainer: document.getElementById('statusDonutChartContainer'),
    statusDonutLegend: document.getElementById('statusDonutLegend'),
    monthlyProductionChartContainer: document.getElementById('monthlyProductionChartContainer'),
    dashboardAttentionTableBody: document.getElementById('dashboardAttentionTableBody'),
    dashboardRecentActivityBody: document.getElementById('dashboardRecentActivityBody'),
    btnGoToAlerts: document.getElementById('btnGoToAlerts'),

    // Tool Master
    btnOpenNewToolModal: document.getElementById('btnOpenNewToolModal'),
    btnExportToolMasterCSV: document.getElementById('btnExportToolMasterCSV'),
    tmSearchInput: document.getElementById('tmSearchInput'),
    tmApplicationFilter: document.getElementById('tmApplicationFilter'),
    tmTypeFilter: document.getElementById('tmTypeFilter'),
    tmStatusFilter: document.getElementById('tmStatusFilter'),
    btnResetToolFilters: document.getElementById('btnResetToolFilters'),
    toolMasterTableBody: document.getElementById('toolMasterTableBody'),

    // Tool Service History
    btnPrintServiceCard: document.getElementById('btnPrintServiceCard'),
    serviceSearchInput: document.getElementById('serviceSearchInput'),
    btnSearchServiceTool: document.getElementById('btnSearchServiceTool'),
    shToolNumber: document.getElementById('shToolNumber'),
    shToolDescription: document.getElementById('shToolDescription'),
    shToolTypeBadge: document.getElementById('shToolTypeBadge'),
    shToolStatusBadge: document.getElementById('shToolStatusBadge'),
    shMachineVal: document.getElementById('shMachineVal'),
    shOperationVal: document.getElementById('shOperationVal'),
    shApplicationVal: document.getElementById('shApplicationVal'),
    shRepLimitVal: document.getElementById('shRepLimitVal'),
    shCumulativeVal: document.getElementById('shCumulativeVal'),
    shBalanceVal: document.getElementById('shBalanceVal'),
    shUtilizationPct: document.getElementById('shUtilizationPct'),
    shProgressBarFill: document.getElementById('shProgressBarFill'),
    btnViewMasterFromService: document.getElementById('btnViewMasterFromService'),
    btnAddServiceRecordBtn: document.getElementById('btnAddServiceRecordBtn'),
    btnAddProductionRecordBtn: document.getElementById('btnAddProductionRecordBtn'),
    btnQuickAddServiceFromHeader: document.getElementById('btnQuickAddServiceFromHeader'),
    btnQuickAddProdFromHeader: document.getElementById('btnQuickAddProdFromHeader'),
    toolServiceRecordsBody: document.getElementById('toolServiceRecordsBody'),
    toolProductionRecordsBody: document.getElementById('toolProductionRecordsBody'),

    // Production Tracking View
    btnOpenGlobalProdModal: document.getElementById('btnOpenGlobalProdModal'),
    btnExportProductionCSV: document.getElementById('btnExportProductionCSV'),
    allProductionOverviewBody: document.getElementById('allProductionOverviewBody'),

    // Replacement Alerts View
    btnExportAlertsCSV: document.getElementById('btnExportAlertsCSV'),
    filterAlertsAll: document.getElementById('filterAlertsAll'),
    filterAlertsDue: document.getElementById('filterAlertsDue'),
    filterAlertsNear: document.getElementById('filterAlertsNear'),
    alertTotalBadge: document.getElementById('alertTotalBadge'),
    alertDueBadge: document.getElementById('alertDueBadge'),
    alertNearBadge: document.getElementById('alertNearBadge'),
    replacementAlertsTableBody: document.getElementById('replacementAlertsTableBody'),

    // Modals
    modalAddTool: document.getElementById('modalAddTool'),
    formToolMaster: document.getElementById('formToolMaster'),
    modalToolTitle: document.getElementById('modalToolTitle'),
    inpToolNumber: document.getElementById('inpToolNumber'),
    inpToolDescription: document.getElementById('inpToolDescription'),
    inpToolType: document.getElementById('inpToolType'),
    inpMachineSelect: document.getElementById('inpMachineSelect'),
    inpMachineName: document.getElementById('inpMachineName'),
    inpOperation: document.getElementById('inpOperation'),
    inpApplication: document.getElementById('inpApplication'),
    inpIssuedDate: document.getElementById('inpIssuedDate'),
    inpReplacementFrequency: document.getElementById('inpReplacementFrequency'),
    inpAmrQuantity: document.getElementById('inpAmrQuantity'),
    inpPreparedBy: document.getElementById('inpPreparedBy'),
    inpCheckedBy: document.getElementById('inpCheckedBy'),
    inpApprovedBy: document.getElementById('inpApprovedBy'),
    inpRemarks: document.getElementById('inpRemarks'),
    appFormTableBody: document.getElementById('appFormTableBody'),
    btnAddAppRow: document.getElementById('btnAddAppRow'),
    sparesFormTableBody: document.getElementById('sparesFormTableBody'),
    btnAddSpareRow: document.getElementById('btnAddSpareRow'),

    modalAddService: document.getElementById('modalAddService'),
    formAddService: document.getElementById('formAddService'),
    srvToolSelect: document.getElementById('srvToolSelect'),
    srvDate: document.getElementById('srvDate'),
    srvPerformedBy: document.getElementById('srvPerformedBy'),
    srvDescription: document.getElementById('srvDescription'),
    srvApproval: document.getElementById('srvApproval'),
    srvApprovalDate: document.getElementById('srvApprovalDate'),
    srvRemarks: document.getElementById('srvRemarks'),

    modalAddProduction: document.getElementById('modalAddProduction'),
    formAddProduction: document.getElementById('formAddProduction'),
    prdToolSelect: document.getElementById('prdToolSelect'),
    prdMonth: document.getElementById('prdMonth'),
    prdQuantity: document.getElementById('prdQuantity'),
    prdLiveCalcPreview: document.getElementById('prdLiveCalcPreview'),
    prevProjCumulative: document.getElementById('prevProjCumulative'),
    prevProjBalance: document.getElementById('prevProjBalance'),
    prevProjStatus: document.getElementById('prevProjStatus'),

    modalToolDossier: document.getElementById('modalToolDossier'),
    dossierToolTitle: document.getElementById('dossierToolTitle'),
    dossierToolSubtitle: document.getElementById('dossierToolSubtitle'),
    dossierModalBody: document.getElementById('dossierModalBody'),
    btnDossierPrint: document.getElementById('btnDossierPrint'),

    modalReportPreview: document.getElementById('modalReportPreview'),
    reportPreviewTitle: document.getElementById('reportPreviewTitle'),
    reportPreviewSubtitle: document.getElementById('reportPreviewSubtitle'),
    reportPreviewTableWrap: document.getElementById('reportPreviewTableWrap'),
    btnReportPrint: document.getElementById('btnReportPrint'),
    btnReportCsvDownload: document.getElementById('btnReportCsvDownload'),

    modalConfirm: document.getElementById('modalConfirm'),
    confirmDialogTitle: document.getElementById('confirmDialogTitle'),
    confirmDialogMessage: document.getElementById('confirmDialogMessage'),
    confirmDialogConfirmBtn: document.getElementById('confirmDialogConfirmBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  // Helper: Number formatting with commas
  function formatNum(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US');
  }

  // Helper: Toast Notifications
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
    if (type === 'danger') {
      icon = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    } else if (type === 'info') {
      icon = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
    }

    toast.innerHTML = `
      ${icon}
      <div class="toast-message">${message}</div>
    `;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Helper: Modal Controller
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Attach modal close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      const target = document.getElementById(modalId);
      closeModal(target);
    });
  });

  // Close modals when clicking on dark backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  // Confirmation dialog helper
  function requestConfirmation(title, message, onConfirm) {
    DOM.confirmDialogTitle.textContent = title;
    DOM.confirmDialogMessage.textContent = message;
    State.confirmCallback = onConfirm;
    openModal(DOM.modalConfirm);
  }

  DOM.confirmDialogConfirmBtn.addEventListener('click', () => {
    if (typeof State.confirmCallback === 'function') {
      State.confirmCallback();
      State.confirmCallback = null;
    }
    closeModal(DOM.modalConfirm);
  });

  // =========================================================================
  // VIEW ROUTING & NAVIGATION
  // =========================================================================
  function switchView(viewName) {
    State.currentView = viewName;
    DOM.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    DOM.viewSections.forEach(section => {
      if (section.id === `view-${viewName}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    DOM.sidebar.classList.remove('open');

    // Render corresponding view data
    renderActiveView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  DOM.navItems.forEach(nav => {
    nav.addEventListener('click', (e) => {
      e.preventDefault();
      const view = nav.getAttribute('data-view');
      switchView(view);
    });
  });

  DOM.sidebarToggle.addEventListener('click', () => {
    DOM.sidebar.classList.toggle('open');
  });

  DOM.headerNotificationsBtn.addEventListener('click', () => {
    switchView('replacement-alerts');
  });

  DOM.btnGoToAlerts.addEventListener('click', () => {
    switchView('replacement-alerts');
  });

  function renderActiveView(viewName) {
    updateBadgesAndCounters();
    switch (viewName) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'tool-master':
        renderToolMaster();
        break;
      case 'service-history':
        renderServiceHistory(State.selectedToolNumber);
        break;
      case 'production-tracking':
        renderProductionTrackingView();
        break;
      case 'replacement-alerts':
        renderReplacementAlerts(State.alertFilter);
        break;
      case 'reports':
        // Static cards, preview triggers attached
        break;
    }
  }

  // Update Global Counter Badges
  function updateBadgesAndCounters() {
    const metrics = TMS.getDashboardMetrics();
    DOM.sidebarToolCount.textContent = metrics.totalTools;
    const alertCount = metrics.toolsRequiringAttention.length;
    DOM.sidebarAlertCount.textContent = alertCount;
    DOM.sidebarAlertCount.style.display = alertCount > 0 ? 'inline-block' : 'none';
    DOM.headerNotificationDot.style.display = alertCount > 0 ? 'block' : 'none';
  }

  // =========================================================================
  // GLOBAL SEARCH AUTOCOMPLETE
  // =========================================================================
  DOM.globalSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      DOM.globalSearchResults.classList.remove('show');
      DOM.globalSearchResults.innerHTML = '';
      return;
    }

    const tools = TMS.getTools().filter(t => 
      t.toolNumber.toLowerCase().includes(query) ||
      t.toolDescription.toLowerCase().includes(query) ||
      t.machineNumber.toLowerCase().includes(query) ||
      t.operation.toLowerCase().includes(query)
    );

    if (tools.length === 0) {
      DOM.globalSearchResults.innerHTML = `<div style="padding: 12px; color: var(--slate-500); font-size: 12.5px;">No matching tools found</div>`;
      DOM.globalSearchResults.classList.add('show');
      return;
    }

    DOM.globalSearchResults.innerHTML = tools.slice(0, 6).map(tool => `
      <div class="search-result-item" data-tool="${tool.toolNumber}">
        <div>
          <div style="font-weight: 600; color: var(--slate-900); font-size: 13px;">${tool.toolNumber} - ${tool.toolDescription}</div>
          <div style="font-size: 11.5px; color: var(--slate-500);">${tool.machineNumber} (${tool.operation})</div>
        </div>
        <span class="badge ${tool.statusClass}">${tool.status}</span>
      </div>
    `).join('');

    DOM.globalSearchResults.classList.add('show');
  });

  DOM.globalSearchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item) return;
    const toolNum = item.getAttribute('data-tool');
    DOM.globalSearchInput.value = '';
    DOM.globalSearchResults.classList.remove('show');
    selectAndInspectTool(toolNum);
  });

  document.addEventListener('click', (e) => {
    if (!DOM.globalSearchInput.contains(e.target) && !DOM.globalSearchResults.contains(e.target)) {
      DOM.globalSearchResults.classList.remove('show');
    }
  });

  function selectAndInspectTool(toolNumber) {
    State.selectedToolNumber = toolNumber;
    switchView('service-history');
    showToast(`Loaded digital service history for ${toolNumber}`, 'info');
  }

  // =========================================================================
  // VIEW 1: DASHBOARD LOGIC & RENDERING
  // =========================================================================
  function renderDashboard() {
    const metrics = TMS.getDashboardMetrics();

    // Update KPI numbers
    DOM.kpiTotalMachines.textContent = metrics.totalMachines;
    DOM.kpiTotalTools.textContent = metrics.totalTools;
    DOM.kpiHealthyTools.textContent = metrics.healthyCount;
    DOM.kpiNearLimit.textContent = metrics.nearLimitCount;
    DOM.kpiReplacementDue.textContent = metrics.replacementDueCount;

    // Render Donut Chart for Tool Replacement Status
    renderStatusDonutChart(metrics);

    // Render Monthly Production Volume Chart
    renderMonthlyProductionChart();

    // Render Tools Requiring Attention
    const attentionTools = metrics.toolsRequiringAttention;
    if (attentionTools.length === 0) {
      DOM.dashboardAttentionTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 24px; color: var(--slate-500);">
            All tools operating within healthy thresholds (&lt; 80% replacement frequency).
          </td>
        </tr>
      `;
    } else {
      DOM.dashboardAttentionTableBody.innerHTML = attentionTools.map(t => `
        <tr class="${t.status === 'Replacement Due' ? 'row-danger' : 'row-warning'}">
          <td><a href="#" class="tool-code" data-inspect-tool="${t.toolNumber}">${t.toolNumber}</a></td>
          <td style="font-weight: 500;">${t.toolDescription}</td>
          <td><span class="machine-code">${t.machineNumber}</span></td>
          <td>${t.operation || '-'}</td>
          <td class="col-numeric">${formatNum(t.replacementFrequency)} pcs</td>
          <td class="col-numeric" style="font-weight: 600;">${formatNum(t.cumulativeQuantity)}</td>
          <td class="col-numeric" style="font-weight: 700; color: ${t.balance === 0 ? '#dc2626' : '#d97706'};">${formatNum(t.balance)}</td>
          <td style="min-width: 130px;">
            <div style="font-size: 11.5px; font-weight: 600; margin-bottom: 2px;">${t.utilizationPct}%</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill ${t.status === 'Replacement Due' ? 'progress-danger' : 'progress-warning'}" style="width: ${Math.min(t.utilizationPct, 100)}%;"></div>
            </div>
          </td>
          <td><span class="badge ${t.statusClass}"><span class="badge-dot"></span>${t.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" data-inspect-tool="${t.toolNumber}">Inspect</button>
          </td>
        </tr>
      `).join('');
    }

    // Render Recent Tool Service Activity Table
    const recentServices = metrics.recentServices;
    if (recentServices.length === 0) {
      DOM.dashboardRecentActivityBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 24px; color: var(--slate-500);">No recent service records found.</td>
        </tr>
      `;
    } else {
      DOM.dashboardRecentActivityBody.innerHTML = recentServices.map(s => {
        const tool = TMS.getTool(s.toolNumber);
        const machine = tool ? tool.machineNumber : '-';
        const op = tool ? tool.operation : '-';
        const desc = tool ? tool.toolDescription : '-';
        const cumulative = tool ? tool.cumulativeQuantity : 0;
        const statusClass = tool ? tool.statusClass : 'badge-neutral';
        const status = tool ? tool.status : 'Healthy';

        return `
          <tr>
            <td style="font-weight: 600; color: var(--slate-700);">${s.date}</td>
            <td><a href="#" class="tool-code" data-inspect-tool="${s.toolNumber}">${s.toolNumber}</a></td>
            <td>${desc}</td>
            <td><span class="machine-code">${machine}</span></td>
            <td>${op}</td>
            <td style="font-weight: 500; color: var(--slate-900);">${s.description}</td>
            <td class="col-numeric">${formatNum(cumulative)} pcs</td>
            <td><span class="badge ${statusClass}"><span class="badge-dot"></span>${status}</span></td>
          </tr>
        `;
      }).join('');
    }

    // Delegate inspect clicks
    document.querySelectorAll('[data-inspect-tool]').forEach(el => {
      el.onclick = (e) => {
        e.preventDefault();
        const toolNum = el.getAttribute('data-inspect-tool');
        selectAndInspectTool(toolNum);
      };
    });
  }

  DOM.btnRefreshDashboard.addEventListener('click', () => {
    renderDashboard();
    showToast('Dashboard metrics refreshed', 'info');
  });

  // SVG Donut Chart Renderer
  function renderStatusDonutChart(metrics) {
    const total = metrics.totalTools || 1;
    const healthy = metrics.healthyCount;
    const near = metrics.nearLimitCount;
    const due = metrics.replacementDueCount;

    // Circumference = 2 * PI * r = 2 * 3.14159 * 70 = 439.82
    const circumference = 439.82;
    const pctHealthy = (healthy / total);
    const pctNear = (near / total);
    const pctDue = (due / total);

    const lenHealthy = pctHealthy * circumference;
    const lenNear = pctNear * circumference;
    const lenDue = pctDue * circumference;

    const offsetHealthy = 0;
    const offsetNear = -lenHealthy;
    const offsetDue = -(lenHealthy + lenNear);

    DOM.statusDonutChartContainer.innerHTML = `
      <svg width="220" height="220" viewBox="0 0 200 200" style="transform: rotate(-90deg);">
        <!-- Background Track -->
        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f1f5f9" stroke-width="26" />
        <!-- Healthy Segment -->
        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" stroke-width="26"
          stroke-dasharray="${lenHealthy} ${circumference}" stroke-dashoffset="${offsetHealthy}" />
        <!-- Near Limit Segment -->
        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f59e0b" stroke-width="26"
          stroke-dasharray="${lenNear} ${circumference}" stroke-dashoffset="${offsetNear}" />
        <!-- Replacement Due Segment -->
        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#ef4444" stroke-width="26"
          stroke-dasharray="${lenDue} ${circumference}" stroke-dashoffset="${offsetDue}" />
      </svg>
      <div style="position: absolute; text-align: center; pointer-events: none;">
        <div style="font-size: 26px; font-weight: 700; color: var(--slate-900); line-height: 1;">${total}</div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--slate-500); font-weight: 600; margin-top: 2px;">Total Tools</div>
      </div>
    `;

    DOM.statusDonutLegend.innerHTML = `
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #10b981;"></span>
        <span>Healthy: <strong>${healthy}</strong> (${((healthy/total)*100).toFixed(0)}%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #f59e0b;"></span>
        <span>Near Limit: <strong>${near}</strong> (${((near/total)*100).toFixed(0)}%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #ef4444;"></span>
        <span>Replacement Due: <strong>${due}</strong> (${((due/total)*100).toFixed(0)}%)</span>
      </div>
    `;
  }

  // SVG Monthly Production Bar Chart
  function renderMonthlyProductionChart() {
    const rawProductions = TMS.getRawProductions();
    // Aggregate by month
    const monthlyMap = {};
    rawProductions.forEach(p => {
      monthlyMap[p.month] = (monthlyMap[p.month] || 0) + (Number(p.quantityMade) || 0);
    });

    const months = Object.keys(monthlyMap).sort();
    // Take recent 7 months
    const displayMonths = months.slice(-7);
    const maxVal = Math.max(...displayMonths.map(m => monthlyMap[m] || 0), 10000);

    const chartHeight = 180;
    const chartWidth = 500;
    const barWidth = 36;
    const gap = (chartWidth - (displayMonths.length * barWidth)) / (displayMonths.length + 1);

    let barsSvg = '';
    displayMonths.forEach((m, idx) => {
      const val = monthlyMap[m] || 0;
      const barH = (val / maxVal) * (chartHeight - 35);
      const x = gap + idx * (barWidth + gap);
      const y = chartHeight - 25 - barH;

      barsSvg += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="url(#barGradient)" />
        <text x="${x + barWidth/2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">${(val/1000).toFixed(0)}k</text>
        <text x="${x + barWidth/2}" y="${chartHeight - 6}" text-anchor="middle" font-size="10" fill="#64748b">${m.slice(2)}</text>
      `;
    });

    DOM.monthlyProductionChartContainer.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.8" />
          </linearGradient>
        </defs>
        <line x1="0" y1="${chartHeight - 22}" x2="${chartWidth}" y2="${chartHeight - 22}" stroke="#e2e8f0" stroke-width="1" />
        ${barsSvg}
      </svg>
    `;
  }

  // =========================================================================
  // VIEW 2: TOOL MASTER LOGIC & RENDERING
  // =========================================================================
  function renderToolMaster() {
    const qSearch = DOM.tmSearchInput.value.trim().toLowerCase();
    const qApp = DOM.tmApplicationFilter.value.trim().toLowerCase();
    const qType = DOM.tmTypeFilter.value;
    const qStatus = DOM.tmStatusFilter.value;

    let tools = TMS.getTools();

    // Filters
    if (qSearch) {
      tools = tools.filter(t => 
        t.toolNumber.toLowerCase().includes(qSearch) ||
        t.toolDescription.toLowerCase().includes(qSearch) ||
        t.machineNumber.toLowerCase().includes(qSearch) ||
        (t.machineName && t.machineName.toLowerCase().includes(qSearch))
      );
    }
    if (qApp) {
      tools = tools.filter(t => t.application && t.application.toLowerCase().includes(qApp));
    }
    if (qType) {
      tools = tools.filter(t => (t.toolType || '').toUpperCase() === qType.toUpperCase());
    }
    if (qStatus) {
      tools = tools.filter(t => t.status === qStatus);
    }

    if (tools.length === 0) {
      DOM.toolMasterTableBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 32px; color: var(--slate-500);">
            No tools match the selected search criteria.
          </td>
        </tr>
      `;
      return;
    }

    DOM.toolMasterTableBody.innerHTML = tools.map(tool => `
      <tr class="${tool.status === 'Replacement Due' ? 'row-danger' : (tool.status === 'Near Limit' ? 'row-warning' : '')}">
        <td><a href="#" class="tool-code" data-inspect-tool="${tool.toolNumber}">${tool.toolNumber}</a></td>
        <td style="font-weight: 600; color: var(--slate-900);">${tool.toolDescription}</td>
        <td><span class="badge-type">${tool.toolType || 'STD'}</span></td>
        <td><span class="machine-code">${tool.machineNumber}</span></td>
        <td>${tool.operation || '-'}</td>
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis;" title="${tool.application || ''}">${tool.application || '-'}</td>
        <td class="col-numeric">${formatNum(tool.replacementFrequency)}</td>
        <td class="col-numeric" style="font-weight: 600;">${formatNum(tool.cumulativeQuantity)}</td>
        <td class="col-numeric" style="font-weight: 700; color: ${tool.balance === 0 ? '#dc2626' : (tool.balance < (tool.replacementFrequency*0.2) ? '#d97706' : 'var(--slate-800)')};">
          ${formatNum(tool.balance)}
        </td>
        <td><span class="badge ${tool.statusClass}"><span class="badge-dot"></span>${tool.status}</span></td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <button class="btn btn-secondary btn-sm" data-dossier-tool="${tool.toolNumber}" title="View Digital Master Card Dossier">View</button>
            <button class="btn btn-secondary btn-sm" data-edit-tool="${tool.toolNumber}" title="Edit Tool Master">Edit</button>
            <button class="btn btn-secondary btn-sm" data-inspect-tool="${tool.toolNumber}" title="View Service History">Service</button>
            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" data-delete-tool="${tool.toolNumber}" title="Delete Tool">✕</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach row events
    DOM.toolMasterTableBody.querySelectorAll('[data-inspect-tool]').forEach(el => {
      el.onclick = (e) => {
        e.preventDefault();
        selectAndInspectTool(el.getAttribute('data-inspect-tool'));
      };
    });

    DOM.toolMasterTableBody.querySelectorAll('[data-dossier-tool]').forEach(el => {
      el.onclick = () => {
        openToolDossier(el.getAttribute('data-dossier-tool'));
      };
    });

    DOM.toolMasterTableBody.querySelectorAll('[data-edit-tool]').forEach(el => {
      el.onclick = () => {
        openAddEditToolModal(el.getAttribute('data-edit-tool'));
      };
    });

    DOM.toolMasterTableBody.querySelectorAll('[data-delete-tool]').forEach(el => {
      el.onclick = () => {
        const toolNum = el.getAttribute('data-delete-tool');
        requestConfirmation(
          `Delete Tool ${toolNum}?`,
          `Are you sure you want to delete tool master ${toolNum}? All associated service and production history will be removed.`,
          () => {
            TMS.deleteTool(toolNum);
            showToast(`Tool ${toolNum} deleted successfully`, 'info');
            renderToolMaster();
            updateBadgesAndCounters();
          }
        );
      };
    });
  }

  // Tool Master Filter Event Listeners
  [DOM.tmSearchInput, DOM.tmApplicationFilter, DOM.tmTypeFilter, DOM.tmStatusFilter].forEach(elem => {
    elem.addEventListener('input', () => renderToolMaster());
    elem.addEventListener('change', () => renderToolMaster());
  });

  DOM.btnResetToolFilters.addEventListener('click', () => {
    DOM.tmSearchInput.value = '';
    DOM.tmApplicationFilter.value = '';
    DOM.tmTypeFilter.value = '';
    DOM.tmStatusFilter.value = '';
    renderToolMaster();
  });

  // CSV Export for Tool Master
  DOM.btnExportToolMasterCSV.addEventListener('click', () => {
    const tools = TMS.getTools();
    let csv = 'Tool Number,Description,Type,Machine Number,Machine Name,Operation,Application,Replacement Frequency,Cumulative Quantity,Remaining Balance,Status\n';
    tools.forEach(t => {
      csv += `"${t.toolNumber}","${t.toolDescription}","${t.toolType || ''}","${t.machineNumber}","${t.machineName || ''}","${t.operation || ''}","${t.application || ''}",${t.replacementFrequency},${t.cumulativeQuantity},${t.balance},"${t.status}"\n`;
    });
    downloadCSV(csv, 'tool_master_export.csv');
    showToast('Tool Master CSV exported successfully', 'success');
  });

  // =========================================================================
  // ADD / EDIT TOOL MASTER MODAL
  // =========================================================================
  function populateMachineDropdown(selectedMachineNumber = '') {
    if (!DOM.inpMachineSelect) return;
    const machines = TMS.getMachines();
    DOM.inpMachineSelect.innerHTML = machines.map(m => `
      <option value="${m.machineNumber}" ${m.machineNumber === selectedMachineNumber ? 'selected' : ''}>
        ${m.machineNumber} - ${m.machineName}
      </option>
    `).join('');

    // Trigger auto-fill for machine name
    syncMachineNameFromSelect();
  }

  function syncMachineNameFromSelect() {
    if (!DOM.inpMachineSelect || !DOM.inpMachineName) return;
    const selectedMachId = DOM.inpMachineSelect.value;
    const mach = TMS.getMachine(selectedMachId);
    if (mach) {
      DOM.inpMachineName.value = mach.machineName;
    }
  }

  if (DOM.inpMachineSelect) {
    DOM.inpMachineSelect.addEventListener('change', syncMachineNameFromSelect);
  }

  function openAddEditToolModal(toolNumber = null) {
    State.editingToolNumber = toolNumber;
    populateMachineDropdown();

    if (toolNumber) {
      // Edit Mode
      DOM.modalToolTitle.textContent = `Edit Tool Master Card - ${toolNumber}`;
      const tool = TMS.getTool(toolNumber);
      if (tool) {
        DOM.inpToolNumber.value = tool.toolNumber;
        DOM.inpToolNumber.readOnly = true;
        DOM.inpToolDescription.value = tool.toolDescription;
        DOM.inpToolType.value = tool.toolType || '';
        if (DOM.inpMachineSelect) {
          DOM.inpMachineSelect.value = tool.machineNumber;
          syncMachineNameFromSelect();
        }
        DOM.inpOperation.value = tool.operation || '';
        if (DOM.inpApplication) DOM.inpApplication.value = tool.application || '';
        DOM.inpIssuedDate.value = tool.issuedDate || '';
        if (DOM.inpReplacementFrequency) DOM.inpReplacementFrequency.value = tool.replacementFrequency;
        if (DOM.inpAmrQuantity) DOM.inpAmrQuantity.value = tool.amrQuantity || '';
        DOM.inpPreparedBy.value = tool.preparedBy || '';
        DOM.inpCheckedBy.value = tool.checkedBy || '';
        DOM.inpApprovedBy.value = tool.approvedBy || '';
        DOM.inpRemarks.value = tool.remarks || '';

        const initialApps = (tool.applications && tool.applications.length > 0)
          ? tool.applications
          : (tool.application ? [{ slNo: '01', application: tool.application, amr: tool.amrQuantity || '' }] : [{ slNo: '01', application: '', amr: '' }]);
        renderAppFormRows(initialApps);
        renderSparesFormRows(tool.spares || []);
      }
    } else {
      // Add Mode
      DOM.modalToolTitle.textContent = 'Tool Master Card - Add New Tool';
      DOM.formToolMaster.reset();
      DOM.inpToolNumber.readOnly = false;
      const nextCount = TMS.getTools().length + 1;
      DOM.inpToolNumber.value = `TOOL-${nextCount < 10 ? '00' : (nextCount < 100 ? '0' : '')}${nextCount}`;
      if (DOM.inpReplacementFrequency) DOM.inpReplacementFrequency.value = 200000;
      if (DOM.inpAmrQuantity) DOM.inpAmrQuantity.value = '200,000';
      DOM.inpIssuedDate.value = new Date().toISOString().slice(0, 10);
      syncMachineNameFromSelect();

      // Seed default application row matching physical card
      renderAppFormRows([
        { slNo: '01', application: 'KOHLER - IU', amr: '75,000' }
      ]);

      // Seed default spare row (Top Tool) inspired by client physical form
      renderSparesFormRows([
        { detailNo: '01', description: 'Top Tool', qtySet: 1, required: 1, available: 1, freqReplacement: 200000 }
      ]);
    }

    openModal(DOM.modalAddTool);
  }

  DOM.btnOpenNewToolModal.addEventListener('click', () => openAddEditToolModal(null));
  DOM.btnQuickAddTool.addEventListener('click', () => openAddEditToolModal(null));

  function renderAppFormRows(apps) {
    if (!DOM.appFormTableBody) return;
    DOM.appFormTableBody.innerHTML = '';
    if (!apps || apps.length === 0) {
      addAppRow({ slNo: '01', application: '', amr: '' });
    } else {
      apps.forEach(a => addAppRow(a));
    }
  }

  function addAppRow(app = null) {
    if (!DOM.appFormTableBody) return;
    const row = document.createElement('tr');
    const curRows = DOM.appFormTableBody.querySelectorAll('tr').length + 1;
    const slNo = app ? app.slNo : (curRows < 10 ? '0' + curRows : String(curRows));
    const application = app ? (app.application || '') : '';
    const amr = app ? (app.amr || '') : '';

    row.innerHTML = `
      <td><input type="text" class="form-input app-sl-no" value="${slNo}" style="font-family: var(--font-mono); text-align: center;"></td>
      <td><input type="text" class="form-input app-name" value="${application}" placeholder="e.g. KOHLER - IU" required></td>
      <td><input type="text" class="form-input app-amr" value="${amr}" placeholder="e.g. 75,000"></td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-icon-only btn-sm" style="color: #ef4444;" title="Remove row">✕</button>
      </td>
    `;

    row.querySelector('button').addEventListener('click', () => row.remove());
    DOM.appFormTableBody.appendChild(row);
  }

  if (DOM.btnAddAppRow) {
    DOM.btnAddAppRow.addEventListener('click', () => addAppRow());
  }

  function renderSparesFormRows(spares) {
    DOM.sparesFormTableBody.innerHTML = '';
    spares.forEach(s => addSpareRow(s));
  }

  function addSpareRow(spare = null) {
    const row = document.createElement('tr');
    const curRows = DOM.sparesFormTableBody.querySelectorAll('tr').length + 1;
    const detailNo = spare ? spare.detailNo : (curRows < 10 ? '0' + curRows : curRows);
    const desc = spare ? spare.description : '';
    const qty = spare ? spare.qtySet : 1;
    const req = spare ? spare.required : 1;
    const avail = spare ? spare.available : 1;
    const freq = spare ? spare.freqReplacement : (DOM.inpReplacementFrequency ? Number(DOM.inpReplacementFrequency.value) : 200000) || 200000;

    row.innerHTML = `
      <td><input type="text" class="form-input spare-detail-no" value="${detailNo}" style="font-family: var(--font-mono); text-align: center;"></td>
      <td><input type="text" class="form-input spare-desc" value="${desc}" placeholder="Spare item name" required></td>
      <td><input type="number" class="form-input spare-qty" value="${qty}" min="1"></td>
      <td><input type="number" class="form-input spare-req" value="${req}" min="0"></td>
      <td><input type="number" class="form-input spare-avail" value="${avail}" min="0"></td>
      <td><input type="number" class="form-input spare-freq" value="${freq}"></td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-icon-only btn-sm" style="color: #ef4444;" title="Remove row">✕</button>
      </td>
    `;

    row.querySelector('button').addEventListener('click', () => row.remove());
    DOM.sparesFormTableBody.appendChild(row);
  }

  DOM.btnAddSpareRow.addEventListener('click', () => addSpareRow());

  // Submit Tool Master Form
  DOM.formToolMaster.addEventListener('submit', (e) => {
    e.preventDefault();

    const toolNumber = DOM.inpToolNumber.value.trim().toUpperCase();
    const toolDescription = DOM.inpToolDescription.value.trim();
    const toolType = DOM.inpToolType.value.trim().toUpperCase();
    const existingTool = State.editingToolNumber ? TMS.getTool(State.editingToolNumber) : null;
    const machineNumber = DOM.inpMachineSelect ? DOM.inpMachineSelect.value : (existingTool?.machineNumber || 'MC-01');
    const machineName = DOM.inpMachineName ? DOM.inpMachineName.value : (existingTool?.machineName || 'Yoke Milling MC-01');
    const operation = DOM.inpOperation.value.trim();
    const issuedDate = DOM.inpIssuedDate.value;
    const replacementFrequency = DOM.inpReplacementFrequency ? Number(DOM.inpReplacementFrequency.value) : (existingTool?.replacementFrequency || 200000);
    const preparedBy = DOM.inpPreparedBy.value.trim();
    const checkedBy = DOM.inpCheckedBy.value.trim();
    const approvedBy = DOM.inpApprovedBy.value.trim();
    const remarks = DOM.inpRemarks.value.trim();

    // Extract applications from sub-table
    const applications = [];
    if (DOM.appFormTableBody) {
      DOM.appFormTableBody.querySelectorAll('tr').forEach(tr => {
        const slNo = tr.querySelector('.app-sl-no')?.value.trim() || '01';
        const application = tr.querySelector('.app-name')?.value.trim() || '';
        const amr = tr.querySelector('.app-amr')?.value.trim() || '';
        if (application || amr) {
          applications.push({ slNo, application, amr });
        }
      });
    }

    const application = applications.length > 0
      ? applications.map(a => a.application).filter(Boolean).join(', ')
      : (DOM.inpApplication ? DOM.inpApplication.value.trim() : (existingTool?.application || ''));
    const amrQuantity = applications.length > 0 && applications[0].amr
      ? applications[0].amr
      : (DOM.inpAmrQuantity ? DOM.inpAmrQuantity.value.trim() : (existingTool?.amrQuantity || ''));

    // Extract spares from sub-table
    const spares = [];
    DOM.sparesFormTableBody.querySelectorAll('tr').forEach(tr => {
      const detailNo = tr.querySelector('.spare-detail-no').value.trim();
      const desc = tr.querySelector('.spare-desc').value.trim();
      const qtySet = Number(tr.querySelector('.spare-qty').value) || 1;
      const required = Number(tr.querySelector('.spare-req').value) || 0;
      const available = Number(tr.querySelector('.spare-avail').value) || 0;
      const freqReplacement = Number(tr.querySelector('.spare-freq').value) || replacementFrequency;
      if (desc) {
        spares.push({ detailNo, description: desc, qtySet, required, available, freqReplacement });
      }
    });

    const toolData = {
      toolNumber,
      toolDescription,
      toolType,
      machineId: machineNumber,
      machineNumber,
      machineName,
      operation,
      application,
      applications,
      issuedDate,
      replacementFrequency,
      amrQuantity,
      preparedBy,
      checkedBy,
      approvedBy,
      remarks,
      spares
    };

    TMS.saveTool(toolData);
    closeModal(DOM.modalAddTool);
    showToast(`Tool Master ${toolNumber} saved successfully!`, 'success');
    renderToolMaster();
    updateBadgesAndCounters();
  });

  // =========================================================================
  // VIEW 3: TOOL SERVICE HISTORY & PRODUCTION TRACKING (DIGITAL CARD)
  // =========================================================================
  function renderServiceHistory(toolNumber) {
    let tool = TMS.getTool(toolNumber);
    if (!tool) {
      // Fallback to first available tool
      const all = TMS.getTools();
      if (all.length > 0) {
        tool = all[0];
        State.selectedToolNumber = tool.toolNumber;
      } else {
        return;
      }
    }

    DOM.serviceSearchInput.value = tool.toolNumber;

    // Populate Tool Summary Card
    DOM.shToolNumber.textContent = tool.toolNumber;
    DOM.shToolDescription.textContent = tool.toolDescription;
    DOM.shToolTypeBadge.textContent = tool.toolType || 'STD';
    DOM.shToolStatusBadge.className = `badge ${tool.statusClass}`;
    DOM.shToolStatusBadge.innerHTML = `<span class="badge-dot"></span>${tool.status}`;

    DOM.shMachineVal.textContent = `${tool.machineNumber} (${tool.machineName || 'Press'})`;
    DOM.shOperationVal.textContent = tool.operation || '-';
    DOM.shApplicationVal.textContent = tool.application || '-';
    DOM.shRepLimitVal.textContent = `${formatNum(tool.replacementFrequency)} pcs`;
    DOM.shCumulativeVal.textContent = `${formatNum(tool.cumulativeQuantity)} pcs`;
    DOM.shBalanceVal.textContent = `${formatNum(tool.balance)} pcs`;
    
    // Utilization progress
    const utilPct = tool.utilizationPct;
    let utilText = `${utilPct}% Used`;
    if (utilPct >= 100) {
      utilText += ' — ⚠ EXCEEDED REPLACEMENT LIMIT!';
    } else if (utilPct >= 80) {
      utilText += ' — ⚠ Near replacement threshold (>= 80%)';
    } else {
      utilText += ' — Tool life is healthy (&lt; 80%)';
    }
    DOM.shUtilizationPct.textContent = utilText;
    DOM.shProgressBarFill.style.width = `${Math.min(utilPct, 100)}%`;
    DOM.shProgressBarFill.className = `progress-bar-fill ${tool.status === 'Replacement Due' ? 'progress-danger' : (tool.status === 'Near Limit' ? 'progress-warning' : 'progress-healthy')}`;

    // Render Section 1: Service History Records
    const services = TMS.getServiceHistory(tool.toolNumber);
    if (services.length === 0) {
      DOM.toolServiceRecordsBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--slate-500);">
            No service or tool change records logged yet for ${tool.toolNumber}.
          </td>
        </tr>
      `;
    } else {
      DOM.toolServiceRecordsBody.innerHTML = services.map(s => `
        <tr>
          <td style="font-weight: 600; color: var(--slate-800);">${s.date}</td>
          <td style="font-weight: 600; color: var(--slate-900);">${s.description}</td>
          <td><span class="badge ${s.approval === 'Approved' ? 'badge-healthy' : 'badge-warning'}">${s.approval}</span></td>
          <td>${s.approvalDate || '-'}</td>
          <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;" title="${s.remarks || ''}">${s.remarks || '-'}</td>
          <td>${s.performedBy}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" data-delete-service="${s.id}">✕</button>
          </td>
        </tr>
      `).join('');

      DOM.toolServiceRecordsBody.querySelectorAll('[data-delete-service]').forEach(btn => {
        btn.onclick = () => {
          const srvId = btn.getAttribute('data-delete-service');
          requestConfirmation('Delete Service Record?', 'Are you sure you want to delete this service record?', () => {
            TMS.deleteServiceRecord(srvId);
            showToast('Service record deleted', 'info');
            renderServiceHistory(State.selectedToolNumber);
            updateBadgesAndCounters();
          });
        };
      });
    }

    // Render Section 2: Quantity Produced (Chronological Cumulative Calculation)
    // The core calculation engine in TMS.calculateProductionHistory dynamically computes:
    // Cumulative Quantity = Previous Cumulative + Current Month Quantity Made
    // Balance = Replacement Frequency - Cumulative Quantity
    const productionHistory = TMS.calculateProductionHistory(tool.toolNumber);
    if (productionHistory.length === 0) {
      DOM.toolProductionRecordsBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--slate-500);">
            No monthly production records recorded yet. Click "+ Add Monthly Quantity" to start production tracking.
          </td>
        </tr>
      `;
    } else {
      DOM.toolProductionRecordsBody.innerHTML = productionHistory.map(p => `
        <tr class="${p.status === 'Replacement Due' ? 'row-danger' : (p.status === 'Near Limit' ? 'row-warning' : '')}">
          <td style="font-weight: 600; font-family: var(--font-mono);">${p.month}</td>
          <td class="col-numeric" style="font-weight: 600; color: var(--slate-900);">${formatNum(p.quantityMade)}</td>
          <td class="col-numeric" style="font-weight: 700; color: var(--accent-700);">${formatNum(p.cumulativeQuantity)}</td>
          <td class="col-numeric">${formatNum(p.replacementLimit)}</td>
          <td class="col-numeric" style="font-weight: 700; color: ${p.balance === 0 ? '#dc2626' : '#d97706'};">${formatNum(p.balance)}</td>
          <td><span class="badge ${p.statusClass}"><span class="badge-dot"></span>${p.status}</span></td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm" style="color: #ef4444;" data-delete-prod="${p.id}">✕</button>
          </td>
        </tr>
      `).join('');

      DOM.toolProductionRecordsBody.querySelectorAll('[data-delete-prod]').forEach(btn => {
        btn.onclick = () => {
          const prodId = btn.getAttribute('data-delete-prod');
          requestConfirmation('Delete Production Entry?', 'Are you sure you want to remove this monthly production entry? All subsequent cumulative figures will automatically recalculate.', () => {
            TMS.deleteProductionRecord(prodId);
            showToast('Production entry removed and cumulative values recalculated', 'info');
            renderServiceHistory(State.selectedToolNumber);
            updateBadgesAndCounters();
          });
        };
      });
    }
  }

  // Search input & button in Tool Service History
  function executeServiceToolSearch() {
    const inputVal = DOM.serviceSearchInput.value.trim();
    if (!inputVal) return;
    const found = TMS.getTool(inputVal);
    if (found) {
      State.selectedToolNumber = found.toolNumber;
      renderServiceHistory(found.toolNumber);
      showToast(`Retrieved Tool Master & Service History for ${found.toolNumber}`, 'success');
    } else {
      showToast(`Tool "${inputVal}" not found. Please verify tool number.`, 'danger');
    }
  }

  DOM.btnSearchServiceTool.addEventListener('click', executeServiceToolSearch);
  DOM.serviceSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeServiceToolSearch();
  });

  // Quick chips click
  document.querySelectorAll('.quick-tool-chips .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolNum = btn.getAttribute('data-tool');
      State.selectedToolNumber = toolNum;
      renderServiceHistory(toolNum);
    });
  });

  // Print Service Card
  DOM.btnPrintServiceCard.addEventListener('click', () => {
    window.print();
  });

  // View Master From Service
  DOM.btnViewMasterFromService.addEventListener('click', () => {
    openToolDossier(State.selectedToolNumber);
  });

  // =========================================================================
  // MODAL: ADD SERVICE RECORD
  // =========================================================================
  function openAddServiceModal(preselectTool = null) {
    const tools = TMS.getTools();
    const activeTool = preselectTool || State.selectedToolNumber;
    DOM.srvToolSelect.innerHTML = tools.map(t => `
      <option value="${t.toolNumber}" ${t.toolNumber === activeTool ? 'selected' : ''}>
        ${t.toolNumber} - ${t.toolDescription} (${t.machineNumber})
      </option>
    `).join('');

    DOM.formAddService.reset();
    DOM.srvDate.value = new Date().toISOString().slice(0, 10);
    DOM.srvApprovalDate.value = new Date().toISOString().slice(0, 10);
    DOM.srvPerformedBy.value = 'S. Rao (Tool Room)';
    DOM.srvDescription.value = 'Top Tool Changed';
    openModal(DOM.modalAddService);
  }

  DOM.btnAddServiceRecordBtn.addEventListener('click', () => openAddServiceModal(State.selectedToolNumber));
  DOM.btnQuickAddServiceFromHeader.addEventListener('click', () => openAddServiceModal(State.selectedToolNumber));

  DOM.formAddService.addEventListener('submit', (e) => {
    e.preventDefault();
    const toolNumber = DOM.srvToolSelect.value;
    const record = {
      toolNumber,
      date: DOM.srvDate.value,
      description: DOM.srvDescription.value.trim(),
      approval: DOM.srvApproval.value,
      approvalDate: DOM.srvApprovalDate.value,
      remarks: DOM.srvRemarks.value.trim(),
      performedBy: DOM.srvPerformedBy.value.trim()
    };

    TMS.saveServiceRecord(record);
    closeModal(DOM.modalAddService);
    showToast(`Service record logged for ${toolNumber}`, 'success');
    State.selectedToolNumber = toolNumber;
    renderServiceHistory(toolNumber);
    updateBadgesAndCounters();
  });

  // =========================================================================
  // MODAL: ADD MONTHLY PRODUCTION (WITH LIVE AUTO-CALC PREVIEW)
  // =========================================================================
  function openAddProductionModal(preselectTool = null) {
    const tools = TMS.getTools();
    const activeTool = preselectTool || State.selectedToolNumber;
    DOM.prdToolSelect.innerHTML = tools.map(t => `
      <option value="${t.toolNumber}" ${t.toolNumber === activeTool ? 'selected' : ''}>
        ${t.toolNumber} - ${t.toolDescription}
      </option>
    `).join('');

    DOM.formAddProduction.reset();
    DOM.prdMonth.value = new Date().toISOString().slice(0, 7); // current YYYY-MM
    DOM.prdLiveCalcPreview.style.display = 'none';
    openModal(DOM.modalAddProduction);
  }

  DOM.btnAddProductionRecordBtn.addEventListener('click', () => openAddProductionModal(State.selectedToolNumber));
  DOM.btnQuickAddProdFromHeader.addEventListener('click', () => openAddProductionModal(State.selectedToolNumber));
  DOM.btnOpenGlobalProdModal.addEventListener('click', () => openAddProductionModal());

  // Live Auto-Calculation Preview while typing quantity
  function updateProductionLivePreview() {
    const toolNum = DOM.prdToolSelect.value;
    const qty = Number(DOM.prdQuantity.value) || 0;
    if (qty <= 0) {
      DOM.prdLiveCalcPreview.style.display = 'none';
      return;
    }

    const tool = TMS.getTool(toolNum);
    if (!tool) return;

    const currentCum = tool.cumulativeQuantity || 0;
    const projectedCum = currentCum + qty;
    const repLimit = tool.replacementFrequency || 0;
    const rawBalance = repLimit - projectedCum;
    const balance = rawBalance < 0 ? 0 : rawBalance;
    const util = repLimit > 0 ? (projectedCum / repLimit) * 100 : 0;

    let status = 'Healthy';
    let statusClass = 'badge-healthy';
    if (util >= 100) {
      status = 'Replacement Due';
      statusClass = 'badge-danger';
    } else if (util >= 80) {
      status = 'Near Limit';
      statusClass = 'badge-warning';
    }

    DOM.prevProjCumulative.textContent = `${formatNum(projectedCum)} pcs`;
    DOM.prevProjBalance.textContent = `${formatNum(balance)} pcs`;
    DOM.prevProjStatus.className = `badge ${statusClass}`;
    DOM.prevProjStatus.textContent = `${status} (${util.toFixed(1)}%)`;
    DOM.prdLiveCalcPreview.style.display = 'block';
  }

  DOM.prdQuantity.addEventListener('input', updateProductionLivePreview);
  DOM.prdToolSelect.addEventListener('change', updateProductionLivePreview);

  DOM.formAddProduction.addEventListener('submit', (e) => {
    e.preventDefault();
    const toolNumber = DOM.prdToolSelect.value;
    const month = DOM.prdMonth.value;
    const quantityMade = Number(DOM.prdQuantity.value);

    const record = {
      toolNumber,
      month,
      quantityMade
    };

    TMS.saveProductionRecord(record);
    closeModal(DOM.modalAddProduction);
    showToast(`Logged production for ${toolNumber}: ${formatNum(quantityMade)} pcs. Cumulative totals updated!`, 'success');
    State.selectedToolNumber = toolNumber;
    renderServiceHistory(toolNumber);
    if (State.currentView === 'production-tracking') {
      renderProductionTrackingView();
    }
    updateBadgesAndCounters();
  });

  // =========================================================================
  // VIEW 4: PRODUCTION TRACKING (SHOP FLOOR MATRIX)
  // =========================================================================
  function renderProductionTrackingView() {
    const tools = TMS.getTools();
    DOM.allProductionOverviewBody.innerHTML = tools.map(t => `
      <tr class="${t.status === 'Replacement Due' ? 'row-danger' : (t.status === 'Near Limit' ? 'row-warning' : '')}">
        <td><a href="#" class="tool-code" data-inspect-tool="${t.toolNumber}">${t.toolNumber}</a></td>
        <td style="font-weight: 600;">${t.toolDescription}</td>
        <td><span class="machine-code">${t.machineNumber}</span></td>
        <td class="col-numeric">${formatNum(t.replacementFrequency)}</td>
        <td class="col-numeric" style="font-weight: 700; color: var(--slate-900);">${formatNum(t.cumulativeQuantity)}</td>
        <td class="col-numeric" style="font-weight: 700; color: ${t.balance === 0 ? '#dc2626' : '#d97706'};">${formatNum(t.balance)}</td>
        <td style="min-width: 150px;">
          <div style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">${t.utilizationPct}%</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill ${t.status === 'Replacement Due' ? 'progress-danger' : (t.status === 'Near Limit' ? 'progress-warning' : 'progress-healthy')}" style="width: ${Math.min(t.utilizationPct, 100)}%;"></div>
          </div>
        </td>
        <td><span class="badge ${t.statusClass}"><span class="badge-dot"></span>${t.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" data-log-prod="${t.toolNumber}">+ Log Output</button>
        </td>
      </tr>
    `).join('');

    DOM.allProductionOverviewBody.querySelectorAll('[data-inspect-tool]').forEach(el => {
      el.onclick = (e) => {
        e.preventDefault();
        selectAndInspectTool(el.getAttribute('data-inspect-tool'));
      };
    });

    DOM.allProductionOverviewBody.querySelectorAll('[data-log-prod]').forEach(btn => {
      btn.onclick = () => {
        openAddProductionModal(btn.getAttribute('data-log-prod'));
      };
    });
  }

  DOM.btnExportProductionCSV.addEventListener('click', () => {
    const rawProd = TMS.getRawProductions();
    let csv = 'Tool Number,Month,Quantity Made\n';
    rawProd.forEach(p => {
      csv += `"${p.toolNumber}","${p.month}",${p.quantityMade}\n`;
    });
    downloadCSV(csv, 'shopfloor_production_log.csv');
    showToast('Production log exported to CSV', 'success');
  });

  // =========================================================================
  // VIEW 5: REPLACEMENT ALERTS
  // =========================================================================
  function renderReplacementAlerts(filterType = 'all') {
    State.alertFilter = filterType;
    const tools = TMS.getTools();
    const nearLimit = tools.filter(t => t.status === 'Near Limit');
    const replacementDue = tools.filter(t => t.status === 'Replacement Due');

    DOM.alertTotalBadge.textContent = nearLimit.length + replacementDue.length;
    DOM.alertDueBadge.textContent = replacementDue.length;
    DOM.alertNearBadge.textContent = nearLimit.length;

    // Filter list
    let displayList = [];
    if (filterType === 'all') {
      displayList = [...replacementDue, ...nearLimit];
    } else if (filterType === 'due') {
      displayList = replacementDue;
    } else if (filterType === 'near') {
      displayList = nearLimit;
    }

    // Active button styling
    DOM.filterAlertsAll.className = `btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`;
    DOM.filterAlertsDue.className = `btn btn-sm ${filterType === 'due' ? 'btn-primary' : 'btn-secondary'}`;
    DOM.filterAlertsNear.className = `btn btn-sm ${filterType === 'near' ? 'btn-primary' : 'btn-secondary'}`;

    if (displayList.length === 0) {
      DOM.replacementAlertsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 32px; color: var(--slate-500);">
            No replacement alerts found for this filter.
          </td>
        </tr>
      `;
      return;
    }

    DOM.replacementAlertsTableBody.innerHTML = displayList.map(t => `
      <tr class="${t.status === 'Replacement Due' ? 'row-danger' : 'row-warning'}">
        <td><a href="#" class="tool-code" data-inspect-tool="${t.toolNumber}">${t.toolNumber}</a></td>
        <td style="font-weight: 600;">${t.toolDescription}</td>
        <td><span class="machine-code">${t.machineNumber}</span></td>
        <td class="col-numeric">${formatNum(t.replacementFrequency)}</td>
        <td class="col-numeric" style="font-weight: 700;">${formatNum(t.cumulativeQuantity)}</td>
        <td class="col-numeric" style="font-weight: 700; color: ${t.balance === 0 ? '#dc2626' : '#d97706'};">${formatNum(t.balance)} pcs</td>
        <td style="font-weight: 700; color: ${t.status === 'Replacement Due' ? '#dc2626' : '#d97706'};">${t.utilizationPct}%</td>
        <td>${t.lastServiceDate || '-'}</td>
        <td>
          <span class="badge ${t.statusClass}">
            <span class="badge-dot"></span>
            ${t.status === 'Replacement Due' ? 'Replacement Required' : 'Near Limit'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" data-inspect-tool="${t.toolNumber}">View Tool</button>
            <button class="btn btn-primary btn-sm" data-schedule-srv="${t.toolNumber}">Log Service</button>
          </div>
        </td>
      </tr>
    `).join('');

    DOM.replacementAlertsTableBody.querySelectorAll('[data-inspect-tool]').forEach(el => {
      el.onclick = (e) => {
        e.preventDefault();
        selectAndInspectTool(el.getAttribute('data-inspect-tool'));
      };
    });

    DOM.replacementAlertsTableBody.querySelectorAll('[data-schedule-srv]').forEach(btn => {
      btn.onclick = () => {
        openAddServiceModal(btn.getAttribute('data-schedule-srv'));
      };
    });
  }

  DOM.filterAlertsAll.addEventListener('click', () => renderReplacementAlerts('all'));
  DOM.filterAlertsDue.addEventListener('click', () => renderReplacementAlerts('due'));
  DOM.filterAlertsNear.addEventListener('click', () => renderReplacementAlerts('near'));

  DOM.btnExportAlertsCSV.addEventListener('click', () => {
    const tools = TMS.getTools().filter(t => t.status !== 'Healthy');
    let csv = 'Tool Number,Description,Machine,Replacement Frequency,Cumulative Quantity,Remaining Balance,Utilization %,Status\n';
    tools.forEach(t => {
      csv += `"${t.toolNumber}","${t.toolDescription}","${t.machineNumber}",${t.replacementFrequency},${t.cumulativeQuantity},${t.balance},"${t.utilizationPct}%","${t.status}"\n`;
    });
    downloadCSV(csv, 'replacement_alerts_critical.csv');
    showToast('Critical replacement alerts exported', 'success');
  });

  // =========================================================================
  // VIEW 6: REPORTS & AUDITS
  // =========================================================================
  const REPORT_GENERATORS = {
    'replacement-schedule': {
      title: 'Tool Replacement Schedule Report',
      subtitle: 'Critical audit of active tools vs rated cycle replacement limits',
      generateData() {
        const tools = TMS.getTools().filter(t => t.status !== 'Healthy');
        return {
          headers: ['Tool No.', 'Description', 'Machine', 'Replacement Freq', 'Cumulative Made', 'Balance', 'Utilization %', 'Status'],
          rows: tools.map(t => [t.toolNumber, t.toolDescription, t.machineNumber, formatNum(t.replacementFrequency), formatNum(t.cumulativeQuantity), formatNum(t.balance), `${t.utilizationPct}%`, t.status]),
          csvRows: tools.map(t => [t.toolNumber, t.toolDescription, t.machineNumber, t.replacementFrequency, t.cumulativeQuantity, t.balance, `${t.utilizationPct}%`, t.status])
        };
      }
    },
    'service-audit': {
      title: 'Tool Service History Audit Report',
      subtitle: 'Chronological sign-off log of punch regrinds, die changes, and inspections',
      generateData() {
        const services = TMS.getServiceHistory();
        return {
          headers: ['Date', 'Tool No.', 'Description / Action', 'Approval', 'Approval Date', 'Performed By', 'Remarks'],
          rows: services.map(s => [s.date, s.toolNumber, s.description, s.approval, s.approvalDate || '-', s.performedBy, s.remarks || '-']),
          csvRows: services.map(s => [s.date, s.toolNumber, s.description, s.approval, s.approvalDate || '', s.performedBy, s.remarks || ''])
        };
      }
    },
    'monthly-wear': {
      title: 'Monthly Production & Tool Wear Report',
      subtitle: 'Recorded batch outputs with chronological wear impact',
      generateData() {
        const productions = TMS.getRawProductions().slice().reverse();
        return {
          headers: ['Tool No.', 'Month', 'Quantity Made (pcs)'],
          rows: productions.map(p => [p.toolNumber, p.month, formatNum(p.quantityMade)]),
          csvRows: productions.map(p => [p.toolNumber, p.month, p.quantityMade])
        };
      }
    },
    'machine-allocation': {
      title: 'Machine-wise Tool Allocation Report',
      subtitle: 'Equipment allocation across all presses, stamping lines, and CNCs',
      generateData() {
        const tools = TMS.getTools();
        return {
          headers: ['Machine', 'Tool No.', 'Tool Description', 'Operation', 'Replacement Frequency', 'Cumulative Made', 'Status'],
          rows: tools.map(t => [t.machineNumber, t.toolNumber, t.toolDescription, t.operation || '-', formatNum(t.replacementFrequency), formatNum(t.cumulativeQuantity), t.status]),
          csvRows: tools.map(t => [t.machineNumber, t.toolNumber, t.toolDescription, t.operation || '', t.replacementFrequency, t.cumulativeQuantity, t.status])
        };
      }
    },
    'critical-procurement': {
      title: 'Critical Tools Near Replacement Report',
      subtitle: 'Procurement and spares dispatch for tools >= 80% lifecycle limit',
      generateData() {
        const tools = TMS.getTools().filter(t => t.utilizationPct >= 80);
        return {
          headers: ['Tool No.', 'Description', 'Machine', 'Replacement Freq', 'Cumulative', 'Balance', 'Status', 'Recommendation'],
          rows: tools.map(t => [
            t.toolNumber,
            t.toolDescription,
            t.machineNumber,
            formatNum(t.replacementFrequency),
            formatNum(t.cumulativeQuantity),
            formatNum(t.balance),
            t.status,
            t.status === 'Replacement Due' ? 'IMMEDIATE REPLACEMENT REQUIRED' : 'Requisition spare replacement punch'
          ]),
          csvRows: tools.map(t => [t.toolNumber, t.toolDescription, t.machineNumber, t.replacementFrequency, t.cumulativeQuantity, t.balance, t.status, t.status === 'Replacement Due' ? 'IMMEDIATE REPLACEMENT' : 'Order Spare'])
        };
      }
    }
  };

  let activeReportKey = null;

  document.querySelectorAll('[data-report]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-report');
      openReportPreview(key);
    });
  });

  document.querySelectorAll('[data-export-report]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-export-report');
      exportReportDirect(key);
    });
  });

  function openReportPreview(reportKey) {
    activeReportKey = reportKey;
    const config = REPORT_GENERATORS[reportKey];
    if (!config) return;

    DOM.reportPreviewTitle.textContent = config.title;
    DOM.reportPreviewSubtitle.textContent = config.subtitle;

    const data = config.generateData();

    let tableHtml = `
      <table class="enterprise-table">
        <thead>
          <tr>
            ${data.headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>
              ${row.map(col => `<td>${col}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    DOM.reportPreviewTableWrap.innerHTML = tableHtml;
    openModal(DOM.modalReportPreview);
  }

  DOM.btnReportPrint.addEventListener('click', () => {
    window.print();
  });

  DOM.btnReportCsvDownload.addEventListener('click', () => {
    if (activeReportKey) {
      exportReportDirect(activeReportKey);
    }
  });

  function exportReportDirect(reportKey) {
    const config = REPORT_GENERATORS[reportKey];
    if (!config) return;
    const data = config.generateData();
    let csv = data.headers.map(h => `"${h}"`).join(',') + '\n';
    data.csvRows.forEach(row => {
      csv += row.map(col => `"${col}"`).join(',') + '\n';
    });
    downloadCSV(csv, `${reportKey}_audit.csv`);
    showToast(`${config.title} exported to CSV`, 'success');
  }

  // =========================================================================
  // TOOL MASTER DOSSIER MODAL (Full 360-degree Digital Master Card)
  // =========================================================================
  function openToolDossier(toolNumber) {
    const tool = TMS.getTool(toolNumber);
    if (!tool) return;

    DOM.dossierToolTitle.textContent = `${tool.toolNumber} - ${tool.toolDescription}`;
    DOM.dossierToolSubtitle.textContent = `Assigned to ${tool.machineNumber} (${tool.machineName || 'Machine'}) | Operation: ${tool.operation || '-'}`;

    const applications = (tool.applications && tool.applications.length > 0)
      ? tool.applications
      : (tool.application ? [{ slNo: '01', application: tool.application, amr: tool.amrQuantity || '-' }] : []);
    const spares = tool.spares || [];
    const services = TMS.getServiceHistory(tool.toolNumber);
    const prodHistory = TMS.calculateProductionHistory(tool.toolNumber);

    DOM.dossierModalBody.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;">
        <div style="background: var(--slate-50); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 600;">Replacement Limit</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--accent-700); margin-top: 4px;">${formatNum(tool.replacementFrequency)} pcs</div>
        </div>
        <div style="background: var(--slate-50); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 600;">Cumulative Production</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--slate-900); margin-top: 4px;">${formatNum(tool.cumulativeQuantity)} pcs</div>
        </div>
        <div style="background: var(--slate-50); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 600;">Remaining Balance</div>
          <div style="font-size: 18px; font-weight: 700; color: ${tool.balance === 0 ? '#dc2626' : '#d97706'}; margin-top: 4px;">${formatNum(tool.balance)} pcs</div>
        </div>
        <div style="background: var(--slate-50); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate-500); font-weight: 600;">Tool Status</div>
          <div style="margin-top: 6px;"><span class="badge ${tool.statusClass}"><span class="badge-dot"></span>${tool.status} (${tool.utilizationPct}%)</span></div>
        </div>
      </div>

      <!-- Specifications Grid -->
      <div style="margin-bottom: 22px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 12px;">Master Specifications & Sign-Offs</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px;">
          <div><span style="color: var(--slate-500);">Tool Type:</span> <strong>${tool.toolType || 'Standard'}</strong></div>
          <div><span style="color: var(--slate-500);">Machine:</span> <strong>${tool.machineNumber}</strong></div>
          <div><span style="color: var(--slate-500);">Operation:</span> <strong>${tool.operation || '-'}</strong></div>
          <div><span style="color: var(--slate-500);">Issued Date:</span> <strong>${tool.issuedDate || '-'}</strong></div>
          <div><span style="color: var(--slate-500);">Prepared By:</span> <strong>${tool.preparedBy || '-'}</strong></div>
          <div><span style="color: var(--slate-500);">Approved By:</span> <strong>${tool.approvedBy || '-'}</strong></div>
        </div>
        <div style="margin-top: 10px; font-size: 12.5px; color: var(--slate-600);">
          <span style="font-weight: 600;">Remarks:</span> ${tool.remarks || 'None'}
        </div>
      </div>

      <!-- Application & AMR Matrix -->
      <div style="margin-bottom: 22px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 10px;">Application & AMR Matrix</h4>
        <div class="table-responsive">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th style="width: 80px; text-align: center;">SL.NO.</th>
                <th>APPLICATION</th>
                <th style="width: 240px;" class="col-numeric">AMR (APPROXIMATELY)</th>
              </tr>
            </thead>
            <tbody>
              ${applications.length === 0 ? '<tr><td colspan="3" style="text-align:center; color: var(--slate-500);">No application records specified</td></tr>' : applications.map(app => `
                <tr>
                  <td style="font-family: var(--font-mono); text-align: center;">${app.slNo || '01'}</td>
                  <td style="font-weight: 600;">${app.application || '-'}</td>
                  <td class="col-numeric">${app.amr || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Spares Matrix -->
      <div style="margin-bottom: 22px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 10px;">Tool Spares Matrix</h4>
        <div class="table-responsive">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>Detail No.</th>
                <th>Spare Description</th>
                <th>Qty / Set</th>
                <th>Required</th>
                <th>Available</th>
                <th class="col-numeric">Frequency of Replacement</th>
              </tr>
            </thead>
            <tbody>
              ${spares.length === 0 ? '<tr><td colspan="6" style="text-align:center; color: var(--slate-500);">No spare records specified</td></tr>' : spares.map(sp => `
                <tr>
                  <td style="font-family: var(--font-mono);">${sp.detailNo}</td>
                  <td style="font-weight: 600;">${sp.description}</td>
                  <td>${sp.qtySet}</td>
                  <td>${sp.required}</td>
                  <td><strong style="color: ${sp.available < sp.required ? '#dc2626' : 'var(--slate-800)'};">${sp.available}</strong></td>
                  <td class="col-numeric">${formatNum(sp.freqReplacement)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Service Events -->
      <div>
        <h4 style="font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 10px;">Service History Log (${services.length} records)</h4>
        <div class="table-responsive">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Approval</th>
                <th>Approval Date</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              ${services.slice(0, 5).map(s => `
                <tr>
                  <td>${s.date}</td>
                  <td style="font-weight: 600;">${s.description}</td>
                  <td><span class="badge badge-healthy">${s.approval}</span></td>
                  <td>${s.approvalDate || '-'}</td>
                  <td>${s.performedBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    openModal(DOM.modalToolDossier);
  }

  DOM.btnDossierPrint.addEventListener('click', () => {
    window.print();
  });

  // =========================================================================
  // UTILITIES: CSV DOWNLOAD & RESET DEMO DATA
  // =========================================================================
  function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  DOM.btnResetData.addEventListener('click', () => {
    requestConfirmation(
      'Restore Demo Data?',
      'This will reset all Tool Master cards, service histories, and production logs back to their original factory defaults. Any custom tools created will be reset.',
      () => {
        TMS.resetToDefaults();
        showToast('Sample demo data successfully restored!', 'success');
        State.selectedToolNumber = 'TOOL-001';
        renderActiveView(State.currentView);
        updateBadgesAndCounters();
      }
    );
  });

  // Global keyboard shortcuts (Esc to close open modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.show').forEach(m => closeModal(m));
    }
  });

  // Initial Load
  switchView('dashboard');
  updateBadgesAndCounters();
});
