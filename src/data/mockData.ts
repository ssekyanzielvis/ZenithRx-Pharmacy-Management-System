import { DrugItem, Prescription, CustomerProfile, PurchaseOrder, POSTransaction, InsuranceProvider, PackageTier, ClientSubscription, NdaPharmacyRecord } from '../types';

export const INITIAL_DRUGS: DrugItem[] = [
  {
    id: 'DRUG-001',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanate Potassium',
    barcode: '8901234567891',
    batchNumber: 'AUG-2025-08',
    category: 'Antibiotics',
    shelfLocation: 'Rack A-02',
    costPrice: 850,
    sellingPrice: 1250,
    stockQty: 42,
    reorderLevel: 20,
    expiryDate: '2026-11-15',
    manufacturer: 'GlaxoSmithKline',
    prescriptionRequired: true,
    unit: 'tablets (pack 14s)'
  },
  {
    id: 'DRUG-002',
    brandName: 'Glucophage 850mg',
    genericName: 'Metformin Hydrochloride',
    barcode: '8901234567892',
    batchNumber: 'GLU-2024-11',
    category: 'Diabetes',
    shelfLocation: 'Rack B-01',
    costPrice: 420,
    sellingPrice: 680,
    stockQty: 110,
    reorderLevel: 30,
    expiryDate: '2027-03-20',
    manufacturer: 'Merck Healthcare',
    prescriptionRequired: true,
    unit: 'tablets (pack 30s)'
  },
  {
    id: 'DRUG-003',
    brandName: 'Panadol Extra 500mg/65mg',
    genericName: 'Paracetamol + Caffeine',
    barcode: '8901234567893',
    batchNumber: 'PAN-2026-02',
    category: 'Analgesics',
    shelfLocation: 'Front OTC Shelf 1',
    costPrice: 120,
    sellingPrice: 200,
    stockQty: 250,
    reorderLevel: 50,
    expiryDate: '2027-08-10',
    manufacturer: 'Haleon / GSK',
    prescriptionRequired: false,
    unit: 'strip (10 tablets)'
  },
  {
    id: 'DRUG-004',
    brandName: 'Norvasc 5mg',
    genericName: 'Amlodipine Besylate',
    barcode: '8901234567894',
    batchNumber: 'NOR-2025-04',
    category: 'Cardiovascular',
    shelfLocation: 'Rack C-04',
    costPrice: 650,
    sellingPrice: 980,
    stockQty: 18,
    reorderLevel: 25,
    expiryDate: '2026-08-05', // Expiring soon (<30 days)
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    unit: 'pack (30 tablets)'
  },
  {
    id: 'DRUG-005',
    brandName: 'Ventolin Evohaler 100mcg',
    genericName: 'Salbutamol Sulfate Inhaler',
    barcode: '8901234567895',
    batchNumber: 'VEN-2024-09',
    category: 'Respiratory',
    shelfLocation: 'Rack R-01',
    costPrice: 950,
    sellingPrice: 1450,
    stockQty: 8,
    reorderLevel: 15,
    expiryDate: '2026-09-30', // Low stock & warning expiry
    manufacturer: 'GlaxoSmithKline',
    prescriptionRequired: true,
    unit: 'inhaler unit'
  },
  {
    id: 'DRUG-006',
    brandName: 'Zithromax 500mg',
    genericName: 'Azithromycin Monohydrate',
    barcode: '8901234567896',
    batchNumber: 'ZIT-2023-12',
    category: 'Antibiotics',
    shelfLocation: 'Rack A-05',
    costPrice: 1100,
    sellingPrice: 1650,
    stockQty: 5,
    reorderLevel: 10,
    expiryDate: '2026-06-01', // Expired item!
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    unit: 'pack (3 tablets)'
  },
  {
    id: 'DRUG-007',
    brandName: 'Nexium 40mg',
    genericName: 'Esomeprazole Magnesium',
    barcode: '8901234567897',
    batchNumber: 'NEX-2025-01',
    category: 'Gastrointestinal',
    shelfLocation: 'Rack G-02',
    costPrice: 1400,
    sellingPrice: 2100,
    stockQty: 34,
    reorderLevel: 15,
    expiryDate: '2027-01-15',
    manufacturer: 'AstraZeneca',
    prescriptionRequired: true,
    unit: 'pack (14 tablets)'
  },
  {
    id: 'DRUG-008',
    brandName: 'Lipitor 20mg',
    genericName: 'Atorvastatin Calcium',
    barcode: '8901234567898',
    batchNumber: 'LIP-2025-06',
    category: 'Cardiovascular',
    shelfLocation: 'Rack C-02',
    costPrice: 1800,
    sellingPrice: 2600,
    stockQty: 29,
    reorderLevel: 15,
    expiryDate: '2027-05-18',
    manufacturer: 'Viatris / Pfizer',
    prescriptionRequired: true,
    unit: 'pack (30 tablets)'
  },
  {
    id: 'DRUG-009',
    brandName: 'Coartem 20/120mg',
    genericName: 'Artemether + Lumefantrine',
    barcode: '8901234567899',
    batchNumber: 'COA-2026-01',
    category: 'OTC & Supplements',
    shelfLocation: 'Rack M-01',
    costPrice: 350,
    sellingPrice: 600,
    stockQty: 85,
    reorderLevel: 25,
    expiryDate: '2027-10-30',
    manufacturer: 'Novartis',
    prescriptionRequired: false,
    unit: 'pack (24 tablets)'
  },
  {
    id: 'DRUG-010',
    brandName: 'Lantus SoloStar 100u/ml',
    genericName: 'Insulin Glargine Pen',
    barcode: '8901234567890',
    batchNumber: 'LAN-2025-03',
    category: 'Diabetes',
    shelfLocation: 'Fridge 2°C-8°C',
    costPrice: 3200,
    sellingPrice: 4500,
    stockQty: 12,
    reorderLevel: 10,
    expiryDate: '2026-08-20', // Expiring in <30 days
    manufacturer: 'Sanofi',
    prescriptionRequired: true,
    unit: 'prefilled pen 3ml'
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'RX-9041',
    rxNumber: 'RX-2026-009041',
    patientName: 'Sarah Wanjiku',
    patientAge: 38,
    patientGender: 'Female',
    patientPhone: '+256 712 345 678',
    doctorName: 'Dr. James Omondi',
    doctorLicence: 'UMDPC-88412',
    hospitalName: 'Mulago National Referral Hospital Outpatient Clinic',
    date: '2026-07-21',
    status: 'Pending',
    medications: [
      {
        drugId: 'DRUG-001',
        drugName: 'Augmentin 625mg',
        dosage: '1 tablet twice daily',
        frequency: 'Every 12 hours after meals',
        duration: '7 Days',
        quantity: 14,
        unitPrice: 1250,
        dispensedQty: 0,
        status: 'Pending'
      },
      {
        drugId: 'DRUG-003',
        drugName: 'Panadol Extra 500mg/65mg',
        dosage: '2 tablets 3 times daily',
        frequency: 'As needed for severe fever/pain',
        duration: '5 Days',
        quantity: 20,
        unitPrice: 200,
        dispensedQty: 0,
        status: 'Pending'
      }
    ],
    insuranceClaimId: 'CLM-8821-JUB',
    notes: 'Patient reports mild throat infection and fever for 3 days. No known drug allergies.',
    totalCost: 1650
  },
  {
    id: 'RX-9042',
    rxNumber: 'RX-2026-009042',
    patientName: 'David Kiptoo',
    patientAge: 54,
    patientGender: 'Male',
    patientPhone: '+256 722 987 654',
    doctorName: 'Dr. Amina Hassan',
    doctorLicence: 'UMDPC-91022',
    hospitalName: 'International Hospital Kampala (IHK)',
    date: '2026-07-20',
    status: 'Dispensed',
    medications: [
      {
        drugId: 'DRUG-002',
        drugName: 'Glucophage 850mg',
        dosage: '1 tablet daily with dinner',
        frequency: 'Once daily',
        duration: '30 Days',
        quantity: 30,
        unitPrice: 680,
        dispensedQty: 30,
        status: 'Dispensed'
      },
      {
        drugId: 'DRUG-008',
        drugName: 'Lipitor 20mg',
        dosage: '1 tablet at bedtime',
        frequency: 'Once daily at night',
        duration: '30 Days',
        quantity: 30,
        unitPrice: 2600,
        dispensedQty: 30,
        status: 'Dispensed'
      }
    ],
    insuranceClaimId: 'CLM-9011-NHIS',
    notes: 'Type 2 Diabetes & Dyslipidemia routine 30-day refill.',
    totalCost: 3280
  }
];

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'CUST-001',
    name: 'Sarah Wanjiku',
    phone: '+256 712 345 678',
    email: 'sarah.wanjiku@gmail.com',
    age: 38,
    gender: 'Female',
    bloodGroup: 'O+',
    allergies: ['Penicillin (mild rash)'],
    chronicConditions: ['Asthma'],
    activePrescriptionsCount: 1,
    totalPurchasesCount: 8,
    totalAmountSpent: 14500,
    lastVisit: '2026-07-21',
    insuranceProvider: 'Jubilee Health Insurance Uganda',
    policyNumber: 'JUB-883921-A'
  },
  {
    id: 'CUST-002',
    name: 'David Kiptoo',
    phone: '+256 722 987 654',
    email: 'd.kiptoo@yahoo.com',
    age: 54,
    gender: 'Male',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    activePrescriptionsCount: 2,
    totalPurchasesCount: 19,
    totalAmountSpent: 48900,
    lastVisit: '2026-07-20',
    insuranceProvider: 'National Health Insurance Scheme (NHIS)',
    policyNumber: 'NHIS-5529104'
  },
  {
    id: 'CUST-003',
    name: 'Mary Mutua',
    phone: '+256 733 112 233',
    email: 'mmary.mutua@outlook.com',
    age: 29,
    gender: 'Female',
    bloodGroup: 'B+',
    allergies: ['Sulfa drugs'],
    chronicConditions: [],
    activePrescriptionsCount: 0,
    totalPurchasesCount: 3,
    totalAmountSpent: 3800,
    lastVisit: '2026-07-15',
    insuranceProvider: 'AAR Insurance Uganda',
    policyNumber: 'AAR-771029'
  }
];

