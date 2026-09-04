/**
 * Tool Management System - Enterprise Prototype Data & State Layer
 * Persistent storage management with automatic calculations
 */

const STORAGE_KEYS = {
  MACHINES: 'tms_machines_v1',
  TOOLS: 'tms_tools_v1',
  SERVICE_HISTORY: 'tms_service_history_v1',
  PRODUCTION: 'tms_production_v1',
  SETTINGS: 'tms_settings_v1'
};

// Initial Seed Data: 10 Realistic Machines
const INITIAL_MACHINES = [
  { machineId: 'MCH-01', machineNumber: 'MCH-01', machineName: 'Hydraulic Press 100T', department: 'Pressing Dept', location: 'Bay A-1', status: 'Operational' },
  { machineId: 'MCH-02', machineNumber: 'MCH-02', machineName: 'Mechanical Stamping Press 150T', department: 'Stamping Dept', location: 'Bay A-3', status: 'Operational' },
  { machineId: 'MCH-03', machineNumber: 'MCH-03', machineName: 'CNC Vertical Machining Center VMC-850', department: 'Machining Dept', location: 'Bay B-2', status: 'Operational' },
  { machineId: 'MCH-04', machineNumber: 'MCH-04', machineName: 'Heavy Duty Forging Press 250T', department: 'Forging Dept', location: 'Bay C-1', status: 'Operational' },
  { machineId: 'MCH-05', machineNumber: 'MCH-05', machineName: 'Automatic Punching Machine AP-40', department: 'Sheet Metal Dept', location: 'Bay B-4', status: 'Operational' },
  { machineId: 'MCH-06', machineNumber: 'MCH-06', machineName: 'Fine Blanking Press 200T', department: 'Stamping Dept', location: 'Bay A-4', status: 'Operational' },
  { machineId: 'MCH-07', machineNumber: 'MCH-07', machineName: 'Hydraulic Deep Draw Press 120T', department: 'Forming Dept', location: 'Bay C-3', status: 'Operational' },
  { machineId: 'MCH-08', machineNumber: 'MCH-08', machineName: 'Precision CNC Lathe CL-200', department: 'Turning Dept', location: 'Bay B-1', status: 'Operational' },
  { machineId: 'MCH-09', machineNumber: 'MCH-09', machineName: 'Multi-Slide Stamping Press MS-60', department: 'Stamping Dept', location: 'Bay A-2', status: 'Operational' },
  { machineId: 'MCH-10', machineNumber: 'MCH-10', machineName: 'High Speed Progressive Press HP-80', department: 'Pressing Dept', location: 'Bay A-5', status: 'Operational' }
];

