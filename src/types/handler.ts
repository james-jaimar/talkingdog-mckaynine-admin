
// Define a type for the consent status values
export type ConsentStatus = 'yes' | 'no' | 'not_marked';

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
    created_at?: string;
    updated_at?: string;
  }>;
}
