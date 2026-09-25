// ============================================================================
// Pharmacy Services Catalogue Service
// Handles clinical and retail services configuration, pricing, booking, and discovery
// ============================================================================

export type ServiceCategory =
  | 'dispensing'
  | 'otc'
  | 'consultation'
  | 'vaccination'
  | 'screening'
  | 'delivery'
  | 'refill'
  | 'other';

export type PriceType = 'free' | 'fixed_fee' | 'starts_at' | 'quote_required';

export interface PharmacyServiceItem {
  id: string;
  pharmacyId: string;
  serviceCode: string;
  serviceCategory: ServiceCategory;
  serviceName: string;
  description: string;
  isEnabled: boolean;
  priceType: PriceType;
  priceUgx: number;
  estimatedDurationMinutes: number;
  requiresAppointment: boolean;
  isNdaAccredited: boolean;
  clinicalNotes?: string;
  prerequisites?: string;
  availableDays: string[];
  updatedAt: string;
}

export interface ServiceCategoryMeta {
  category: ServiceCategory;
  label: string;
  iconName: string;
  badgeColor: string;
  description: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    category: 'dispensing',
    label: 'Prescription Dispensing',
    iconName: 'Pill',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
    description: 'Validation, interaction checks, sterile compounding & dosing counseling',
  },
  {
    category: 'otc',
    label: 'OTC Medicines',
    iconName: 'Sparkles',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200',
    description: 'Self-care therapies, minor ailments, analgesics, skin care & vitamins',
  },
  {
    category: 'consultation',
    label: 'Clinical Consultation',
    iconName: 'Stethoscope',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
    description: 'Medication Therapy Management (MTM), polypharmacy & chronic care triage',
  },
  {
    category: 'vaccination',
    label: 'Vaccinations & Immunization',
    iconName: 'Syringe',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200',
    description: 'Yellow Fever, Flu Quadrivalent, HPV, Hepatitis B & travel immunizations',
  },
  {
    category: 'screening',
    label: 'Health Screening & POC Tests',
    iconName: 'Activity',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
    description: 'Blood pressure, capillary blood glucose, lipids, Malaria RDT & BMI calculation',
  },
  {
    category: 'delivery',
    label: 'Express & Cold-Chain Delivery',
    iconName: 'Truck',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200',
    description: 'Doorstep courier dispatch, insulated vaccine packouts & live courier tracking',
  },
  {
    category: 'refill',
    label: 'Automated Medicine Refill',
    iconName: 'RefreshCw',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200',
    description: 'Chronic medication synchronization, smart depletion alerts & hassle-free renewals',
  },
  {
    category: 'other',
    label: 'Specialized Care & Other',
    iconName: 'HeartPulse',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200',
    description: 'Wound dressing, medical ear piercing, compression fitting & travel health clinics',
  },
];

