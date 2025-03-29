
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Trainer } from "./types/trainer";
import { trainerFormSchema, TrainerFormValues } from "./schemas/trainerFormSchema";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";

interface EditTrainerFormProps {
  trainer: Trainer;
  onSuccess: () => void;
}

export function EditTrainerForm({ trainer, onSuccess }: EditTrainerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<OptionType[]>([]);
  const [specialtyOptions, setSpecialtyOptions] = useState<OptionType[]>([
    { label: "Obedience Training", value: "Obedience Training" },
    { label: "Behavioral Correction", value: "Behavioral Correction" },
    { label: "Puppy Training", value: "Puppy Training" },
    { label: "Agility Training", value: "Agility Training" },
    { label: "Service Dog Training", value: "Service Dog Training" },
    { label: "Therapy Dog Training", value: "Therapy Dog Training" },
    { label: "Search & Rescue", value: "Search & Rescue" },
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .order("name");
      
      if (!error && data) {
        setBranches(data.map(branch => ({
          value: branch.id,
          label: branch.name
        })));
      }
    };
    
    fetchBranches();
  }, []);
  
  // Pre-populate form with trainer data
  const defaultValues: TrainerFormValues = {
    firstName: trainer.first_name,
    lastName: trainer.last_name,
    email: trainer.email,
    phone: trainer.phone || "",
    branchIds: trainer.branch_ids || [],
    specialties: trainer.specialties || [],
    bio: trainer.bio || "",
  };
  
  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues,
  });
  
  const onSubmit = async (values: TrainerFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("trainers")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: values.phone || null,
          branch_ids: values.branchIds.length > 0 ? values.branchIds : null,
          specialties: values.specialties.length > 0 ? values.specialties : null,
          bio: values.bio || null,
        })
        .eq("id", trainer.id);
      
      if (error) throw error;
      
      toast({
        title: "Trainer updated successfully",
        description: `${values.firstName} ${values.lastName}'s information has been updated.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      onSuccess();
    } catch (error) {
      console.error("Error updating trainer:", error);
      toast({
        title: "Failed to update trainer",
        description: String(error) || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Convert array of strings to array of OptionType objects for MultiSelect
  const specialtiesAsOptions = (specialties: string[]): OptionType[] => {
    return specialties.map(specialty => ({
      label: specialty,
      value: specialty
    }));
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
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
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
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
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="(123) 456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="branchIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branches</FormLabel>
              <FormControl>
                <MultiSelect
                  options={branches}
                  value={field.value.map(id => branches.find(b => b.value === id) || { value: id, label: "Unknown" })}
                  onChange={(selected) => field.onChange(selected.map(item => item.value))}
                  placeholder="Select branches"
                />
              </FormControl>
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
                <MultiSelect
                  options={specialtyOptions}
                  value={specialtiesAsOptions(field.value)}
                  onChange={(selected) => field.onChange(selected.map(item => item.value))}
                  placeholder="Select specialties"
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
                  placeholder="Trainer biography and experience..."
                  className="min-h-24"
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
          {isSubmitting ? "Updating Trainer..." : "Update Trainer"}
        </Button>
      </form>
    </Form>
  );
}
