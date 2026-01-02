
// Define a type for the consent status values
export type ConsentStatus = 'yes' | 'no' | 'not_marked';

// Define enrollment registration type
export interface EnrollmentRegistration {
  id: string;
  class_type: string;
  class_type_other?: string | null;
  heard_from?: unknown; // JSON type from database
  whatsapp_permission?: string;
  photo_permission?: string;
  vet_clearance_url?: string | null;
  signature_name?: string;
  signature_date?: string;
  status?: string;
  submitted_at?: string;
  created_at: string;
  dogs?: {
    id: string;
    name: string;
  };
}

// Define a type for the handler/client data
export interface HandlerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string;
  occupation?: string;
  vet_name?: string;
  account_holder_name?: string;
  uses_whatsapp_status: ConsentStatus;
  social_media_consent_status: ConsentStatus;
  created_at: string;
  updated_at: string;
  dogs?: Array<{
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
    date_of_birth?: string;
    gender?: string;
    spay_neuter_status?: string;
    acquired_from?: string;
    acquired_from_other?: string;
    age_at_acquisition?: string;
    other_pets?: unknown; // JSON type from database
    children_at_home?: string;
    social_behavior?: unknown; // JSON type from database
    social_behavior_details?: string;
    training_goal?: string;
    has_behavior_problems?: boolean;
    behavior_problems_details?: string;
    has_health_problems?: boolean;
    health_problems_details?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  enrollment_registrations?: EnrollmentRegistration[];
}
