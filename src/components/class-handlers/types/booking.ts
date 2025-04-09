
export interface Booking {
  id: string;
  is_enrolled: boolean;
  vaccination_verified: boolean;
  proof_of_payment: string | null;
  additional_notes: string | null;
  info_eo: string | null;
  uses_whatsapp: boolean;
  social_media_consent: boolean;
  info_pg: string | null;
  class_schedule_id: string;
  dog_id?: string;  // Make these optional
  client_id?: string; // Make these optional
  status: string;
  payment_status: string;
  dogs?: {
    id: string;
    name: string;
    breed: string;
  };
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  computed_payment_status?: string; // Add this property
}
