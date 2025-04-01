
import { Trainer } from "@/components/trainers/types/trainer";

export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  email?: string;
  trainer?: Trainer | null;
  app_id?: string;
  isCurrentUser?: boolean; // Added this property
};

// Types for Supabase user data
export type SupabaseUserMetadata = {
  app_id?: string;
  full_name?: string;
  [key: string]: any;
};

export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata: SupabaseUserMetadata;
  created_at?: string;
};

export type SupabaseUsersResponse = {
  users: SupabaseUser[];
};
