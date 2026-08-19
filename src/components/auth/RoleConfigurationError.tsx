import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";

export function RoleConfigurationError() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-background px-4 flex items-center justify-center">
      <section className="w-full max-w-lg border bg-card p-6 shadow-sm rounded-lg" aria-labelledby="access-heading">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-destructive/10 p-2 text-destructive" aria-hidden="true">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 id="access-heading" className="text-xl font-semibold text-foreground">Account access needs attention</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your sign-in was successful, but this account has not been assigned an access role. Please ask an administrator to check your account.
            </p>
            {user?.email && <p className="mt-3 break-all text-sm font-medium text-foreground">{user.email}</p>}
            <Button type="button" variant="outline" className="mt-6" onClick={() => void logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}