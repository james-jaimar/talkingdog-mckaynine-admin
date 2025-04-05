
export interface ClientMessage {
  id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_from_client: boolean;
  sender_id: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read?: boolean; // Explicitly added to match database schema
  sender_name?: string; // Keep the sender name field
}
