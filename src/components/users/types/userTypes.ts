
export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  role: string;
  created_at: string;
  updated_at?: string;
  app_id?: string;
  isCurrentUser?: boolean;
}

export interface UserFormValues {
  email: string;
  fullName: string;
  role: string;
  password?: string;
}

export interface UserRoleChangeRequest {
  userId: string;
  role: string;
}