export const INITIAL_INSURANCE_PROVIDERS: InsuranceProvider[] = [
  {
    id: 'INS-01',
    providerName: 'Jubilee Health Insurance Uganda',
    code: 'JUB-UG',
    contactPhone: '+256 414 311 000',
    coverageRatio: 0.85,
    pendingClaimsCount: 14,
    totalClaimedAmount: 128500,
    status: 'Active'
  },
  {
    id: 'INS-02',
    providerName: 'National Health Insurance Scheme (NHIS)',
    code: 'NHIS-UG',
    contactPhone: '+256 800 100 200',
    coverageRatio: 0.90,
    pendingClaimsCount: 32,
    totalClaimedAmount: 342000,
    status: 'Active'
  },
  {
    id: 'INS-03',
    providerName: 'AAR Insurance Uganda',
    code: 'AAR-UG',
    contactPhone: '+256 312 261 500',
    coverageRatio: 0.80,
    pendingClaimsCount: 8,
    totalClaimedAmount: 64200,
    status: 'Active'
  },
  {
    id: 'INS-04',
    providerName: 'APA Insurance Uganda',
    code: 'APA-UG',
    contactPhone: '+256 414 230 000',
    coverageRatio: 0.75,
    pendingClaimsCount: 5,
    totalClaimedAmount: 41800,
    status: 'Active'
  }
];

