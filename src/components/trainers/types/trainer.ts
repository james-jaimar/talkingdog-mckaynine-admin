
export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialties: string[] | null;
  branch_ids: string[] | null;
  branch_names?: string[] | null; // Added branch_names as an optional property
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
