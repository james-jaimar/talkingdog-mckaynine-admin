
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
  const { user, login, signup, isLoading, isHandler } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Single, simple redirection effect
  useEffect(() => {
    // Only redirect when we have a user and auth loading is complete
    if (!isLoading && user) {
      // Get intended destination or use default based on role
      const from = location.state?.from?.pathname;
      const destination = isHandler ? "/customer/dashboard" : (from || "/dashboard");
      
      console.log(`Auth: Redirecting authenticated ${isHandler ? 'handler' : 'staff'} to ${destination}`);
      navigate(destination, { replace: true });
    }
  }, [user, isLoading, isHandler, navigate, location.state]);

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
