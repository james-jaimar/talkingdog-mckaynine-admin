
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";
import { getBranchLogo, getBranchDisplayName } from "@/lib/branchLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, ArrowRight, Dog } from "lucide-react";
import { toast } from "sonner";

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, isHandler, role } = useAuth();
  const navigate = useNavigate();

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

  // Add effect to redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("CustomerLogin - User authenticated, role:", role, "isHandler:", isHandler);
      navigate("/customer/dashboard");
    }
  }, [user, navigate, role, isHandler]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Welcome back!", {
          description: "You have been logged in successfully.",
        });
        navigate("/customer/dashboard");
      } else {
        setError(result.error || "An error occurred while logging in.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-customer-bg via-customer-bg to-customer-accent/5 p-4">
      <Helmet>
        <title>Handler Login - McKaynine Training Centre</title>
        <meta name="description" content="Login to your McKaynine Training Centre handler account to manage your dogs, view classes, and communicate with trainers." />
      </Helmet>
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-customer-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-customer-warm/10 rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-4 overflow-hidden">
            <img 
              src={logoSrc}
              alt={logoAlt}
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{logoAlt}</h1>
          <p className="text-muted-foreground mt-1">Handler Portal</p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-customer-accent/10 flex items-center justify-center mb-3">
              <Dog className="h-6 w-6 text-customer-accent" />
            </div>
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your training dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="pl-10 h-11 bg-background/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-customer-accent hover:text-customer-accent/80 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="pl-10 h-11 bg-background/50"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 bg-customer-accent hover:bg-customer-accent/90 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
            
            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground">
                Need help accessing your account? Contact your trainer or{" "}
                <a 
                  href="mailto:support@mckaynine.co.za" 
                  className="text-customer-accent hover:underline"
                >
                  support@mckaynine.co.za
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Admin Login Link */}
        <div className="text-center mt-6">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Staff Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
