
import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Extended types for client_messages table to include is_read field
export interface ClientMessageWithReadStatus extends Database['public']['Tables']['client_messages']['Row'] {
  is_read?: boolean;
}

// Define RPC function signatures
export interface CustomSupabaseRPC {
  mark_messages_as_read: (params: { p_client_id: string; p_message_ids: string[] }) => Promise<{ data: null; error: null | Error }>;
  get_unread_message_count: (params: { p_client_id: string }) => Promise<{ data: number; error: null | Error }>;
  check_user_role: (params: { required_role: string }) => Promise<{ data: boolean; error: null | Error }>;
  is_trainer: (params: { user_id: string }) => Promise<{ data: boolean; error: null | Error }>;
}

// Define enhanced client type that includes our custom RPC functions
export interface EnhancedSupabaseClient extends SupabaseClient<Database> {
  rpc<T extends keyof CustomSupabaseRPC>(
    fn: T,
    params?: Parameters<CustomSupabaseRPC[T]>[0]
  ): ReturnType<CustomSupabaseRPC[T]>;
}

// Create a type guard to check if message has is_read property
export function hasReadStatus(message: any): message is ClientMessageWithReadStatus {
  return 'is_read' in message;
}
