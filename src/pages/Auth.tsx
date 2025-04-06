
import { ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true, state: { from: location } });
    }
  }, [user, isLoading, navigate, location]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
