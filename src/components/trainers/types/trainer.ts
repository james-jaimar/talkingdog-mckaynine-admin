
export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  branch_id: string | null;
  branch_name?: string;
  specialties: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}
