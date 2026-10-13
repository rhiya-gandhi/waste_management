// Database types representing the Supabase PostgreSQL schema for WasteRoute

export type UserRole = 'generator' | 'collector' | 'recycler' | 'admin';

export type RecyclerVerificationStatus = 'pending' | 'verified' | 'rejected';

export type MaterialCategory =
  | 'plastic'
  | 'paper_cardboard'
  | 'metal'
  | 'glass'
  | 'e_waste'
  | 'organic'
  | 'textile'
  | 'other';

export type BatchStatus =
  | 'draft'
  | 'available'
  | 'collection_requested'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'confirmed'
  | 'cancelled';

export type CollectionStatus =
  | 'requested'
  | 'accepted'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type WasteCondition = 'clean' | 'lightly_soiled' | 'heavily_soiled' | 'mixed';

export type QuantityUnit = 'kg' | 'tonnes' | 'items' | 'bags';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  address_line?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecyclerFacility {
  id: string;
  user_id: string;
  facility_name: string;
  business_reg_number: string;
  verification_status: RecyclerVerificationStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  facility_address: string;
  latitude: number;
  longitude: number;
  max_distance_km: number;
  contact_phone?: string | null;
  contact_email?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  accepted_materials?: AcceptedMaterial[];
  profile?: Profile;
}

export interface AcceptedMaterial {
  id: string;
  recycler_id: string;
  material_category: MaterialCategory;
  specific_subtypes: string[];
  max_contamination_percent: number;
  min_quantity_kg: number;
  max_quantity_kg?: number | null;
  accepts_pickup: boolean;
  accepts_dropoff: boolean;
  price_per_kg: number;
  handling_notes?: string | null;
  created_at: string;
}

export interface WasteBatch {
  id: string;
  generator_id: string;
  title: string;
  material_category: MaterialCategory;
  quantity: number;
  unit: QuantityUnit;
  estimated_contamination_percent: number;
  condition_description: WasteCondition;
  readiness: 'immediate' | 'scheduled';
  pickup_window_start?: string | null;
  pickup_window_end?: string | null;
  pickup_address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: BatchStatus;
  image_url?: string | null;
  ai_classification_result?: AIClassificationResult | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  generator?: Profile;
}

export interface AIClassificationResult {
  model_name: string;
  model_version?: string;
  detected_class: string;
  mapped_category: MaterialCategory;
  raw_confidence_score: number;
  is_mixed: boolean;
  contamination_assessment: string;
  consent_given: boolean;
  user_corrected: boolean;
  original_detected_class?: string;
  processed_at: string;
}

export interface CollectionRequest {
  id: string;
  batch_id: string;
  collector_id?: string | null;
  recycler_id: string;
  status: CollectionStatus;
  scheduled_pickup_at?: string | null;
  actual_pickup_at?: string | null;
  delivered_at?: string | null;
  collector_notes?: string | null;
  evidence_image_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  batch?: WasteBatch;
  collector?: Profile;
  recycler?: RecyclerFacility;
}

export interface HandoverRecord {
  id: string;
  collection_request_id: string;
  batch_id: string;
  recycler_id: string;
  collector_id?: string | null;
  received_quantity: number;
  quantity_unit: string;
  assessed_contamination_percent: number;
  quality_accepted: boolean;
  rejection_reason?: string | null;
  evidence_image_url?: string | null;
  digital_signature_or_code?: string | null;
  confirmed_at: string;
  created_at: string;
}

export interface WasteStatusHistory {
  id: string;
  batch_id: string;
  previous_status?: string | null;
  new_status: string;
  changed_by: string;
  role_at_change: string;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  // Joined
  actor?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}
