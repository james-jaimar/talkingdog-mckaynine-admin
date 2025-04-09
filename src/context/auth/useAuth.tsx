
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return {
    ...context,
    // Additional derived properties for convenience
    user: context.user,
    isAdmin: context.isAdmin,
    isTrainer: context.isTrainer,
    isHandler: context.isHandler,
    isLoading: context.isLoading,
  };
}

export default useAuth;
