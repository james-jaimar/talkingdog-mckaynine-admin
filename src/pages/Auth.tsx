
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dog } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function Auth() {
  const { user, login, signup, isLoading, isHandler, role } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Single, simple redirection effect with added logging
  useEffect(() => {
    // Only redirect when we have a user and auth loading is complete
    if (!isLoading && user) {
      // IMPORTANT: Check both isHandler flag and explicit role for consistent behavior
      const userIsHandler = isHandler || role === 'handler';
      console.log("Auth page - User authenticated:", {
        userIsHandler,
        isHandler,
        role,
        path: location.pathname
      });
      
      // Simple redirection logic based on role
      if (userIsHandler) {
        console.log("Auth page - Redirecting handler to /customer/dashboard");
        navigate("/customer/dashboard", { replace: true });
      } else {
        console.log("Auth page - Redirecting staff to /dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, isLoading, isHandler, navigate, role, location]);

  return (
    <DashboardLayout requireAuth={false}>
      <Helmet>
        <title>Sign In - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto flex flex-col items-center justify-center py-12">
        <div className="mb-8 flex flex-col items-center">
          <Dog className="h-12 w-12 text-mckaynine-600" />
          <h1 className="mt-2 text-2xl font-bold text-mckaynine-700">McKaynine Training Centre</h1>
          <p className="text-gray-500">Sign in to access your account</p>
        </div>
        
        <Card className="w-full max-w-md">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <SignInForm isLoading={isLoading} onSubmit={login} />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm isLoading={isLoading} onSubmit={signup} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
