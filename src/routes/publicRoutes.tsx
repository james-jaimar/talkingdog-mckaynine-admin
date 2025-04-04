
import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Component to handle handler redirects - always redirect handlers to customer dashboard
export const HandlerRedirect = () => {
  const { isHandler } = useAuth();
  return <Navigate to={isHandler ? "/customer/dashboard" : "/dashboard"} replace />;
};

export const publicRoutes = [
  {
    path: "/",
    element: <HandlerRedirect />,
    errorElement: <NotFound />,
  },
  // Single auth route for all users
  {
    path: "/auth",
    element: <Auth />,
  },
  // Redirect old customer login route to unified auth page
  {
    path: "/customer/login",
    element: <Navigate to="/auth" replace />,
  },
];
