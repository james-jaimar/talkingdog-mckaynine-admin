
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SignUpFormProps {
  isLoading: boolean;
  onSubmit: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error: string | null }>;
}

export function SignUpForm({ isLoading, onSubmit }: SignUpFormProps) {
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
