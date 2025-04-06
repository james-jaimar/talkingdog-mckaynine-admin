import { ReactNode } from "react";
import { useAuth } from "@/context/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true, state: { from: location } });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <RequireAuth>
      {children}
    </RequireAuth>
  );
};

export default RequireAuth;