// Initial Seed Data: 15 Tools with detailed specifications & spares
const INITIAL_TOOLS = [
  {
    toolNumber: 'TOOL-001',
    toolDescription: 'Yoke Pressing Tool',
    toolType: 'B',
    machineId: 'MCH-01',
    machineNumber: 'MCH-01',
    machineName: 'Hydraulic Press 100T',
    operation: 'Yoke Pressing',
    application: 'Automotive Steering Yoke Assembly Line',
    issuedDate: '2018-05-10',
    amrQuantity: '200,000',
    replacementFrequency: 200000,
    preparedBy: 'R. Sharma (Tool Room)',
    checkedBy: 'K. Patel (Tool Lead)',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'High precision die for steering yoke forging. Regrind top tool if burr exceeds 0.05mm.',
    spares: [
      { detailNo: '01', description: 'Top Tool', qtySet: 1, required: 1, available: 1, freqReplacement: 200000 },
      { detailNo: '02', description: 'Bottom Die Insert', qtySet: 1, required: 1, available: 2, freqReplacement: 200000 },
      { detailNo: '03', description: 'Guide Bushing Set', qtySet: 4, required: 4, available: 4, freqReplacement: 100000 }
    ]
  },
  {
    toolNumber: 'TOOL-002',
    toolDescription: 'Connecting Rod Trimming Die',
    toolType: 'A',
    machineId: 'MCH-04',
    machineNumber: 'MCH-04',
    machineName: 'Heavy Duty Forging Press 250T',
    operation: 'Flash Trimming',
    application: 'Engine Connecting Rod Line 2',
    issuedDate: '2019-01-15',
    amrQuantity: '150,000',
    replacementFrequency: 150000,
    preparedBy: 'A. Rao (Tool Design)',
    checkedBy: 'K. Patel (Tool Lead)',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'Exceeded recommended limit. Requires urgent replacement.',
    spares: [
      { detailNo: '01', description: 'Trimming Punch Upper', qtySet: 1, required: 1, available: 1, freqReplacement: 150000 },
      { detailNo: '02', description: 'Trimming Die Lower', qtySet: 1, required: 1, available: 0, freqReplacement: 150000 }
    ]
  },
  {
    toolNumber: 'TOOL-003',
    toolDescription: 'Flange Piercing & Blanking Tool',
    toolType: 'C',
    machineId: 'MCH-02',
    machineNumber: 'MCH-02',
    machineName: 'Mechanical Stamping Press 150T',
    operation: 'Piercing & Blanking',
    application: 'Chassis Mounting Flange Assembly',
    issuedDate: '2020-03-20',
    amrQuantity: '250,000',
    replacementFrequency: 250000,
    preparedBy: 'V. Nair',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'Compound tooling for 3mm high-tensile sheet metal.',
    spares: [
      { detailNo: '01', description: 'Punch Cluster (4-pin)', qtySet: 1, required: 1, available: 3, freqReplacement: 250000 },
      { detailNo: '02', description: 'Stripper Plate Insert', qtySet: 1, required: 1, available: 2, freqReplacement: 250000 }
    ]
  },
  {
    toolNumber: 'TOOL-004',
    toolDescription: 'Brake Caliper Forming Punch',
    toolType: 'B',
    machineId: 'MCH-01',
    machineNumber: 'MCH-01',
    machineName: 'Hydraulic Press 100T',
    operation: 'Cold Forming',
    application: 'Disc Brake Actuator Housing',
    issuedDate: '2019-08-11',
    amrQuantity: '180,000',
    replacementFrequency: 180000,
    preparedBy: 'R. Sharma',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'Near replacement threshold (96%). Procure replacement punch immediately.',
    spares: [
      { detailNo: '01', description: 'Forming Nose Insert', qtySet: 1, required: 1, available: 1, freqReplacement: 180000 },
      { detailNo: '02', description: 'Hardened Anvil Base', qtySet: 1, required: 1, available: 2, freqReplacement: 360000 }
    ]
  },
  {
    toolNumber: 'TOOL-005',
    toolDescription: 'Rotor Core Progressive Stamping Die',
    toolType: 'D',
    machineId: 'MCH-10',
    machineNumber: 'MCH-10',
    machineName: 'High Speed Progressive Press HP-80',
    operation: 'Lamination Stamping',
    application: 'EV Traction Motor Stator/Rotor Lamination',
    issuedDate: '2021-02-05',
    amrQuantity: '300,000',
    replacementFrequency: 300000,
    preparedBy: 'A. Rao',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma',
    remarks: 'Tungsten carbide tooling. Limit exceeded by 2.1%. Urgent regrind/replacement required.',
    spares: [
      { detailNo: '01', description: 'Carbide Punch Insert', qtySet: 8, required: 8, available: 4, freqReplacement: 300000 },
      { detailNo: '02', description: 'Die Matrix Segment', qtySet: 4, required: 4, available: 2, freqReplacement: 300000 }
    ]
  },
  {
    toolNumber: 'TOOL-006',
    toolDescription: 'Transmission Gear Broaching Tool',
    toolType: 'A',
    machineId: 'MCH-03',
    machineNumber: 'MCH-03',
    machineName: 'CNC Vertical Machining Center VMC-850',
    operation: 'Internal Spline Broaching',
    application: '6-Speed Manual Gearbox Pinion',
    issuedDate: '2022-01-18',
    amrQuantity: '80,000',
    replacementFrequency: 80000,
    preparedBy: 'V. Nair',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'High speed steel M2 grade. Perform tooth profile scan after every 15k cycles.',
    spares: [
      { detailNo: '01', description: 'HSS Spline Broach Bar', qtySet: 1, required: 1, available: 1, freqReplacement: 80000 }
    ]
  },
  {
    toolNumber: 'TOOL-007',
    toolDescription: 'Chassis Bracket Embossing Tool',
    toolType: 'B',
    machineId: 'MCH-06',
    machineNumber: 'MCH-06',
    machineName: 'Fine Blanking Press 200T',
    operation: 'Embossing & Coinage',
    application: 'Subframe Reinforcement Bracket',
    issuedDate: '2021-06-25',
    amrQuantity: '220,000',
    replacementFrequency: 220000,
    preparedBy: 'R. Sharma',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'Healthy operation. Routine inspection every 30 days.',
    spares: [
      { detailNo: '01', description: 'Embossing Stamp Male', qtySet: 1, required: 1, available: 2, freqReplacement: 220000 },
      { detailNo: '02', description: 'Embossing Die Female', qtySet: 1, required: 1, available: 2, freqReplacement: 220000 }
    ]
  },
  {
    toolNumber: 'TOOL-008',
    toolDescription: 'Cylinder Liner Deep Drawing Die',
    toolType: 'C',
    machineId: 'MCH-07',
    machineNumber: 'MCH-07',
    machineName: 'Hydraulic Deep Draw Press 120T',
    operation: 'Deep Drawing Stage 1',
    application: 'Two-Wheeler Engine Sleeve',
    issuedDate: '2020-09-14',
    amrQuantity: '120,000',
    replacementFrequency: 120000,
    preparedBy: 'A. Rao',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma',
    remarks: 'Wear indicator at 97%. Draw ring needs polish and clearance check.',
    spares: [
      { detailNo: '01', description: 'Draw Punch Hardened', qtySet: 1, required: 1, available: 1, freqReplacement: 120000 },
      { detailNo: '02', description: 'Draw Ring Tungsten Carbide', qtySet: 1, required: 1, available: 0, freqReplacement: 120000 }
    ]
  },
  {
    toolNumber: 'TOOL-009',
    toolDescription: 'Drive Shaft Spline Cutting Tool',
    toolType: 'A',
    machineId: 'MCH-08',
    machineNumber: 'MCH-08',
    machineName: 'Precision CNC Lathe CL-200',
    operation: 'Milling / Spline Hobbing',
    application: 'Front Axle Drive Shaft Outer Joint',
    issuedDate: '2022-04-01',
    amrQuantity: '60,000',
    replacementFrequency: 60000,
    preparedBy: 'V. Nair',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'TiAlN coated hob cutter. Low tool wear observed.',
    spares: [
      { detailNo: '01', description: 'Involute Spline Hob Cutter', qtySet: 1, required: 1, available: 2, freqReplacement: 60000 }
    ]
  },
  {
    toolNumber: 'TOOL-010',
    toolDescription: 'Terminal Pin Bending Tool',
    toolType: 'B',
    machineId: 'MCH-09',
    machineNumber: 'MCH-09',
    machineName: 'Multi-Slide Stamping Press MS-60',
    operation: 'Precision 90-Deg Bending',
    application: 'Automotive Fusebox Leadframe',
    issuedDate: '2019-10-05',
    amrQuantity: '500,000',
    replacementFrequency: 500000,
    preparedBy: 'R. Sharma',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma',
    remarks: 'Near limit (98.4%). Tool replacement planned for next scheduled downtime.',
    spares: [
      { detailNo: '01', description: 'Bending Cam Mandrel', qtySet: 2, required: 2, available: 2, freqReplacement: 500000 },
      { detailNo: '02', description: 'Backstop Blade', qtySet: 2, required: 2, available: 4, freqReplacement: 250000 }
    ]
  },
  {
    toolNumber: 'TOOL-011',
    toolDescription: 'Door Hinge Piercing Tool',
    toolType: 'C',
    machineId: 'MCH-05',
    machineNumber: 'MCH-05',
    machineName: 'Automatic Punching Machine AP-40',
    operation: 'Multi-Hole Piercing',
    application: 'Side Door Upper Hinge Plate',
    issuedDate: '2018-09-12',
    amrQuantity: '160,000',
    replacementFrequency: 160000,
    preparedBy: 'A. Rao',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'Over limit (105.3%). Tool replacement is immediately required.',
    spares: [
      { detailNo: '01', description: 'Hole Punch Pin dia 8.2mm', qtySet: 6, required: 6, available: 6, freqReplacement: 160000 },
      { detailNo: '02', description: 'Die Button Cluster', qtySet: 1, required: 1, available: 1, freqReplacement: 160000 }
    ]
  },
  {
    toolNumber: 'TOOL-012',
    toolDescription: 'Wheel Hub Boring Tool',
    toolType: 'A',
    machineId: 'MCH-03',
    machineNumber: 'MCH-03',
    machineName: 'CNC Vertical Machining Center VMC-850',
    operation: 'Finish Boring',
    application: 'Rear Wheel Hub Bearing Seat',
    issuedDate: '2022-03-10',
    amrQuantity: '90,000',
    replacementFrequency: 90000,
    preparedBy: 'V. Nair',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'Cermet inserts used. Surface finish Ra 0.4 achieved.',
    spares: [
      { detailNo: '01', description: 'Fine Boring Head Cartridge', qtySet: 1, required: 1, available: 2, freqReplacement: 90000 }
    ]
  },
  {
    toolNumber: 'TOOL-013',
    toolDescription: 'Exhaust Manifold Flange Die',
    toolType: 'B',
    machineId: 'MCH-02',
    machineNumber: 'MCH-02',
    machineName: 'Mechanical Stamping Press 150T',
    operation: 'Hot Trimming & Piercing',
    application: 'Stainless Steel Exhaust Flange 304L',
    issuedDate: '2021-11-04',
    amrQuantity: '200,000',
    replacementFrequency: 200000,
    preparedBy: 'R. Sharma',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma',
    remarks: 'Healthy operation. High temperature resistance coating intact.',
    spares: [
      { detailNo: '01', description: 'Trim Edge Segments', qtySet: 4, required: 4, available: 2, freqReplacement: 200000 }
    ]
  },
  {
    toolNumber: 'TOOL-014',
    toolDescription: 'Fuel Rail Piercing Punch',
    toolType: 'C',
    machineId: 'MCH-05',
    machineNumber: 'MCH-05',
    machineName: 'Automatic Punching Machine AP-40',
    operation: 'Injector Port Piercing',
    application: 'Common Rail High Pressure Tube',
    issuedDate: '2021-08-19',
    amrQuantity: '140,000',
    replacementFrequency: 140000,
    preparedBy: 'A. Rao',
    checkedBy: 'K. Patel',
    approvedBy: 'M. Verma',
    remarks: 'Healthy operation. Punch alignment verified monthly.',
    spares: [
      { detailNo: '01', description: 'Port Piercing Needles', qtySet: 4, required: 4, available: 8, freqReplacement: 140000 }
    ]
  },
  {
    toolNumber: 'TOOL-015',
    toolDescription: 'Sprocket Tooth Blanking Die',
    toolType: 'B',
    machineId: 'MCH-10',
    machineNumber: 'MCH-10',
    machineName: 'High Speed Progressive Press HP-80',
    operation: 'Gear Tooth Blanking',
    application: 'Motorcycle Drive Sprocket 428-14T',
    issuedDate: '2022-05-15',
    amrQuantity: '250,000',
    replacementFrequency: 250000,
    preparedBy: 'V. Nair',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma',
    remarks: 'Healthy operation. Hardness tested at 62 HRC.',
    spares: [
      { detailNo: '01', description: 'Tooth Blanking Punch Ring', qtySet: 1, required: 1, available: 2, freqReplacement: 250000 },
      { detailNo: '02', description: 'Die Plate Cavity Segment', qtySet: 1, required: 1, available: 1, freqReplacement: 250000 }
    ]
  }
];