export const INITIAL_POS_TRANSACTIONS: POSTransaction[] = [
  {
    id: 'POS-1001',
    receiptNo: 'REC-2026-0722-01',
    customerName: 'David Kiptoo',
    customerPhone: '+256 722 987 654',
    items: [
      {
        drugId: 'DRUG-002',
        brandName: 'Glucophage 850mg',
        unitPrice: 680,
        quantity: 1,
        total: 680,
        isPrescription: true
      },
      {
        drugId: 'DRUG-008',
        brandName: 'Lipitor 20mg',
        unitPrice: 2600,
        quantity: 1,
        total: 2600,
        isPrescription: true
      }
    ],
    subtotal: 3280,
    taxAmount: 0, // Prescription exempt
    discountAmount: 100,
    insuranceCopayAmount: 636,
    insuranceCoveredAmount: 2544,
    totalPaid: 636,
    paymentMethod: 'Insurance Scheme',
    mpesaRef: 'QGH882190A',
    cashierName: 'Jane Pharmacist',
    timestamp: '2026-07-22 09:42 AM'
  },
  {
    id: 'POS-1002',
    receiptNo: 'REC-2026-0722-02',
    customerName: 'Walk-in Customer',
    items: [
      {
        drugId: 'DRUG-003',
        brandName: 'Panadol Extra 500mg/65mg',
        unitPrice: 200,
        quantity: 2,
        total: 400,
        isPrescription: false
      }
    ],
    subtotal: 400,
    taxAmount: 72,
    discountAmount: 0,
    insuranceCopayAmount: 0,
    insuranceCoveredAmount: 0,
    totalPaid: 472,
    paymentMethod: 'MTN Mobile Money / Airtel Money',
    mpesaRef: 'QGH910244B',
    cashierName: 'Jane Pharmacist',
    timestamp: '2026-07-22 10:15 AM'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-301',
    poNumber: 'PO-2026-00301',
    supplierName: 'GlaxoSmithKline Uganda Ltd',
    supplierEmail: 'orders@gsk.co.ug',
    dateCreated: '2026-07-19',
    items: [
      {
        drugId: 'DRUG-005',
        brandName: 'Ventolin Evohaler 100mcg',
        currentStock: 8,
        orderQty: 30,
        unitCost: 950
      },
      {
        drugId: 'DRUG-001',
        brandName: 'Augmentin 625mg',
        currentStock: 42,
        orderQty: 50,
        unitCost: 850
      }
    ],
    status: 'Sent to Supplier',
    totalAmount: 71000
  }
];

