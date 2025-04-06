
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { Dog } from "lucide-react";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<string>("signin");
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

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
              <div className="bg-mckaynine-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Dog className="h-12 w-12 text-mckaynine-600" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              McKaynine Training Centre
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {activeTab === "signin" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="p-6">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup" className="p-6">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in or creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
