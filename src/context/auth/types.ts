
import { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  isTrainer: boolean;
  isHandler: boolean;
  isBranchOwner: boolean;
  isAssistant: boolean;
  trainerProfile: { id: string; first_name: string; last_name: string } | null;
  
  // Login, signup and logout functions
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signup: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<{ success: boolean; error: string | null }>;
}
