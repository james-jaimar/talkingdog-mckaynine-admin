
import { Button } from "@/components/ui/button";
import { Dog } from "lucide-react";
import { Link, useNavigate, useEffect } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  // Try to redirect to dashboard if on an unknown route
  useEffect(() => {
    // Check if we're at the root not-found page
    if (window.location.pathname === "/404") {
      // Wait a moment and redirect to dashboard
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="mx-auto max-w-md text-center">
        <Dog className="mx-auto h-20 w-20 text-mckaynine-600" />
        <h1 className="mt-4 text-4xl font-bold">404 - Page Not Found</h1>
        <p className="mt-2 text-lg text-gray-600">
          Oops! It seems this page has wandered off. Let's get you back on track.
        </p>
        <Button asChild className="mt-6 bg-mckaynine-600 hover:bg-mckaynine-700">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
