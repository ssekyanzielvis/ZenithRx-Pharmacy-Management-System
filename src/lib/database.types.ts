/**
 * database.types.ts — ZenithRx Supabase Database Type Definitions
 * These types mirror the PostgreSQL schema in supabase/migrations/ and follow
 * the official Supabase v2 schema format.
 * Clean Architecture: Infrastructure Layer
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Enums matching PostgreSQL CHECK constraints ──────────────────────────────

export type BillingStatus = 'active' | 'pending_renewal' | 'grace_period' | 'suspended';
export type PackageTier = 'Starter' | 'Professional' | 'Enterprise' | 'Custom Tailored';
export type UserStatus = 'active' | 'suspended' | 'pending_invite';
export type DrugCategory =
  | 'Antibiotics'
  | 'Analgesics'
  | 'Cardiovascular'
  | 'Diabetes'
  | 'Respiratory'
  | 'OTC & Supplements'
  | 'Gastrointestinal'
  | 'Dermatology';
export type PrescriptionStatus = 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';
export type POStatus = 'draft' | 'sent_to_supplier' | 'fulfilled' | 'cancelled';
export type FileStatus = 'pending' | 'active' | 'archived' | 'deleted';
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'dispense'
  | 'stock_adjust'
  | 'export'
  | 'override';

// ─── Table Row Types ──────────────────────────────────────────────────────────

export interface DbTenant {
  id: string; // uuid
  name: string;
  slug: string; // url-safe identifier
  location: string;
  contact_phone: string;
  contact_email: string;
  package_tier: PackageTier;
  max_users: number;
  monthly_ugx_rate: number;
  billing_status: BillingStatus;
  next_billing_date: string | null; // ISO date
  nda_license_no: string | null;
  nda_verified: boolean;
  supervising_pharmacist: string | null;
  allowed_features: {
    basic_inventory: boolean;
    batch_tracking: boolean;
    auto_reordering: boolean;
    expiry_alerts: boolean;
    pos_billing: boolean;
    sales_analytics: boolean;
    insurance_claims: boolean;
    ai_counseling: boolean;
    multi_location: boolean;
    api_access: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string; // uuid — matches auth.users.id
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string;
  staff_reg_no: string | null;
  rank_role: string;
  status: UserStatus;
  access_rights: {
    can_access_pos: boolean;
    can_manage_inventory: boolean;
    can_process_prescriptions: boolean;
    can_approve_reorders: boolean;
    can_view_reports: boolean;
    can_submit_insurance: boolean;
    can_use_ai_assistant: boolean;
    can_manage_staff_accounts: boolean;
  };
  last_login: string | null;
  created_at: string;
}

export interface DbDrug {
  id: string;
  tenant_id: string;
  brand_name: string;
  generic_name: string;
  barcode: string;
  batch_number: string;
  category: DrugCategory;
  shelf_location: string;
  cost_price: number;
  selling_price: number;
  stock_qty: number;
  reorder_level: number;
  expiry_date: string; // ISO date YYYY-MM-DD
  manufacturer: string;
  prescription_required: boolean;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface DbStockMovement {
  id: string;
  tenant_id: string;
  drug_id: string;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'write_off' | 'return';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reference_id: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface DbPrescription {
  id: string;
  tenant_id: string;
  rx_number: string;
  patient_name: string;
  patient_age: number | null;
  patient_gender: 'male' | 'female' | 'other' | null;
  patient_phone: string;
  doctor_name: string;
  doctor_licence: string;
  hospital_name: string;
  date: string;
  status: PrescriptionStatus;
  insurance_claim_id: string | null;
  notes: string | null;
  total_cost: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPrescriptionItem {
  id: string;
  prescription_id: string;
  tenant_id: string;
  drug_id: string | null;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit_price: number;
  dispensed_qty: number;
  status: 'pending' | 'dispensed';
}

export interface DbCustomer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  blood_group: string | null;
  allergies: string[];
  chronic_conditions: string[];
  loyalty_points: number;
  total_purchases_ugx: number;
  last_visit: string | null;
  insurance_provider: string | null;
  policy_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPOSTransaction {
  id: string;
  tenant_id: string;
  receipt_no: string;
  customer_name: string;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  insurance_copay_amount: number;
  insurance_covered_amount: number;
  total_paid: number;
  payment_method: string;
  mpesa_ref: string | null;
  cashier_id: string | null;
  cashier_name: string;
  timestamp: string;
  created_at: string;
}

export interface DbPOSTransactionItem {
  id: string;
  transaction_id: string;
  tenant_id: string;
  drug_id: string | null;
  brand_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  is_prescription: boolean;
}

export interface DbPurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_name: string;
  supplier_email: string;
  status: POStatus;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  drug_id: string | null;
  brand_name: string;
  current_stock: number;
  order_qty: number;
  unit_cost: number;
}

export interface DbInsuranceProvider {
  id: string;
  tenant_id: string;
  provider_name: string;
  code: string;
  contact_phone: string;
  coverage_ratio: number;
  pending_claims_count: number;
  total_claimed_amount: number;
  status: 'active' | 'under_review';
  created_at: string;
}

export interface DbFile {
  id: string;
  tenant_id: string;
  uploaded_by: string | null;
  original_name: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  status: FileStatus;
  checksum: string | null;
  retention_class: 'clinical' | 'financial' | 'export' | 'general';
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface DbExportJob {
  id: string;
  tenant_id: string;
  requested_by: string | null;
  scope: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  record_count: number | null;
  file_id: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DbAuditLog {
  id: string;
  tenant_id: string;
  performed_by: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Supabase Database type export (for createClient generic) ────────────────

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: DbTenant;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          location: string;
          contact_phone: string;
          contact_email: string;
          package_tier: PackageTier;
          max_users?: number;
          monthly_ugx_rate?: number;
          billing_status?: BillingStatus;
          next_billing_date?: string | null;
          nda_license_no?: string | null;
          nda_verified?: boolean;
          supervising_pharmacist?: string | null;
          allowed_features?: DbTenant['allowed_features'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
        Relationships: [];
      };
      users: {
        Row: DbUser;
        Insert: {
          id: string;
          tenant_id: string;
          full_name: string;
          email: string;
          phone: string;
          staff_reg_no?: string | null;
          rank_role: string;
          status?: UserStatus;
          access_rights?: DbUser['access_rights'];
          last_login?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'users_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      drugs: {
        Row: DbDrug;
        Insert: {
          id?: string;
          tenant_id: string;
          brand_name: string;
          generic_name: string;
          barcode: string;
          batch_number: string;
          category: DrugCategory;
          shelf_location: string;
          cost_price: number;
          selling_price: number;
          stock_qty?: number;
          reorder_level?: number;
          expiry_date: string;
          manufacturer: string;
          prescription_required?: boolean;
          unit: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drugs']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'drugs_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };
      stock_movements: {
        Row: DbStockMovement;
        Insert: {
          id?: string;
          tenant_id: string;
          drug_id: string;
          movement_type: 'sale' | 'restock' | 'adjustment' | 'write_off' | 'return';
          quantity_change: number;
          stock_before: number;
          stock_after: number;
          reference_id?: string | null;
          notes?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>;
        Relationships: [];
      };
      prescriptions: {
        Row: DbPrescription;
        Insert: {
          id?: string;
          tenant_id: string;
          rx_number: string;
          patient_name: string;
          patient_age?: number | null;
          patient_gender?: 'male' | 'female' | 'other' | null;
          patient_phone: string;
          doctor_name: string;
          doctor_licence: string;
          hospital_name: string;
          date?: string;
          status?: PrescriptionStatus;
          insurance_claim_id?: string | null;
          notes?: string | null;
          total_cost?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>;
        Relationships: [];
      };
      prescription_items: {
        Row: DbPrescriptionItem;
        Insert: {
          id?: string;
          prescription_id: string;
          tenant_id: string;
          drug_id?: string | null;
          drug_name: string;
          dosage: string;
          frequency: string;
          duration: string;
          quantity: number;
          unit_price?: number;
          dispensed_qty?: number;
          status?: 'pending' | 'dispensed';
        };
        Update: Partial<Database['public']['Tables']['prescription_items']['Insert']>;
        Relationships: [];
      };
      customers: {
        Row: DbCustomer;
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          phone: string;
          email?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          blood_group?: string | null;
          allergies?: string[];
          chronic_conditions?: string[];
          loyalty_points?: number;
          total_purchases_ugx?: number;
          last_visit?: string | null;
          insurance_provider?: string | null;
          policy_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
        Relationships: [];
      };
      pos_transactions: {
        Row: DbPOSTransaction;
        Insert: {
          id?: string;
          tenant_id: string;
          receipt_no: string;
          customer_name?: string;
          customer_phone?: string | null;
          subtotal?: number;
          tax_amount?: number;
          discount_amount?: number;
          insurance_copay_amount?: number;
          insurance_covered_amount?: number;
          total_paid: number;
          payment_method: string;
          mpesa_ref?: string | null;
          cashier_id?: string | null;
          cashier_name: string;
          timestamp: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pos_transactions']['Insert']>;
        Relationships: [];
      };
      pos_transaction_items: {
        Row: DbPOSTransactionItem;
        Insert: {
          id?: string;
          transaction_id: string;
          tenant_id: string;
          drug_id?: string | null;
          brand_name: string;
          unit_price: number;
          quantity: number;
          total: number;
          is_prescription?: boolean;
        };
        Update: Partial<Database['public']['Tables']['pos_transaction_items']['Insert']>;
        Relationships: [];
      };
      purchase_orders: {
        Row: DbPurchaseOrder;
        Insert: {
          id?: string;
          tenant_id: string;
          po_number: string;
          supplier_name: string;
          supplier_email: string;
          status?: POStatus;
          total_amount?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchase_orders']['Insert']>;
        Relationships: [];
      };
      purchase_order_items: {
        Row: DbPurchaseOrderItem;
        Insert: {
          id?: string;
          purchase_order_id: string;
          drug_id?: string | null;
          brand_name: string;
          current_stock?: number;
          order_qty: number;
          unit_cost?: number;
        };
        Update: Partial<Database['public']['Tables']['purchase_order_items']['Insert']>;
        Relationships: [];
      };
      insurance_providers: {
        Row: DbInsuranceProvider;
        Insert: {
          id?: string;
          tenant_id: string;
          provider_name: string;
          code: string;
          contact_phone: string;
          coverage_ratio?: number;
          pending_claims_count?: number;
          total_claimed_amount?: number;
          status?: 'active' | 'under_review';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['insurance_providers']['Insert']>;
        Relationships: [];
      };
      files: {
        Row: DbFile;
        Insert: {
          id?: string;
          tenant_id: string;
          uploaded_by?: string | null;
          original_name: string;
          r2_key: string;
          mime_type: string;
          size_bytes: number;
          status?: FileStatus;
          checksum?: string | null;
          retention_class?: 'clinical' | 'financial' | 'export' | 'general';
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['files']['Insert']>;
        Relationships: [];
      };
      export_jobs: {
        Row: DbExportJob;
        Insert: {
          id?: string;
          tenant_id: string;
          requested_by?: string | null;
          scope: string;
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          record_count?: number | null;
          file_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['export_jobs']['Insert']>;
        Relationships: [];
      };
      audit_logs: {
        Row: DbAuditLog;
        Insert: {
          id?: string;
          tenant_id: string;
          performed_by?: string | null;
          action: AuditAction;
          entity_type: string;
          entity_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      decrement_drug_stock: {
        Args: {
          p_drug_id: string;
          p_quantity: number;
          p_tenant_id: string;
          p_reference_id: string;
          p_performed_by: string;
        };
        Returns: void;
      };
      increment_loyalty_points: {
        Args: {
          p_customer_id: string;
          p_points: number;
          p_purchase_amount: number;
        };
        Returns: void;
      };
      increment_insurance_claim: {
        Args: {
          p_provider_id: string;
          p_claim_amount: number;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
