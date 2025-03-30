
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Dog's name is required" }),
  breed: z.string().min(1, { message: "Breed is required" }),
  age: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  notes: z.string().optional(),
  behavior_notes: z.string().optional(),
  medical_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDogFormProps {
  dog?: {
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
  };
  clientId: string;
  onSuccess?: () => void;
  isNew?: boolean;
}

export function EditDogForm({ dog, clientId, onSuccess, isNew = false }: EditDogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with dog data if editing, or empty if creating new
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: dog?.name || "",
      breed: dog?.breed || "",
      age: dog?.age || undefined,
      weight: dog?.weight || undefined,
      notes: dog?.notes || "",
      behavior_notes: dog?.behavior_notes || "",
      medical_notes: dog?.medical_notes || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isNew) {
        // Create new dog
        const { error } = await supabase.from("dogs").insert({
          name: values.name,
          breed: values.breed,
          age: values.age,
          weight: values.weight,
          notes: values.notes,
          behavior_notes: values.behavior_notes,
          medical_notes: values.medical_notes,
          client_id: clientId,
        });

        if (error) throw error;

        toast({
          title: "Dog added",
          description: "The new dog has been added successfully",
        });
      } else if (dog) {
        // Update existing dog
        const { error } = await supabase
          .from("dogs")
          .update({
            name: values.name,
            breed: values.breed,
            age: values.age,
            weight: values.weight,
            notes: values.notes,
            behavior_notes: values.behavior_notes,
            medical_notes: values.medical_notes,
          })
          .eq("id", dog.id);

        if (error) throw error;

        toast({
          title: "Dog updated",
          description: "The dog information has been updated successfully",
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving dog:", error);
      toast({
        variant: "destructive",
        title: "Failed to save dog",
        description: "There was an error saving the dog information",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dog's Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={4}
                      placeholder="General notes about the dog" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="behavior" className="space-y-4">
            <FormField
              control={form.control}
              name="behavior_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Behavior Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={8}
                      placeholder="Notes about the dog's behavior, training history, etc." 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="medical" className="space-y-4">
            <FormField
              control={form.control}
              name="medical_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={8}
                      placeholder="Medical history, allergies, medications, etc." 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNew ? "Add Dog" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
