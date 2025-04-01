
export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialties: string[] | null;
  branch_id?: string | null;  // Match the database column name
  branch_ids?: string[] | null; // Keep for backward compatibility
  branch_names?: string[] | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
}
