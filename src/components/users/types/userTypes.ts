
export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  email: string;
  isCurrentUser: boolean;
}
