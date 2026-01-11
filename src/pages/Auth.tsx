
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { Helmet } from "react-helmet";
import { useBranch } from "@/context/BranchContext";
import { getBranchLogo, getBranchDisplayName } from "@/lib/branchLogo";

export default function Auth() {
  const [authLoading, setAuthLoading] = useState(false);
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  
  // Get current branch for dynamic logo
  let branchName: string | null = null;
  try {
    const { currentBranch } = useBranch();
    branchName = currentBranch?.name || null;
  } catch {
    // BranchContext may not be available on login page
  }
  
  const logoSrc = getBranchLogo(branchName);
  const logoAlt = getBranchDisplayName(branchName);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  // Handle sign in submission
  const handleSignIn = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const result = await login(email, password);
      setAuthLoading(false);
      return result;
    } catch (error) {
      setAuthLoading(false);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>Authentication - McKaynine Training Centre</title>
      </Helmet>
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={logoSrc}
                alt={logoAlt}
                className="h-20 w-auto"
              />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {logoAlt} Training Centre
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <SignInForm isLoading={authLoading} onSubmit={handleSignIn} />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
