
export interface ClientMessage {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  is_from_client: boolean;
  created_at: string;
  updated_at?: string;
  sender_name?: string;
  profiles?: {
    full_name?: string;
  };
}

// Type for inserting new messages
export type ClientMessagesInsert = Omit<ClientMessage, 'id' | 'created_at' | 'updated_at'>;
