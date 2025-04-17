
export interface UserProfile {
  id: string;
  username?: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
  role: string; // Changed from optional to required
  created_at: string;
  app_id?: string | null;
  isCurrentUser?: boolean;
}
