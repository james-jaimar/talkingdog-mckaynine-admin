
export interface Trainer {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  specialties?: string[];
  branch_id?: string | null;
  created_at: string;
  updated_at: string;
}