// Initial Service History Records (realistic maintenance timeline)
const INITIAL_SERVICE_HISTORY = [
  // TOOL-001: Yoke Pressing Tool (Matches the client's physical card workflow)
  { id: 'SRV-001', toolNumber: 'TOOL-001', date: '2018-11-30', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2018-11-30', remarks: 'Routine change after 1st major production run. Reground spare kept in rack B4.', performedBy: 'S. Rao' },
  { id: 'SRV-002', toolNumber: 'TOOL-001', date: '2019-04-15', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2019-04-16', remarks: 'Die clearance adjusted to 0.04mm. Punch face polished.', performedBy: 'S. Rao' },
  { id: 'SRV-003', toolNumber: 'TOOL-001', date: '2019-08-18', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2019-08-18', remarks: 'Guide pin bushing lubricated. Top punch replaced with refurbished spare.', performedBy: 'A. Kumar' },
  { id: 'SRV-004', toolNumber: 'TOOL-001', date: '2019-11-20', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2019-11-21', remarks: 'New top tool installed. Bushings re-aligned.', performedBy: 'S. Rao' },
  { id: 'SRV-005', toolNumber: 'TOOL-001', date: '2020-06-16', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2020-06-17', remarks: 'Punch tip showed minor pitting. Replaced with spare #02.', performedBy: 'D. Singh' },
  { id: 'SRV-006', toolNumber: 'TOOL-001', date: '2020-09-22', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2020-09-22', remarks: 'Top tool replaced. Stripper spring tension checked.', performedBy: 'S. Rao' },
  { id: 'SRV-007', toolNumber: 'TOOL-001', date: '2020-12-18', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2020-12-19', remarks: 'Top punch renewed. Bottom die insert inspected - OK.', performedBy: 'A. Kumar' },
  { id: 'SRV-008', toolNumber: 'TOOL-001', date: '2021-07-20', description: 'Top Tool Changed', approval: 'Approved', approvalDate: '2021-07-20', remarks: 'Top tool replaced. Cumulative quantity reaching 185k pcs. Near replacement limit.', performedBy: 'D. Singh' },

  // TOOL-002: Connecting Rod Trimming Die
  { id: 'SRV-009', toolNumber: 'TOOL-002', date: '2020-05-12', description: 'Trimming Punch Upper Reground', approval: 'Approved', approvalDate: '2020-05-12', remarks: 'Reground 0.15mm off cutting face.', performedBy: 'A. Kumar' },
  { id: 'SRV-010', toolNumber: 'TOOL-002', date: '2021-03-10', description: 'Trimming Punch Replaced', approval: 'Approved', approvalDate: '2021-03-11', remarks: 'New upper punch installed.', performedBy: 'D. Singh' },
  { id: 'SRV-011', toolNumber: 'TOOL-002', date: '2022-08-14', description: 'Emergency Die Polishing', approval: 'Approved', approvalDate: '2022-08-14', remarks: 'Flash trimming burr observed. Over limit alert triggered.', performedBy: 'S. Rao' },

  // TOOL-004: Brake Caliper Forming Punch
  { id: 'SRV-012', toolNumber: 'TOOL-004', date: '2020-08-20', description: 'Forming Nose Replaced', approval: 'Approved', approvalDate: '2020-08-20', remarks: 'Forming nose replaced with spare #01.', performedBy: 'S. Rao' },
  { id: 'SRV-013', toolNumber: 'TOOL-004', date: '2022-01-15', description: 'Anvil Base Inspection & Alignment', approval: 'Approved', approvalDate: '2022-01-16', remarks: 'Cleaned and re-shimmed. 96% limit reached.', performedBy: 'A. Kumar' },

  // TOOL-005: Rotor Core Progressive Die
  { id: 'SRV-014', toolNumber: 'TOOL-005', date: '2021-09-05', description: 'Carbide Punch Cluster Regrind', approval: 'Approved', approvalDate: '2021-09-06', remarks: 'Micro-finish regrind performed by vendor.', performedBy: 'D. Singh' },
  { id: 'SRV-015', toolNumber: 'TOOL-005', date: '2022-06-12', description: 'Die Matrix Segment Inspection', approval: 'Approved', approvalDate: '2022-06-13', remarks: 'Limit exceeded (306,400 pcs). Replacement requisition placed.', performedBy: 'S. Rao' },

  // TOOL-008: Cylinder Liner Deep Drawing Die
  { id: 'SRV-016', toolNumber: 'TOOL-008', date: '2021-12-10', description: 'Draw Ring Polished & Clearance Adjusted', approval: 'Approved', approvalDate: '2021-12-10', remarks: 'Diamond paste lap to mirror finish.', performedBy: 'A. Kumar' },

  // TOOL-011: Door Hinge Piercing Tool
  { id: 'SRV-017', toolNumber: 'TOOL-011', date: '2021-04-18', description: 'Hole Punch Pins Replaced (6 nos)', approval: 'Approved', approvalDate: '2021-04-19', remarks: 'Pins replaced due to normal wear.', performedBy: 'S. Rao' },
  { id: 'SRV-018', toolNumber: 'TOOL-011', date: '2022-10-05', description: 'Die Button Cluster Alignment', approval: 'Approved', approvalDate: '2022-10-06', remarks: '105% utilization. Replacement due immediately.', performedBy: 'D. Singh' }
];

// Initial Monthly Production Records
// Note: Cumulative quantities are dynamically recalculated by TMS.calculateProductionHistory(toolNumber)
const INITIAL_PRODUCTION = [
  // TOOL-001 (Yoke Pressing Tool - 200,000 Replacement Frequency)
  { id: 'PRD-101', toolNumber: 'TOOL-001', month: '2018-10', quantityMade: 15995 },
  { id: 'PRD-102', toolNumber: 'TOOL-001', month: '2018-11', quantityMade: 18250 },
  { id: 'PRD-103', toolNumber: 'TOOL-001', month: '2018-12', quantityMade: 16400 },
  { id: 'PRD-104', toolNumber: 'TOOL-001', month: '2019-01', quantityMade: 17800 },
  { id: 'PRD-105', toolNumber: 'TOOL-001', month: '2019-02', quantityMade: 14900 },
  { id: 'PRD-106', toolNumber: 'TOOL-001', month: '2019-03', quantityMade: 19100 },
  { id: 'PRD-107', toolNumber: 'TOOL-001', month: '2019-04', quantityMade: 15500 },
  { id: 'PRD-108', toolNumber: 'TOOL-001', month: '2019-05', quantityMade: 18600 },
  { id: 'PRD-109', toolNumber: 'TOOL-001', month: '2019-06', quantityMade: 16200 },
  { id: 'PRD-110', toolNumber: 'TOOL-001', month: '2019-07', quantityMade: 17400 },
  { id: 'PRD-111', toolNumber: 'TOOL-001', month: '2019-08', quantityMade: 15100 },
  // Cumulative: ~185,245 (92.6% -> Near Limit)

  // TOOL-002 (Connecting Rod Trimming Die - 150,000 Replacement Frequency)
  { id: 'PRD-201', toolNumber: 'TOOL-002', month: '2019-02', quantityMade: 22000 },
  { id: 'PRD-202', toolNumber: 'TOOL-002', month: '2019-05', quantityMade: 28500 },
  { id: 'PRD-203', toolNumber: 'TOOL-002', month: '2019-09', quantityMade: 25700 },
  { id: 'PRD-204', toolNumber: 'TOOL-002', month: '2020-03', quantityMade: 24000 },
  { id: 'PRD-205', toolNumber: 'TOOL-002', month: '2020-08', quantityMade: 26000 },
  { id: 'PRD-206', toolNumber: 'TOOL-002', month: '2021-02', quantityMade: 28000 },
  // Cumulative: 154,200 (102.8% -> Replacement Due)

  // TOOL-003 (Flange Piercing & Blanking Tool - 250,000 Replacement Frequency)
  { id: 'PRD-301', toolNumber: 'TOOL-003', month: '2020-05', quantityMade: 35000 },
  { id: 'PRD-302', toolNumber: 'TOOL-003', month: '2020-09', quantityMade: 42000 },
  { id: 'PRD-303', toolNumber: 'TOOL-003', month: '2021-04', quantityMade: 43500 },
  // Cumulative: 120,500 (48.2% -> Healthy)

  // TOOL-004 (Brake Caliper Forming Punch - 180,000 Replacement Frequency)
  { id: 'PRD-401', toolNumber: 'TOOL-004', month: '2019-10', quantityMade: 45000 },
  { id: 'PRD-402', toolNumber: 'TOOL-004', month: '2020-04', quantityMade: 52000 },
  { id: 'PRD-403', toolNumber: 'TOOL-004', month: '2020-11', quantityMade: 48000 },
  { id: 'PRD-404', toolNumber: 'TOOL-004', month: '2021-06', quantityMade: 27800 },
  // Cumulative: 172,800 (96.0% -> Near Limit)

  // TOOL-005 (Rotor Core Progressive Stamping Die - 300,000 Replacement Frequency)
  { id: 'PRD-501', toolNumber: 'TOOL-005', month: '2021-04', quantityMade: 75000 },
  { id: 'PRD-502', toolNumber: 'TOOL-005', month: '2021-08', quantityMade: 82000 },
  { id: 'PRD-503', toolNumber: 'TOOL-005', month: '2021-12', quantityMade: 79400 },
  { id: 'PRD-504', toolNumber: 'TOOL-005', month: '2022-05', quantityMade: 70000 },
  // Cumulative: 306,400 (102.1% -> Replacement Due)

  // TOOL-006 (Transmission Gear Broaching Tool - 80,000 Replacement Frequency)
  { id: 'PRD-601', toolNumber: 'TOOL-006', month: '2022-03', quantityMade: 18400 },
  { id: 'PRD-602', toolNumber: 'TOOL-006', month: '2022-07', quantityMade: 20000 },
  // Cumulative: 38,400 (48.0% -> Healthy)

  // TOOL-007 (Chassis Bracket Embossing Tool - 220,000 Replacement Frequency)
  { id: 'PRD-701', toolNumber: 'TOOL-007', month: '2021-08', quantityMade: 48000 },
  { id: 'PRD-702', toolNumber: 'TOOL-007', month: '2022-02', quantityMade: 47000 },
  // Cumulative: 95,000 (43.2% -> Healthy)

  // TOOL-008 (Cylinder Liner Deep Drawing Die - 120,000 Replacement Frequency)
  { id: 'PRD-801', toolNumber: 'TOOL-008', month: '2020-11', quantityMade: 38000 },
  { id: 'PRD-802', toolNumber: 'TOOL-008', month: '2021-05', quantityMade: 42000 },
  { id: 'PRD-803', toolNumber: 'TOOL-008', month: '2021-11', quantityMade: 36400 },
  // Cumulative: 116,400 (97.0% -> Near Limit)

  // TOOL-009 (Drive Shaft Spline Cutting Tool - 60,000 Replacement Frequency)
  { id: 'PRD-901', toolNumber: 'TOOL-009', month: '2022-05', quantityMade: 12000 },
  { id: 'PRD-902', toolNumber: 'TOOL-009', month: '2022-08', quantityMade: 12000 },
  // Cumulative: 24,000 (40.0% -> Healthy)

  // TOOL-010 (Terminal Pin Bending Tool - 500,000 Replacement Frequency)
  { id: 'PRD-1001', toolNumber: 'TOOL-010', month: '2020-01', quantityMade: 120000 },
  { id: 'PRD-1002', toolNumber: 'TOOL-010', month: '2020-08', quantityMade: 130000 },
  { id: 'PRD-1003', toolNumber: 'TOOL-010', month: '2021-04', quantityMade: 125000 },
  { id: 'PRD-1004', toolNumber: 'TOOL-010', month: '2021-11', quantityMade: 117000 },
  // Cumulative: 492,000 (98.4% -> Near Limit)

  // TOOL-011 (Door Hinge Piercing Tool - 160,000 Replacement Frequency)
  { id: 'PRD-1101', toolNumber: 'TOOL-011', month: '2019-01', quantityMade: 42000 },
  { id: 'PRD-1102', toolNumber: 'TOOL-011', month: '2019-08', quantityMade: 45000 },
  { id: 'PRD-1103', toolNumber: 'TOOL-011', month: '2020-03', quantityMade: 41500 },
  { id: 'PRD-1104', toolNumber: 'TOOL-011', month: '2020-10', quantityMade: 40000 },
  // Cumulative: 168,500 (105.3% -> Replacement Due)

  // TOOL-012 (Wheel Hub Boring Tool - 90,000 Replacement Frequency)
  { id: 'PRD-1201', toolNumber: 'TOOL-012', month: '2022-04', quantityMade: 18000 },
  { id: 'PRD-1202', toolNumber: 'TOOL-012', month: '2022-08', quantityMade: 17000 },
  // Cumulative: 35,000 (38.9% -> Healthy)

  // TOOL-013 (Exhaust Manifold Flange Die - 200,000 Replacement Frequency)
  { id: 'PRD-1301', toolNumber: 'TOOL-013', month: '2022-01', quantityMade: 40000 },
  { id: 'PRD-1302', toolNumber: 'TOOL-013', month: '2022-06', quantityMade: 38000 },
  // Cumulative: 78,000 (39.0% -> Healthy)

  // TOOL-014 (Fuel Rail Piercing Punch - 140,000 Replacement Frequency)
  { id: 'PRD-1401', toolNumber: 'TOOL-014', month: '2021-10', quantityMade: 32000 },
  { id: 'PRD-1402', toolNumber: 'TOOL-014', month: '2022-03', quantityMade: 30000 },
  // Cumulative: 62,000 (44.3% -> Healthy)

  // TOOL-015 (Sprocket Tooth Blanking Die - 250,000 Replacement Frequency)
  { id: 'PRD-1501', toolNumber: 'TOOL-015', month: '2022-06', quantityMade: 55000 },
  { id: 'PRD-1502', toolNumber: 'TOOL-015', month: '2022-09', quantityMade: 55000 }
  // Cumulative: 110,000 (44.0% -> Healthy)
];

// Data Repository & Business Logic Controller
const TMS = {
  // Initialize and ensure data exists in localStorage
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.MACHINES)) {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOOLS)) {
      localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(INITIAL_TOOLS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICE_HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.SERVICE_HISTORY, JSON.stringify(INITIAL_SERVICE_HISTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTION)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(INITIAL_PRODUCTION));
    }
  },

  // Reset demo data to initial defaults
  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(INITIAL_TOOLS));
    localStorage.setItem(STORAGE_KEYS.SERVICE_HISTORY, JSON.stringify(INITIAL_SERVICE_HISTORY));
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(INITIAL_PRODUCTION));
  },

  // --- MACHINES ---
  getMachines() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.MACHINES)) || INITIAL_MACHINES;
    } catch (e) {
      return INITIAL_MACHINES;
    }
  },

  getMachine(machineId) {
    const machines = this.getMachines();
    return machines.find(m => m.machineId === machineId || m.machineNumber === machineId) || null;
  },

  saveMachine(machine) {
    const machines = this.getMachines();
    const index = machines.findIndex(m => m.machineId === machine.machineId || m.machineNumber === machine.machineNumber);
    if (index >= 0) {
      machines[index] = { ...machines[index], ...machine };
    } else {
      machines.push(machine);
    }
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    return machine;
  },

  // --- TOOLS ---
  getTools() {
    try {
      const tools = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOLS)) || INITIAL_TOOLS;
      // Enrich each tool with live computed values
      return tools.map(tool => this.enrichToolMetrics(tool));
    } catch (e) {
      return INITIAL_TOOLS.map(tool => this.enrichToolMetrics(tool));
    }
  },

  getTool(toolNumber) {
    if (!toolNumber) return null;
    const tools = this.getTools();
    return tools.find(t => t.toolNumber.toLowerCase() === toolNumber.toLowerCase().trim()) || null;
  },

  saveTool(toolData) {
    const tools = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOLS)) || INITIAL_TOOLS;
    const index = tools.findIndex(t => t.toolNumber.toLowerCase() === toolData.toolNumber.toLowerCase().trim());
    
    // Ensure machine exists in machine list as well
    if (toolData.machineNumber) {
      const machines = this.getMachines();
      const existingMach = machines.find(m => m.machineNumber.toLowerCase() === toolData.machineNumber.toLowerCase());
      if (!existingMach) {
        machines.push({
          machineId: toolData.machineNumber,
          machineNumber: toolData.machineNumber,
          machineName: toolData.machineName || ('Machine ' + toolData.machineNumber),
          department: 'Shop Floor',
          location: 'Main Plant',
          status: 'Operational'
        });
        localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
      }
    }

    if (index >= 0) {
      tools[index] = { ...tools[index], ...toolData };
    } else {
      tools.unshift(toolData);
    }
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
    return this.enrichToolMetrics(toolData);
  },

  deleteTool(toolNumber) {
    let tools = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOLS)) || INITIAL_TOOLS;
    tools = tools.filter(t => t.toolNumber.toLowerCase() !== toolNumber.toLowerCase().trim());
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));

    // Also remove associated service and production records
    let services = this.getRawServices().filter(s => s.toolNumber.toLowerCase() !== toolNumber.toLowerCase().trim());
    localStorage.setItem(STORAGE_KEYS.SERVICE_HISTORY, JSON.stringify(services));

    let productions = this.getRawProductions().filter(p => p.toolNumber.toLowerCase() !== toolNumber.toLowerCase().trim());
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(productions));
  },

  // --- SERVICE HISTORY ---
  getRawServices() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICE_HISTORY)) || INITIAL_SERVICE_HISTORY;
    } catch (e) {
      return INITIAL_SERVICE_HISTORY;
    }
  },

  getServiceHistory(toolNumber = null) {
    const services = this.getRawServices();
    let list = toolNumber 
      ? services.filter(s => s.toolNumber.toLowerCase() === toolNumber.toLowerCase().trim())
      : services;
    // Sort descending by date
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  saveServiceRecord(record) {
    const services = this.getRawServices();
    if (!record.id) {
      record.id = 'SRV-' + Date.now().toString().slice(-6);
    }
    const index = services.findIndex(s => s.id === record.id);
    if (index >= 0) {
      services[index] = { ...services[index], ...record };
    } else {
      services.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.SERVICE_HISTORY, JSON.stringify(services));
    return record;
  },

  deleteServiceRecord(recordId) {
    let services = this.getRawServices().filter(s => s.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.SERVICE_HISTORY, JSON.stringify(services));
  },

  // --- PRODUCTION & DYNAMIC CUMULATIVE ENGINE ---
  getRawProductions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTION)) || INITIAL_PRODUCTION;
    } catch (e) {
      return INITIAL_PRODUCTION;
    }
  },

  /**
   * Automatically calculates chronological cumulative quantity and balance for a given tool.
   * Requirement:
   * Cumulative Quantity = Previous Cumulative Quantity + Current Month Quantity Made
   * Balance = Replacement Frequency - Cumulative Quantity
   * Status:
   *   0-79% -> Healthy
   *   80-99% -> Near Limit
   *   >= 100% -> Replacement Due
   */
  calculateProductionHistory(toolNumber) {
    const tool = this.getTool(toolNumber);
    const repLimit = tool ? Number(tool.replacementFrequency) || 0 : 0;
    const productions = this.getRawProductions().filter(p => p.toolNumber.toLowerCase() === toolNumber.toLowerCase().trim());

    // Sort chronologically ascending for cumulative accumulation
    productions.sort((a, b) => (a.month > b.month ? 1 : -1));

    let runningCumulative = 0;
    const computedRecords = productions.map(rec => {
      const qty = Number(rec.quantityMade) || 0;
      runningCumulative += qty;
      const rawBalance = repLimit - runningCumulative;
      const balance = rawBalance < 0 ? 0 : rawBalance;
      const utilization = repLimit > 0 ? (runningCumulative / repLimit) * 100 : 0;

      let status = 'Healthy';
      let statusClass = 'badge-healthy';
      if (utilization >= 100) {
        status = 'Replacement Due';
        statusClass = 'badge-danger';
      } else if (utilization >= 80) {
        status = 'Near Limit';
        statusClass = 'badge-warning';
      }

      return {
        ...rec,
        quantityMade: qty,
        cumulativeQuantity: runningCumulative,
        replacementLimit: repLimit,
        balance: balance,
        rawBalance: rawBalance,
        utilizationPct: utilization.toFixed(1),
        status: status,
        statusClass: statusClass
      };
    });

    // Return reversed (most recent month first for UI table display), but with accurate cumulative math
    return computedRecords.reverse();
  },

  saveProductionRecord(record) {
    const productions = this.getRawProductions();
    if (!record.id) {
      record.id = 'PRD-' + Date.now().toString().slice(-6);
    }
    const index = productions.findIndex(p => p.id === record.id);
    if (index >= 0) {
      productions[index] = { ...productions[index], ...record };
    } else {
      productions.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(productions));
    return record;
  },

  deleteProductionRecord(recordId) {
    let productions = this.getRawProductions().filter(p => p.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(productions));
  },

  /**
   * Enriches a tool object with dynamic computed metrics:
   * - cumulativeQuantity
   * - balance
   * - utilizationPct
   * - status ('Healthy', 'Near Limit', 'Replacement Due')
   * - lastServiceDate
   */
  enrichToolMetrics(tool) {
    const productions = this.getRawProductions().filter(p => p.toolNumber.toLowerCase() === tool.toolNumber.toLowerCase().trim());
    const cumulative = productions.reduce((acc, curr) => acc + (Number(curr.quantityMade) || 0), 0);
    const repFreq = Number(tool.replacementFrequency) || 0;
    
    const rawBalance = repFreq - cumulative;
    const balance = rawBalance < 0 ? 0 : rawBalance;
    const utilization = repFreq > 0 ? (cumulative / repFreq) * 100 : 0;

    let status = 'Healthy';
    let statusClass = 'badge-healthy';
    if (utilization >= 100) {
      status = 'Replacement Due';
      statusClass = 'badge-danger';
    } else if (utilization >= 80) {
      status = 'Near Limit';
      statusClass = 'badge-warning';
    }

    // Find last service date
    const services = this.getRawServices().filter(s => s.toolNumber.toLowerCase() === tool.toolNumber.toLowerCase().trim());
    services.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastServiceDate = services.length > 0 ? services[0].date : (tool.issuedDate || 'N/A');

    return {
      ...tool,
      cumulativeQuantity: cumulative,
      balance: balance,
      rawBalance: rawBalance,
      utilizationPct: Number(utilization.toFixed(1)),
      status: status,
      statusClass: statusClass,
      lastServiceDate: lastServiceDate,
      totalServices: services.length
    };
  },

  // Calculate Dashboard Summary KPIs
  getDashboardMetrics() {
    const machines = this.getMachines();
    const tools = this.getTools();
    const services = this.getServiceHistory();

    const totalMachines = machines.length;
    const totalTools = tools.length;
    const activeTools = tools.filter(t => t.cumulativeQuantity > 0 || t.status === 'Healthy').length;
    const nearLimitTools = tools.filter(t => t.status === 'Near Limit');
    const replacementDueTools = tools.filter(t => t.status === 'Replacement Due');
    const healthyTools = tools.filter(t => t.status === 'Healthy');

    return {
      totalMachines,
      totalTools,
      activeTools,
      nearLimitCount: nearLimitTools.length,
      replacementDueCount: replacementDueTools.length,
      healthyCount: healthyTools.length,
      toolsRequiringAttention: [...replacementDueTools, ...nearLimitTools],
      recentServices: services.slice(0, 8)
    };
  }
};

// Initialize on script load
TMS.init();

if (typeof window !== 'undefined') {
  window.TMS = TMS;
}
if (typeof global !== 'undefined') {
  global.TMS = TMS;
}