export const INITIAL_PACKAGE_TIERS: PackageTier[] = [
  {
    id: 'Starter',
    name: 'Starter Package',
    tagline: 'Perfect for small pharmacies',
    originalPriceUgx: 50000,
    discountPriceUgx: 40000,
    maxUsers: 5,
    features: [
      'Up to 5 active users',
      'Basic inventory management',
      'Sales tracking & cash register',
      'Standard stock reports',
      'Barcode scanner support'
    ],
    color: 'from-sky-500 to-blue-600'
  },
  {
    id: 'Professional',
    name: 'Professional Package',
    tagline: 'For growing pharmacies',
    originalPriceUgx: 100000,
    discountPriceUgx: 72000,
    maxUsers: 15,
    isPopular: true,
    features: [
      'Up to 15 active users',
      'Advanced inventory & expiry engine',
      'Sales analytics & profit breakdown',
      'Batch tracking & FEFO control',
      'Low stock automated re-ordering alerts',
      'Priority customer support'
    ],
    color: 'from-cyan-500 to-blue-700'
  },
  {
    id: 'Enterprise',
    name: 'Enterprise Package',
    tagline: 'For large pharmacy chains',
    originalPriceUgx: 180000,
    discountPriceUgx: 104000,
    maxUsers: 25,
    features: [
      'Up to 25 active users (Expandable)',
      'Full system capabilities & AI clinical OCR',
      'Advanced multi-branch analytics',
      'Multi-location stock transfers',
      'Insurance claim API integrations',
      '24/7 dedicated support & SLA'
    ],
    color: 'from-indigo-600 to-slate-900'
  }
];

