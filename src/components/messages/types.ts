
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
  is_read?: boolean; // Add is_read field to our interface
  sender_name?: string; // Add sender_name field to our interface
}