const INITIAL_PHARMACY_SERVICES: Record<string, PharmacyServiceItem[]> = {
  'client-001': [
    {
      id: 'srv-001-1',
      pharmacyId: 'client-001',
      serviceCode: 'prescription_dispensing',
      serviceCategory: 'dispensing',
      serviceName: 'Prescription Validation & Dispensing',
      description: 'Full clinical review, electronic drug-interaction check, sterile compounding, and personalized dosage counseling by NDA-licensed pharmacists.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 15,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Original valid prescription from registered medical practitioner required.',
      prerequisites: 'Bring physical or digital e-Rx.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-2',
      pharmacyId: 'client-001',
      serviceCode: 'otc_medicines',
      serviceCategory: 'otc',
      serviceName: 'OTC Medicines & Minor Ailment Triage',
      description: 'Direct OTC consultation, first-line treatment for colds, GI issues, allergies, analgesics, and essential vitamins.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 10,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Walk-in pharmacist guidance on dosage and precautions.',
      prerequisites: 'None',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-3',
      pharmacyId: 'client-001',
      serviceCode: 'consultation_clinical',
      serviceCategory: 'consultation',
      serviceName: 'Pharmacist Clinical Consultation & MTM',
      description: 'In-depth Medication Therapy Management (MTM), polypharmacy audit, adverse drug reaction triage, and chronic therapy optimization.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 25000,
      estimatedDurationMinutes: 30,
      requiresAppointment: true,
      isNdaAccredited: true,
      clinicalNotes: 'Private consultation room available. Summary provided to your physician.',
      prerequisites: 'Bring all current medication boxes & lab results.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-4',
      pharmacyId: 'client-001',
      serviceCode: 'vaccination_routine',
      serviceCategory: 'vaccination',
      serviceName: 'Routine & Travel Vaccinations',
      description: 'Cold-chain certified administration of Yellow Fever, Flu Quadrivalent, HPV, Hepatitis B, and Typhoid vaccines with official certificate.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 45000,
      estimatedDurationMinutes: 20,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Administered by certified immunizing pharmacist with cold-chain batch record.',
      prerequisites: 'Valid ID and immunization booklet if available.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-5',
      pharmacyId: 'client-001',
      serviceCode: 'screening_cardio_metabolic',
      serviceCategory: 'screening',
      serviceName: 'Comprehensive Health Screening (BP, Glucose, Lipids)',
      description: 'Point-of-care capillary blood glucose, digital blood pressure, rapid lipid profile, and BMI cardiovascular risk calculation.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 15000,
      estimatedDurationMinutes: 15,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Instant digital test certificate & lifestyle referral provided.',
      prerequisites: '10-hour fasting recommended for lipid profiling.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-6',
      pharmacyId: 'client-001',
      serviceCode: 'screening_malaria_rdt',
      serviceCategory: 'screening',
      serviceName: 'Malaria Rapid Diagnostic Test (RDT) & Triage',
      description: 'WHO-prequalified rapid finger-prick antigen testing for Plasmodium falciparum with immediate 15-minute results and ACT guidance.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 8000,
      estimatedDurationMinutes: 15,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Coupled with digital infrared temperature & clinical symptom assessment.',
      prerequisites: 'None',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-7',
      pharmacyId: 'client-001',
      serviceCode: 'delivery_express',
      serviceCategory: 'delivery',
      serviceName: 'Express Motor-Courier Home Delivery',
      description: 'Insulated temperature-safe doorstep delivery across Kampala & Entebbe corridor with real-time live rider tracking.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 5000,
      estimatedDurationMinutes: 45,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Cold-chain ice-pack packout for refrigerated insulins and biologics.',
      prerequisites: 'Accurate dropoff address & active phone number for OTP delivery confirmation.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-8',
      pharmacyId: 'client-001',
      serviceCode: 'refill_chronic_sync',
      serviceCategory: 'refill',
      serviceName: 'Smart Chronic Refill Synchronization',
      description: 'Automated monthly medication refill dispatch, remaining dose depletion calculation, and physician prescription renewal alerts.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 10,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Zero subscription fee. Automatically synced with ZenithRx AI depletion tracker.',
      prerequisites: 'Active chronic prescription on file.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-001-9',
      pharmacyId: 'client-001',
      serviceCode: 'wound_dressing_firstaid',
      serviceCategory: 'other',
      serviceName: 'Minor Wound Care & Sterile Dressing',
      description: 'Antiseptic cleansing, sterile gauze dressing, minor burn care, and tetanus booster assessment.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 20000,
      estimatedDurationMinutes: 25,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'For non-emergency superficial wounds, surgical stitches removal, and abrasions.',
      prerequisites: 'Triage assessment upon arrival.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
  ],

  'client-002': [
    {
      id: 'srv-002-1',
      pharmacyId: 'client-002',
      serviceCode: 'prescription_dispensing',
      serviceCategory: 'dispensing',
      serviceName: 'Prescription Validation & Dispensing',
      description: 'Fast counter prescription dispensing and dosage advice inside Garden City Mall.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 15,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-002-2',
      pharmacyId: 'client-002',
      serviceCode: 'otc_medicines',
      serviceCategory: 'otc',
      serviceName: 'OTC Wellness & Nutritional Advice',
      description: 'Extensive vitamins, sports nutrition, organic self-care, and dermatological therapies.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 10,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-002-3',
      pharmacyId: 'client-002',
      serviceCode: 'screening_cardio_metabolic',
      serviceCategory: 'screening',
      serviceName: 'Complimentary Blood Pressure & Glucose Check',
      description: 'Free routine screening as part of Uganda Heart Health community outreach.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 10,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-002-4',
      pharmacyId: 'client-002',
      serviceCode: 'delivery_express',
      serviceCategory: 'delivery',
      serviceName: 'Central Kampala Express Delivery',
      description: '30-minute delivery to Kololo, Nakasero, CBD, and surrounding corporate office hubs.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 4000,
      estimatedDurationMinutes: 30,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-002-5',
      pharmacyId: 'client-002',
      serviceCode: 'refill_chronic_sync',
      serviceCategory: 'refill',
      serviceName: 'Chronic Refill Skip-The-Queue Pickup',
      description: 'Pre-packaged, safety-sealed refill packs ready for swift 2-minute counter pickup.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 5,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
  ],

  'client-004': [
    {
      id: 'srv-004-1',
      pharmacyId: 'client-004',
      serviceCode: 'prescription_dispensing',
      serviceCategory: 'dispensing',
      serviceName: '24/7 Emergency Prescription Dispensing',
      description: 'Round-the-clock emergency prescription service, asthma nebulization, and pediatric dosing calculations.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 15,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Licensed night-shift pharmacist on duty 24/7/365.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-004-2',
      pharmacyId: 'client-004',
      serviceCode: 'otc_medicines',
      serviceCategory: 'otc',
      serviceName: 'Emergency OTC Medicines',
      description: '24-hour access to fever reducers, rehydration salts, antihistamines, and emergency kits.',
      isEnabled: true,
      priceType: 'free',
      priceUgx: 0,
      estimatedDurationMinutes: 10,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-004-3',
      pharmacyId: 'client-004',
      serviceCode: 'vaccination_routine',
      serviceCategory: 'vaccination',
      serviceName: 'Airport International Travel Vaccinations (Yellow Card)',
      description: 'Authorized Yellow Fever, Typhoid, Meningitis, and Rabies boosters with official WHO international certificate.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 55000,
      estimatedDurationMinutes: 25,
      requiresAppointment: false,
      isNdaAccredited: true,
      clinicalNotes: 'Authorized for international flight departure clearance.',
      prerequisites: 'Original Passport required for Yellow Card issuance.',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-004-4',
      pharmacyId: 'client-004',
      serviceCode: 'screening_malaria_rdt',
      serviceCategory: 'screening',
      serviceName: '24/7 Malaria & Vital Signs Triage',
      description: 'Instant bedside Malaria RDT, pulse oximetry, blood pressure, and rapid triage.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 10000,
      estimatedDurationMinutes: 15,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
    {
      id: 'srv-004-5',
      pharmacyId: 'client-004',
      serviceCode: 'delivery_express',
      serviceCategory: 'delivery',
      serviceName: 'Airport Corridor 24/7 Express Dispatch',
      description: 'Round-the-clock emergency dispatch to Entebbe International Airport, Kajjansi, and Lubowa residential estates.',
      isEnabled: true,
      priceType: 'fixed_fee',
      priceUgx: 7000,
      estimatedDurationMinutes: 35,
      requiresAppointment: false,
      isNdaAccredited: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      updatedAt: '2026-09-25T08:00:00Z',
    },
  ],
};

const STORAGE_KEY = 'zenithrx_pharmacy_services_store_v1';

function getServiceStore(): Record<string, PharmacyServiceItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading pharmacy services cache:', e);
  }
  return INITIAL_PHARMACY_SERVICES;
}

function saveServiceStore(store: Record<string, PharmacyServiceItem[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Error saving pharmacy services cache:', e);
  }
}

export const pharmacyServicesCatalogueService = {
  /**
   * Get all configured services for a specific pharmacy branch.
   */
  getServicesForPharmacy(pharmacyId: string): PharmacyServiceItem[] {
    const store = getServiceStore();
    return store[pharmacyId] || INITIAL_PHARMACY_SERVICES['client-001'] || [];
  },

  /**
   * Get only currently active/enabled services for a pharmacy.
   */
  getEnabledServicesForPharmacy(pharmacyId: string): PharmacyServiceItem[] {
    return this.getServicesForPharmacy(pharmacyId).filter((s) => s.isEnabled);
  },

  /**
   * Toggle a service on or off for a pharmacy branch.
   */
  toggleServiceStatus(pharmacyId: string, serviceCode: string, isEnabled: boolean): boolean {
    const store = getServiceStore();
    const services = store[pharmacyId] || [...(INITIAL_PHARMACY_SERVICES[pharmacyId] || INITIAL_PHARMACY_SERVICES['client-001'])];
    const index = services.findIndex((s) => s.serviceCode === serviceCode);

    if (index !== -1) {
      services[index] = {
        ...services[index],
        isEnabled,
        updatedAt: new Date().toISOString(),
      };
      store[pharmacyId] = services;
      saveServiceStore(store);
      return true;
    }
    return false;
  },

  /**
   * Update full configuration of an existing service.
   */
  updateServiceConfig(
    pharmacyId: string,
    serviceCode: string,
    updates: Partial<PharmacyServiceItem>
  ): PharmacyServiceItem | null {
    const store = getServiceStore();
    const services = store[pharmacyId] || [...(INITIAL_PHARMACY_SERVICES[pharmacyId] || INITIAL_PHARMACY_SERVICES['client-001'])];
    const index = services.findIndex((s) => s.serviceCode === serviceCode);

    if (index !== -1) {
      services[index] = {
        ...services[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      store[pharmacyId] = services;
      saveServiceStore(store);
      return services[index];
    }
    return null;
  },

  /**
   * Add a new custom service offering to a pharmacy branch catalogue.
   */
  addCustomService(
    pharmacyId: string,
    newService: Omit<PharmacyServiceItem, 'id' | 'pharmacyId' | 'updatedAt'>
  ): PharmacyServiceItem {
    const store = getServiceStore();
    const services = store[pharmacyId] || [...(INITIAL_PHARMACY_SERVICES[pharmacyId] || INITIAL_PHARMACY_SERVICES['client-001'])];

    const created: PharmacyServiceItem = {
      ...newService,
      id: `srv-${pharmacyId}-${Date.now()}`,
      pharmacyId,
      updatedAt: new Date().toISOString(),
    };

    services.push(created);
    store[pharmacyId] = services;
    saveServiceStore(store);
    return created;
  },

  /**
   * Reset services of a pharmacy back to standard defaults.
   */
  resetToDefaults(pharmacyId: string): PharmacyServiceItem[] {
    const store = getServiceStore();
    store[pharmacyId] = INITIAL_PHARMACY_SERVICES[pharmacyId] || INITIAL_PHARMACY_SERVICES['client-001'];
    saveServiceStore(store);
    return store[pharmacyId];
  },

  /**
   * Search and filter pharmacies by services they offer.
   */
  findPharmaciesByServiceCategory(category: ServiceCategory): string[] {
    const store = getServiceStore();
    const matchingPharmacyIds: string[] = [];

    Object.entries(store).forEach(([pharmacyId, services]) => {
      const hasEnabledCategory = services.some(
        (s) => s.isEnabled && s.serviceCategory === category
      );
      if (hasEnabledCategory) {
        matchingPharmacyIds.push(pharmacyId);
      }
    });

    return matchingPharmacyIds;
  },
};
