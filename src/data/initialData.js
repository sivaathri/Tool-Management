export const INITIAL_MACHINES = [
  { machineId: 'MCH-01', machineNumber: 'MCH-01', machineName: 'Hydraulic Press 100T', department: 'Press Shop', location: 'Bay A-1', status: 'Operational' },
  { machineId: 'MCH-02', machineNumber: 'MCH-02', machineName: 'Mechanical Stamping Press 150T', department: 'Stamping Dept', location: 'Bay A-3', status: 'Operational' },
  { machineId: 'MCH-03', machineNumber: 'MCH-03', machineName: 'CNC Vertical Machining Center VMC-850', department: 'Machining Center', location: 'Bay C-1', status: 'Operational' },
  { machineId: 'MCH-04', machineNumber: 'MCH-04', machineName: 'Heavy Duty Forging Press 250T', department: 'Forging Shop', location: 'Bay D-2', status: 'Maintenance' },
  { machineId: 'MCH-05', machineNumber: 'MCH-05', machineName: 'Automatic Punching Machine AP-40', department: 'Sheet Metal Dept', location: 'Bay B-4', status: 'Operational' },
  { machineId: 'MCH-06', machineNumber: 'MCH-06', machineName: 'Fine Blanking Press 200T', department: 'Stamping Dept', location: 'Bay A-4', status: 'Operational' },
  { machineId: 'MCH-07', machineNumber: 'MCH-07', machineName: 'Hydraulic Deep Draw Press 120T', department: 'Forming Dept', location: 'Bay C-3', status: 'Operational' },
  { machineId: 'MCH-08', machineNumber: 'MCH-08', machineName: 'Precision CNC Lathe CL-200', department: 'Turning Dept', location: 'Bay B-1', status: 'Operational' },
  { machineId: 'MCH-09', machineNumber: 'MCH-09', machineName: 'Multi-Slide Stamping Press MS-60', department: 'Stamping Dept', location: 'Bay A-2', status: 'Operational' },
  { machineId: 'MCH-10', machineNumber: 'MCH-10', machineName: 'High Speed Progressive Press HP-80', department: 'Pressing Dept', location: 'Bay A-5', status: 'Operational' }
];

