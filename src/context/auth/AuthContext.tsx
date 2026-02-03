
import { createContext } from "react";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  isTrainer: boolean;
  isHandler: boolean;
  isBranchOwner: boolean;
  isAssistant: boolean;
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
  isPlatformAdmin: false,
  isTrainer: false,
  isHandler: false,
  isBranchOwner: false,
  isAssistant: false,
  isLoading: true,
  trainerProfile: null,
  login: () => Promise.resolve({}),
  signup: () => Promise.resolve({}),
  logout: () => Promise.resolve({}),
});
