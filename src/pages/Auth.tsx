
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dog } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { toast } from "sonner";

export default function Auth() {
  const { user, login, signup, isLoading, isAdmin, isTrainer, isHandler } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      toast.success("Login successful!");
      
      // Redirect based on user role
      if (isHandler) {
        console.log("Auth: Handler login detected, redirecting to customer dashboard");
        navigate("/customer/dashboard", { replace: true });
      } else if (isAdmin || isTrainer) {
        console.log("Auth: Staff login detected, redirecting to staff dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        // Default fallback if role is not recognized
        console.log("Auth: Unknown role, defaulting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate, isLoading, isAdmin, isTrainer, isHandler]);

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

interface SignInFormProps {
  isLoading: boolean;
  onSubmit: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
}

function SignInForm({ isLoading, onSubmit }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const result = await onSubmit(email, password);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your email and password to sign in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full bg-mckaynine-600 hover:bg-mckaynine-700" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </CardFooter>
    </form>
  );
}

interface SignUpFormProps {
  isLoading: boolean;
  onSubmit: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error: string | null }>;
}

function SignUpForm({ isLoading, onSubmit }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    try {
      const result = await onSubmit(email, password, { full_name: fullName });
      if (!result.success && result.error) {
        setError(result.error);
      } else {
        // Clear form fields after successful submission
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email-signup" className="text-sm font-medium">Email</label>
          <Input
            id="email-signup"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password-signup" className="text-sm font-medium">Password</label>
          <Input
            id="password-signup"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">Must be at least 6 characters</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full bg-mckaynine-600 hover:bg-mckaynine-700" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </CardFooter>
    </form>
  );
}
