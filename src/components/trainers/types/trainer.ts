
export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  branch_ids: string[] | null;
  branch_names?: string[];
  specialties: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}
