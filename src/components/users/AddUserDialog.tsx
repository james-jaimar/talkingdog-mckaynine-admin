
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { APP_ID } from "@/constants/app";

// Form validation schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
  role: z.string().default("user"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "user",
    },
  });
  
  const handleAddUser = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Creating user with role:", values.role);
      
      // Step 1: Create user with Supabase Auth
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName || "" },
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (signUpError) throw signUpError;
      
      const userId = data.user?.id;
      if (!userId) throw new Error("User creation failed - no user ID returned");
      
      console.log("User created successfully with ID:", userId);
      
      // Step 2: Update profile with role and app_id
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: values.email,
          full_name: values.fullName || "",
          role: values.role,
          app_id: APP_ID,
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      console.log("Profile updated successfully with role:", values.role);
      
      // Step 3: Handle trainer role specific logic
      const isTrainerRole = values.role === 'trainer' || values.role.includes('trainer');
      if (isTrainerRole) {
        await createTrainerRecord(userId, values.email, values.fullName || "");
      }
      
      // Handle success
      toast({
        title: "User added successfully",
        description: `${values.email} has been added with role: ${values.role}`,
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Refresh data
      invalidateAndRefetchQueries();
      onUserAdded();
      
    } catch (error: any) {
      toast({
        title: "Failed to add user",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Error adding user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to create trainer record
  async function createTrainerRecord(userId: string, email: string, fullName: string) {
    try {
      console.log("Adding user to trainers table");
      
      // Parse the name for first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Check if this user already exists in the trainers table
      const { data: existingTrainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', userId);
      
      // Only create a new trainer record if one doesn't exist
      if (!existingTrainer || existingTrainer.length === 0) {
        const { error: trainerError } = await supabase
          .from('trainers')
          .insert({
            user_id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            specialties: []
          });
        
        if (trainerError) {
          console.error("Error adding user to trainers table:", trainerError);
          throw trainerError;
        }
        
        console.log("User successfully added to trainers table");
      } else {
        console.log("Trainer record already exists for user, skipping creation");
      }
    } catch (error) {
      console.error("Error creating trainer record:", error);
      throw error;
    }
  }
  
  // Helper function to invalidate and refetch queries
  function invalidateAndRefetchQueries() {
    const queriesToInvalidate = [
      'admin-users', 
      'admin-users-list', 
      'trainers-list'
    ];
    
    queriesToInvalidate.forEach(query => {
      queryClient.invalidateQueries({ queryKey: [query] });
      setTimeout(() => queryClient.refetchQueries({ queryKey: [query] }), 300);
    });
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with specific permissions
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="handler">Handler</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
