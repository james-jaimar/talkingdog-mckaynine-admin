
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  isCurrentUser?: boolean;
  app_id?: string;
}
