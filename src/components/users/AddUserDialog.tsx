
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddUser = async () => {
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Use the standard signUp method instead of admin.createUser
      const { error: authError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (authError) throw authError;
      
      const userId = data.user?.id;
      
      if (!userId) {
        throw new Error("User creation failed - no user ID returned");
      }
      
      console.log("User created successfully with ID:", userId);
      
      // Explicitly create or update the profile record to ensure it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: email,
          full_name: fullName,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }
      
      // If the role is "handler", create a corresponding entry in the clients table
      if (role === "handler") {
        // First check if a client with this email already exists
        const { data: existingClient, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', email)
          .maybeSingle();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Error checking existing client:", checkError);
        }
        
        // Only create a new client record if one doesn't already exist
        if (!existingClient) {
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const { error: clientError } = await supabase
            .from('clients')
            .insert({
              email: email,
              first_name: firstName,
              last_name: lastName
            });
            
          if (clientError) {
            console.error("Error creating client record:", clientError);
            // Don't throw - we still want to show success for the user creation
            toast({
              title: "User created, but client record failed",
              description: "The user was created successfully, but there was an issue creating the client record.",
              variant: "default",
            });
          }
        }
      }
      
      // Success - clear form and close dialog
      toast({
        title: "User added",
        description: `${email} has been added with role: ${role}. User will need to verify their email.`,
      });
      
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("user");
      
      // Close dialog
      onOpenChange(false);
      
      // Force invalidate and refetch ALL user-related queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Add a small delay before refetching to ensure DB changes are visible
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['users-admin'] });
        onUserAdded(); // Call the callback as a backup
      }, 500);
      
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Failed to add user",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with a specific role.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="user@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              placeholder="John Doe" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="handler">Handler</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleAddUser} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