export const NDA_REGISTERED_PHARMACIES: NdaPharmacyRecord[] = [
  {
    licenseNo: 'NDA/LIC/PHA/2026/0182',
    pharmacyName: 'Kampala Central Pharmacy Ltd',
    branchName: 'Kampala Central Branch, Plot 22 Kampala Rd',
    district: 'Kampala',
    region: 'Central Uganda',
    supervisingPharmacist: 'Pharm. Moses Musoke',
    psuRegNo: 'PSU/REG/2021/1042',
    licenseCategory: 'Retail & Wholesale',
    contactPhone: '+256 774 607782',
    contactEmail: 'kampala.central@pharmsync.online',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0205',
    pharmacyName: 'Ecopharm Pharmacy Ltd',
    branchName: 'Nakasero Branch, Plot 14 Lumumba Ave',
    district: 'Kampala',
    region: 'Central Uganda',
    supervisingPharmacist: 'Pharm. Brenda Kembabazi',
    psuRegNo: 'PSU/REG/2019/0883',
    licenseCategory: 'Retail',
    contactPhone: '+256 414 550120',
    contactEmail: 'nakasero@ecopharmug.com',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0311',
    pharmacyName: 'First Pharmacy Uganda',
    branchName: 'Mulago Hospital Road, Plot 8',
    district: 'Kampala',
    region: 'Central Uganda',
    supervisingPharmacist: 'Pharm. Andrew Tumwine',
    psuRegNo: 'PSU/REG/2018/0651',
    licenseCategory: 'Retail & Wholesale',
    contactPhone: '+256 312 200400',
    contactEmail: 'info@firstpharmacy.co.ug',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0409',
    pharmacyName: 'Entebbe Health Express Pharmacy',
    branchName: 'Airport Road Branch, Entebbe Town',
    district: 'Wakiso',
    region: 'Central Uganda',
    supervisingPharmacist: 'Pharm. Sarah Namubiru',
    psuRegNo: 'PSU/REG/2022/1209',
    licenseCategory: 'Retail',
    contactPhone: '+256 704 425357',
    contactEmail: 'entebbe.care@pharmsync.online',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0512',
    pharmacyName: 'Mbarara Medicare Chain Pharmacy',
    branchName: 'High Street Branch, Mbarara City',
    district: 'Mbarara',
    region: 'Western Uganda',
    supervisingPharmacist: 'Pharm. Patrick Kiconco',
    psuRegNo: 'PSU/REG/2017/0432',
    licenseCategory: 'Retail & Wholesale',
    contactPhone: '+256 772 102938',
    contactEmail: 'mbarara.main@pharmsync.online',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0688',
    pharmacyName: 'Jinja City Chemists Ltd',
    branchName: 'Main Street, Jinja City',
    district: 'Jinja',
    region: 'Eastern Uganda',
    supervisingPharmacist: 'Pharm. Emmanuel Waiswa',
    psuRegNo: 'PSU/REG/2020/0911',
    licenseCategory: 'Retail',
    contactPhone: '+256 755 091826',
    contactEmail: 'jinja.chemists@pharmsync.online',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0740',
    pharmacyName: 'Gulu Allied Care Pharmacy',
    branchName: 'Gulu Main Market Ave, Gulu City',
    district: 'Gulu',
    region: 'Northern Uganda',
    supervisingPharmacist: 'Pharm. Charles Ojok',
    psuRegNo: 'PSU/REG/2023/1380',
    licenseCategory: 'Retail',
    contactPhone: '+256 471 432100',
    contactEmail: 'gulu.allied@pharmsync.online',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0890',
    pharmacyName: 'Arua Lifesaving Pharmacy',
    branchName: 'Arua Avenue, Arua City',
    district: 'Arua',
    region: 'West Nile',
    supervisingPharmacist: 'Pharm. Florence Adiru',
    psuRegNo: 'PSU/REG/2021/1120',
    licenseCategory: 'Retail',
    contactPhone: '+256 772 889900',
    contactEmail: 'arua.care@pharmsync.online',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/0921',
    pharmacyName: 'Abacus Pharma Retail Outlet',
    branchName: 'Kira Road Branch, Kamwokya',
    district: 'Kampala',
    region: 'Central Uganda',
    supervisingPharmacist: 'Pharm. Dennis Ochan',
    psuRegNo: 'PSU/REG/2016/0290',
    licenseCategory: 'Wholesale',
    contactPhone: '+256 312 260780',
    contactEmail: 'retail@abacuspharma.com',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  },
  {
    licenseNo: 'NDA/LIC/PHA/2026/1044',
    pharmacyName: 'Guardman Pharmacy Ltd',
    branchName: 'Wandegeya Trading Centre',
    district: 'Kampala',
    region: 'Central Uganda',
    supervisingPharmacist: 'Pharm. Grace Akello',
    psuRegNo: 'PSU/REG/2020/0984',
    licenseCategory: 'Retail',
    contactPhone: '+256 414 530400',
    contactEmail: 'guardman@dawalink.ug',
    status: 'Active & Licensed',
    expiryDate: '2026-12-31'
  }
];

