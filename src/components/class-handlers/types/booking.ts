
export interface Booking {
  id: string;
  is_enrolled: boolean;
  vaccination_verified: boolean;
  proof_of_payment: string | null;
  additional_notes: string | null;
  info_eo: string | null;
  info_pg: string | null;
  class_schedule_id: string;
  class_id?: string; // ADDED: Needed for completion check in BookingRow
  dog_id?: string;
  client_id?: string;
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
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
    enrollment_verified?: boolean | null;
    vaccination_verified?: boolean | null;
  };
  computed_payment_status?: string;
  info_eo_status?: boolean | null;
  info_pg_status?: boolean | null;
  attendances?: any[];
}
