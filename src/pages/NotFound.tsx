
import { Button } from "@/components/ui/button";
import { Dog } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/auth";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, role } = useAuth();
  
  // Try to redirect to appropriate dashboard if on an unknown route
  useEffect(() => {
    // Skip redirection if we're at the explicit 404 page
    if (location.pathname === "/404") {
      return;
    }
    
    // Wait for auth to load before deciding where to redirect
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          // Redirect based on user role
          if (role === 'handler' || role === 'user') {
            navigate("/customer/dashboard");
          } else {
            navigate("/dashboard");
          }
        } else {
          // Not logged in, go to auth
          navigate("/auth");
        }
      }, 5000); // Give user 5 seconds to see the 404 page
      
      return () => clearTimeout(timer);
    }
  }, [navigate, isLoading, user, role, location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="mx-auto max-w-md text-center">
        <Dog className="mx-auto h-20 w-20 text-mckaynine-600" />
        <h1 className="mt-4 text-4xl font-bold">404 - Page Not Found</h1>
        <p className="mt-2 text-lg text-gray-600">
          Oops! It seems this page has wandered off. Let's get you back on track.
        </p>
        <Button asChild className="mt-6 bg-mckaynine-600 hover:bg-mckaynine-700">
          <Link to={user ? (role === 'handler' || role === 'user') ? "/customer/dashboard" : "/dashboard" : "/auth"}>
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