export const INITIAL_TOOLS = [
  {
    applicationPartNo: '001',
    productName: 'Steering Yoke Assembly',
    toolNumber: 'INE T 1122',
    toolDescription: 'Yoke Pressing Upper Die',
    issuedDate: '2023-01-10',
    lifeTime: 200000,
    replacementFrequency: 200000,
    classification: 'Critical',
    toolType: 'Critical',
    toolCount: 0,
    machineId: 'MCH-01',
    machineNumber: 'MCH-01',
    machineName: 'Hydraulic Press 100T',
    operation: 'Yoke Pressing',
    application: 'Steering Yoke Assembly',
    amrQuantity: '200,000',
    preparedBy: 'R. Sharma (Tool Room)',
    checkedBy: 'K. Patel (Tool Lead)',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'High precision die for steering yoke forging. Regrind top tool if burr exceeds 0.05mm.',
    checkPoints: [
      { sno: 1, point: 'CHECK COIL LOCATOR FOR ANY DAMAGES' },
      { sno: 2, point: 'CHECK COUPLER LOCATOR FOR ANY DAMAGES' },
      { sno: 3, point: 'CHECK COUPLER LOCATOR ANY PLAY' },
      { sno: 4, point: 'CHECK WIRE GUIDE FOR ANY DAMAGES' },
      { sno: 5, point: 'ENSURE TOOL IDENTIFICATION NUMBER' }
    ],
    spares: [
      { detailNo: '01', description: 'Top Punch Insert', qtySet: 1, required: 1, available: 1, freqReplacement: 200000 },
      { detailNo: '02', description: 'Bottom Die Bushing', qtySet: 2, required: 2, available: 2, freqReplacement: 100000 }
    ]
  },
  {
    applicationPartNo: '001',
    productName: 'Steering Yoke Assembly',
    toolNumber: 'INE T 1133',
    toolDescription: 'Yoke Broaching Punch',
    issuedDate: '2023-02-15',
    lifeTime: 150000,
    replacementFrequency: 150000,
    classification: 'Non-Critical',
    toolType: 'Non-Critical',
    toolCount: 0,
    machineId: 'MCH-01',
    machineNumber: 'MCH-01',
    machineName: 'Hydraulic Press 100T',
    operation: 'Yoke Broaching',
    application: 'Steering Yoke Assembly',
    amrQuantity: '150,000',
    preparedBy: 'R. Sharma (Tool Room)',
    checkedBy: 'K. Patel (Tool Lead)',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'Broaching punch for yoke spline broach.',
    checkPoints: [
      { sno: 1, point: 'CHECK COIL LOCATOR FOR ANY DAMAGES' },
      { sno: 2, point: 'CHECK COUPLER LOCATOR FOR ANY DAMAGES' },
      { sno: 3, point: 'CHECK WIRE GUIDE FOR ANY DAMAGES' }
    ],
    spares: [
      { detailNo: '01', description: 'Punch Guide Pin', qtySet: 2, required: 2, available: 4, freqReplacement: 150000 }
    ]
  },
  {
    applicationPartNo: '002',
    productName: 'Brake Caliper Assembly',
    toolNumber: 'INE T 0652',
    toolDescription: 'Caliper Forming Lower Die',
    issuedDate: '2023-03-20',
    lifeTime: 180000,
    replacementFrequency: 180000,
    classification: 'Critical',
    toolType: 'Critical',
    toolCount: 1,
    machineId: 'MCH-07',
    machineNumber: 'MCH-07',
    machineName: 'Hydraulic Deep Draw Press 120T',
    operation: 'Cold Forming',
    application: 'Brake Caliper Assembly',
    amrQuantity: '180,000',
    preparedBy: 'A. Rao (Tool Design)',
    checkedBy: 'K. Patel (Tool Lead)',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'Near limit replacement punch. High priority inspection schedule.',
    checkPoints: [
      { sno: 1, point: 'CHECK DIE LOCATING SHOULDER' },
      { sno: 2, point: 'INSPECT NOSE RADIUS FOR WEAR' },
      { sno: 3, point: 'ENSURE TOOL IDENTIFICATION NUMBER' }
    ],
    spares: [
      { detailNo: '01', description: 'Forming Nose Insert', qtySet: 1, required: 1, available: 1, freqReplacement: 180000 }
    ]
  },
  {
    applicationPartNo: '003',
    productName: 'Engine Connecting Rod Line 2',
    toolNumber: 'TOOL-002',
    toolDescription: 'Connecting Rod Trimming Die',
    issuedDate: '2019-01-15',
    lifeTime: 150000,
    replacementFrequency: 150000,
    classification: 'Critical',
    toolType: 'Critical',
    toolCount: 1,
    machineId: 'MCH-04',
    machineNumber: 'MCH-04',
    machineName: 'Heavy Duty Forging Press 250T',
    operation: 'Flash Trimming',
    application: 'Engine Connecting Rod Line 2',
    amrQuantity: '150,000',
    preparedBy: 'A. Rao (Tool Design)',
    checkedBy: 'K. Patel (Tool Lead)',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'Exceeded recommended limit. Requires urgent replacement.',
    checkPoints: [
      { sno: 1, point: 'VERIFY FLASH TRIM CLEARANCE' },
      { sno: 2, point: 'CHECK TRIM BLADE CHIPPING' }
    ],
    spares: [
      { detailNo: '01', description: 'Trimming Punch Upper', qtySet: 1, required: 1, available: 1, freqReplacement: 150000 },
      { detailNo: '02', description: 'Trimming Die Lower', qtySet: 1, required: 1, available: 0, freqReplacement: 150000 }
    ]
  },
  {
    applicationPartNo: '004',
    productName: 'Chassis Mounting Flange Assembly',
    toolNumber: 'TOOL-003',
    toolDescription: 'Flange Piercing & Blanking Tool',
    issuedDate: '2020-03-20',
    lifeTime: 250000,
    replacementFrequency: 250000,
    classification: 'Non-Critical',
    toolType: 'Non-Critical',
    toolCount: 0,
    machineId: 'MCH-02',
    machineNumber: 'MCH-02',
    machineName: 'Mechanical Stamping Press 150T',
    operation: 'Piercing & Blanking',
    application: 'Chassis Mounting Flange Assembly',
    amrQuantity: '250,000',
    preparedBy: 'V. Nair',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma (Plant Head)',
    remarks: 'Compound tooling for 3mm high-tensile sheet metal.',
    checkPoints: [
      { sno: 1, point: 'CHECK WIRE GUIDE FOR ANY DAMAGES' },
      { sno: 2, point: 'ENSURE TOOL IDENTIFICATION NUMBER' }
    ],
    spares: [
      { detailNo: '01', description: 'Punch Cluster (4-pin)', qtySet: 1, required: 1, available: 3, freqReplacement: 250000 },
      { detailNo: '02', description: 'Stripper Plate Insert', qtySet: 1, required: 1, available: 2, freqReplacement: 250000 }
    ]
  },
  {
    applicationPartNo: '005',
    productName: 'EV Traction Motor Lamination',
    toolNumber: 'TOOL-005',
    toolDescription: 'Rotor Core Progressive Stamping Die',
    issuedDate: '2021-02-05',
    lifeTime: 300000,
    replacementFrequency: 300000,
    classification: 'Critical',
    toolType: 'Critical',
    toolCount: 1,
    machineId: 'MCH-10',
    machineNumber: 'MCH-10',
    machineName: 'High Speed Progressive Press HP-80',
    operation: 'Lamination Stamping',
    application: 'EV Traction Motor Stator/Rotor Lamination',
    amrQuantity: '300,000',
    preparedBy: 'A. Rao',
    checkedBy: 'S. Kulkarni',
    approvedBy: 'M. Verma',
    remarks: 'Tungsten carbide tooling. Limit exceeded by 2.1%. Urgent regrind/replacement required.',
    checkPoints: [
      { sno: 1, point: 'CHECK SEGMENT WEAR PROFILE' },
      { sno: 2, point: 'INSPECT CARBIDE TIP BURR' }
    ],
    spares: [
      { detailNo: '01', description: 'Carbide Punch Insert', qtySet: 8, required: 8, available: 4, freqReplacement: 300000 },
      { detailNo: '02', description: 'Die Matrix Segment', qtySet: 4, required: 4, available: 2, freqReplacement: 300000 }
    ]
  }
];