export const INITIAL_CLIENT_SUBSCRIPTIONS: ClientSubscription[] = [
  {
    id: 'CLIENT-101',
    clientName: 'Kampala Central Pharmacy',
    location: 'Kampala Central, Uganda',
    contactPhone: '+256 774 607782',
    contactEmail: 'kampala.central@pharmsync.online',
    packageTier: 'Professional',
    customMaxUsers: 15,
    monthlyUgxRate: 72000,
    billingStatus: 'Active',
    nextBillingDate: '2026-08-15',
    ndaLicenseNo: 'NDA/LIC/PHA/2026/0182',
    ndaVerified: true,
    supervisingPharmacist: 'Pharm. Moses Musoke (PSU/REG/2021/1042)',
    users: [
      {
        id: 'USR-101-1',
        clientId: 'CLIENT-101',
        fullName: 'Pharm. Moses Musoke',
        email: 'moses.musoke@pharmsync.online',
        phone: '+256 774 607782',
        staffRegNo: 'PSU/REG/2021/1042',
        rankRole: 'Supervising Pharmacist',
        status: 'Active',
        dateCreated: '2026-01-10',
        lastLogin: '2026-07-22 09:14 AM',
        accessRights: {
          canAccessPOS: true,
          canManageInventory: true,
          canProcessPrescriptions: true,
          canApproveReorders: true,
          canViewReports: true,
          canSubmitInsurance: true,
          canUseAiAssistant: true,
          canManageStaffAccounts: true,
        },
      },
      {
        id: 'USR-101-2',
        clientId: 'CLIENT-101',
        fullName: 'Jane Nabbanja',
        email: 'jane.n@pharmsync.online',
        phone: '+256 702 112233',
        staffRegNo: 'EMP-KC-004',
        rankRole: 'POS Cashier / Dispenser',
        status: 'Active',
        dateCreated: '2026-02-01',
        lastLogin: '2026-07-22 08:30 AM',
        accessRights: {
          canAccessPOS: true,
          canManageInventory: false,
          canProcessPrescriptions: true,
          canApproveReorders: false,
          canViewReports: false,
          canSubmitInsurance: true,
          canUseAiAssistant: false,
          canManageStaffAccounts: false,
        },
      },
      {
        id: 'USR-101-3',
        clientId: 'CLIENT-101',
        fullName: 'Joseph Otim',
        email: 'otim.inventory@pharmsync.online',
        phone: '+256 781 445566',
        staffRegNo: 'EMP-KC-009',
        rankRole: 'Store & Inventory Manager',
        status: 'Active',
        dateCreated: '2026-03-15',
        lastLogin: '2026-07-21 04:45 PM',
        accessRights: {
          canAccessPOS: false,
          canManageInventory: true,
          canProcessPrescriptions: false,
          canApproveReorders: true,
          canViewReports: true,
          canSubmitInsurance: false,
          canUseAiAssistant: false,
          canManageStaffAccounts: false,
        },
      },
    ],
    allowedFeatures: {
      basicInventory: true,
      batchTracking: true,
      autoReordering: true,
      expiryAlerts: true,
      posBilling: true,
      salesAnalytics: true,
      insuranceClaims: true,
      aiCounseling: true,
      multiLocation: false,
      apiAccess: false
    }
  },
  {
    id: 'CLIENT-102',
    clientName: 'Entebbe Health Express Pharmacy',
    location: 'Airport Rd, Entebbe, Wakiso',
    contactPhone: '+256 704 425357',
    contactEmail: 'entebbe.care@pharmsync.online',
    packageTier: 'Starter',
    customMaxUsers: 5,
    monthlyUgxRate: 40000,
    billingStatus: 'Active',
    nextBillingDate: '2026-08-01',
    ndaLicenseNo: 'NDA/LIC/PHA/2026/0409',
    ndaVerified: true,
    supervisingPharmacist: 'Pharm. Sarah Namubiru (PSU/REG/2022/1209)',
    users: [
      {
        id: 'USR-102-1',
        clientId: 'CLIENT-102',
        fullName: 'Pharm. Sarah Namubiru',
        email: 'sarah.namubiru@pharmsync.online',
        phone: '+256 704 425357',
        staffRegNo: 'PSU/REG/2022/1209',
        rankRole: 'Supervising Pharmacist',
        status: 'Active',
        dateCreated: '2026-02-12',
        lastLogin: '2026-07-22 07:50 AM',
        accessRights: {
          canAccessPOS: true,
          canManageInventory: true,
          canProcessPrescriptions: true,
          canApproveReorders: true,
          canViewReports: true,
          canSubmitInsurance: true,
          canUseAiAssistant: true,
          canManageStaffAccounts: true,
        },
      },
      {
        id: 'USR-102-2',
        clientId: 'CLIENT-102',
        fullName: 'Grace Akello',
        email: 'grace.akello@pharmsync.online',
        phone: '+256 752 998877',
        staffRegNo: 'EMP-ENT-002',
        rankRole: 'POS Cashier / Dispenser',
        status: 'Active',
        dateCreated: '2026-03-01',
        lastLogin: '2026-07-20 02:15 PM',
        accessRights: {
          canAccessPOS: true,
          canManageInventory: false,
          canProcessPrescriptions: true,
          canApproveReorders: false,
          canViewReports: false,
          canSubmitInsurance: false,
          canUseAiAssistant: false,
          canManageStaffAccounts: false,
        },
      },
    ],
    allowedFeatures: {
      basicInventory: true,
      batchTracking: false,
      autoReordering: false,
      expiryAlerts: true,
      posBilling: true,
      salesAnalytics: false,
      insuranceClaims: false,
      aiCounseling: false,
      multiLocation: false,
      apiAccess: false
    }
  },
  {
    id: 'CLIENT-103',
    clientName: 'Mbarara Medicare Chain Pharmacy',
    location: 'High Street, Mbarara City',
    contactPhone: '+256 772 102938',
    contactEmail: 'mbarara.main@pharmsync.online',
    packageTier: 'Enterprise',
    customMaxUsers: 25,
    monthlyUgxRate: 104000,
    billingStatus: 'Active',
    nextBillingDate: '2026-08-20',
    ndaLicenseNo: 'NDA/LIC/PHA/2026/0512',
    ndaVerified: true,
    supervisingPharmacist: 'Pharm. Patrick Kiconco (PSU/REG/2017/0432)',
    allowedFeatures: {
      basicInventory: true,
      batchTracking: true,
      autoReordering: true,
      expiryAlerts: true,
      posBilling: true,
      salesAnalytics: true,
      insuranceClaims: true,
      aiCounseling: true,
      multiLocation: true,
      apiAccess: true
    }
  },
  {
    id: 'CLIENT-104',
    clientName: 'Jinja City Chemists Ltd',
    location: 'Main Street, Jinja City',
    contactPhone: '+256 755 091826',
    contactEmail: 'jinja.chemists@pharmsync.online',
    packageTier: 'Custom Tailored',
    customMaxUsers: 10,
    monthlyUgxRate: 85000,
    billingStatus: 'Active',
    nextBillingDate: '2026-08-10',
    ndaLicenseNo: 'NDA/LIC/PHA/2026/0688',
    ndaVerified: true,
    supervisingPharmacist: 'Pharm. Emmanuel Waiswa (PSU/REG/2020/0911)',
    allowedFeatures: {
      basicInventory: true,
      batchTracking: true,
      autoReordering: true,
      expiryAlerts: true,
      posBilling: true,
      salesAnalytics: true,
      insuranceClaims: true,
      aiCounseling: true,
      multiLocation: false,
      apiAccess: false
    }
  }
];

