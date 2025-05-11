
import { createContext } from "react";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isPlatformAdmin: boolean; // New property
  isTrainer: boolean;
  isHandler: boolean;
  isBranchOwner: boolean; // New property
  isLoading: boolean;
  trainerProfile: any | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, options?: any) => Promise<any>;
  logout: () => Promise<any>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  isPlatformAdmin: false, // New property
  isTrainer: false,
  isHandler: false,
  isBranchOwner: false, // New property
  isLoading: true,
  trainerProfile: null,
  login: () => Promise.resolve({}),
  signup: () => Promise.resolve({}),
  logout: () => Promise.resolve({}),
});