export const INITIAL_PRODUCTION = [
  // INE T 1122 (Lifetime: 200,000, Cumulative: 175,245 -> Near Limit, Cycle 0)
  { id: 'PRD-112201', toolNumber: 'INE T 1122', month: '2023-02', quantityMade: 45000 },
  { id: 'PRD-112202', toolNumber: 'INE T 1122', month: '2023-04', quantityMade: 52000 },
  { id: 'PRD-112203', toolNumber: 'INE T 1122', month: '2023-07', quantityMade: 48000 },
  { id: 'PRD-112204', toolNumber: 'INE T 1122', month: '2023-11', quantityMade: 30245 },

  // INE T 1133 (Lifetime: 150,000, Cumulative: 63,000 -> Healthy, Cycle 0)
  { id: 'PRD-113301', toolNumber: 'INE T 1133', month: '2023-03', quantityMade: 31000 },
  { id: 'PRD-113302', toolNumber: 'INE T 1133', month: '2023-06', quantityMade: 32000 },

  // INE T 0652 (Lifetime: 180,000, Cumulative: 185,000 -> Replacement Due, Cycle 1)
  { id: 'PRD-065201', toolNumber: 'INE T 0652', month: '2023-04', quantityMade: 65000 },
  { id: 'PRD-065202', toolNumber: 'INE T 0652', month: '2023-08', quantityMade: 65000 },
  { id: 'PRD-065203', toolNumber: 'INE T 0652', month: '2023-12', quantityMade: 55000 },

  // TOOL-002 (Lifetime: 150,000, Cumulative: 154,200 -> Replacement Due, Cycle 1)
  { id: 'PRD-0201', toolNumber: 'TOOL-002', month: '2020-03', quantityMade: 50000 },
  { id: 'PRD-0202', toolNumber: 'TOOL-002', month: '2020-09', quantityMade: 52000 },
  { id: 'PRD-0203', toolNumber: 'TOOL-002', month: '2021-04', quantityMade: 52200 },

  // TOOL-003 (Lifetime: 250,000, Cumulative: 120,500 -> Healthy, Cycle 0)
  { id: 'PRD-0301', toolNumber: 'TOOL-003', month: '2020-08', quantityMade: 60000 },
  { id: 'PRD-0302', toolNumber: 'TOOL-003', month: '2021-05', quantityMade: 60500 },

  // TOOL-005 (Lifetime: 300,000, Cumulative: 306,400 -> Replacement Due, Cycle 1)
  { id: 'PRD-0501', toolNumber: 'TOOL-005', month: '2021-08', quantityMade: 100000 },
  { id: 'PRD-0502', toolNumber: 'TOOL-005', month: '2022-01', quantityMade: 105000 },
  { id: 'PRD-0503', toolNumber: 'TOOL-005', month: '2022-06', quantityMade: 101400 }
];
