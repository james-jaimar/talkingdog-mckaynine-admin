
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AddTrainerFormProps {
  onSuccess: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  bio: z.string().optional(),
  branchId: z.string().optional(),
  specialties: z.string().optional(),
});

export function AddTrainerForm({ onSuccess }: AddTrainerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch branches for dropdown
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name");
      
      if (error) throw error;
      return data;
    }
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      branchId: "",
      specialties: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Convert specialties string to array
      const specialtiesArray = values.specialties 
        ? values.specialties.split(",").map(s => s.trim()).filter(Boolean)
        : null;
      
      // Set branch_id to null if empty string or undefined
      const branchId = values.branchId && values.branchId.trim() !== "" ? values.branchId : null;
      
      const { error } = await supabase.from("trainers").insert({
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone: values.phone || null,
        bio: values.bio || null,
        branch_id: branchId,
        specialties: specialtiesArray,
      });
      
      if (error) {
        let errorMessage = "An unexpected error occurred.";
        
        // Handle specific error types with more user-friendly messages
        if (error.code === "23505" && error.message.includes("trainers_email_key")) {
          errorMessage = `A trainer with the email ${values.email} already exists.`;
        } else {
          console.error("Error details:", error);
          errorMessage = error.message || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Trainer added successfully",
        description: `${values.firstName} ${values.lastName} has been added as a trainer.`,
      });
      
      // Reset form
      form.reset();
      
      // Refresh trainers data
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      
      // Close modal via callback
      onSuccess();
    } catch (error) {
      console.error("Error adding trainer:", error);
      toast({
        title: "Failed to add trainer",
        description: error instanceof Error ? error.message : "Failed to add trainer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Jane" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jane.smith@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Use a non-empty string for the "None" option */}
                  <SelectItem value="none">None</SelectItem>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialties</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Agility, Obedience, Puppy Training (comma separated)" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about the trainer's experience and qualifications..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-mckaynine-600 hover:bg-mckaynine-700" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Trainer..." : "Add Trainer"}
        </Button>
      </form>
    </Form>
  );
}
