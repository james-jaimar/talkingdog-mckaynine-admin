
export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialties: string[] | null;
  branch_id?: string | null;  // Legacy - kept for backwards compatibility
  branch_ids?: string[] | null; // Multiple branches from trainer_branches table
  branch_names?: string[] | null; // For display purposes - branch names
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  display_name?: string; // Added for consistent display
}
