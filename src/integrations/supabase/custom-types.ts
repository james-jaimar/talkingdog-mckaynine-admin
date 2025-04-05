
import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Extended types for client_messages table to include is_read field
export interface ClientMessageWithReadStatus {
  id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_from_client: boolean;
  sender_id: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read?: boolean; 
  sender_name?: string; 
}

// Define RPC function signatures
export interface CustomSupabaseRPC {
  mark_messages_as_read: (params: { p_client_id: string; p_message_ids: string[] }) => Promise<{ data: null; error: null | Error }>;
  get_unread_message_count: (params: { p_client_id: string }) => Promise<{ data: number; error: null | Error }>;
  check_user_role: (params: { required_role: string }) => Promise<{ data: boolean; error: null | Error }>;
  is_trainer: (params: { user_id: string }) => Promise<{ data: boolean; error: null | Error }>;
}

// Define enhanced client type that includes our custom RPC functions
export type EnhancedSupabaseClient = SupabaseClient<Database> & {
  rpc<T extends keyof CustomSupabaseRPC>(
    fn: T,
    params?: Parameters<CustomSupabaseRPC[T]>[0]
  ): ReturnType<CustomSupabaseRPC[T]>;
};

// Create a type guard to check if message has is_read property
export function hasReadStatus(message: any): message is ClientMessageWithReadStatus {
  return 'is_read' in message;
}
