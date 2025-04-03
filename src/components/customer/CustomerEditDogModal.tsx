
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dogFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  breed: z.string().min(1, "Breed is required"),
  age: z.string().optional(),
  weight: z.string().optional(),
  date_of_birth: z.string().optional(),
  notes: z.string().optional(),
  behavior_notes: z.string().optional(),
  medical_notes: z.string().optional(),
});

type DogFormValues = z.infer<typeof dogFormSchema>;

interface Dog {
  id: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  date_of_birth?: string;
  notes?: string;
  behavior_notes?: string;
  medical_notes?: string;
  avatar_url?: string;
}

interface CustomerEditDogModalProps {
  dog: Dog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerEditDogModal({
  dog,
  open,
  onOpenChange,
  onSuccess,
}: CustomerEditDogModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DogFormValues>({
    resolver: zodResolver(dogFormSchema),
    defaultValues: {
      name: dog.name || "",
      breed: dog.breed || "",
      age: dog.age?.toString() || "",
      weight: dog.weight?.toString() || "",
      date_of_birth: dog.date_of_birth ? new Date(dog.date_of_birth).toISOString().split('T')[0] : "",
      notes: dog.notes || "",
      behavior_notes: dog.behavior_notes || "",
      medical_notes: dog.medical_notes || "",
    },
  });

  const onSubmit = async (data: DogFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Convert string values to numbers where needed
      const age = data.age ? parseFloat(data.age) : null;
      const weight = data.weight ? parseFloat(data.weight) : null;
      
      const { error } = await supabase
        .from('dogs')
        .update({
          name: data.name,
          breed: data.breed,
          age,
          weight,
          date_of_birth: data.date_of_birth || null,
          notes: data.notes,
          behavior_notes: data.behavior_notes,
          medical_notes: data.medical_notes,
        })
        .eq('id', dog.id);
        
      if (error) throw error;
      
      toast({
        title: "Dog updated",
        description: `${data.name}'s information has been updated successfully.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error updating dog:", error);
      toast({
        title: "Error updating dog",
        description: "There was a problem updating your dog's information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dog Information</DialogTitle>
          <DialogDescription>
            Update the details for {dog.name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (years)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" />
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
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
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
                          placeholder="Any general notes about your dog"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="behavior" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="behavior_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Behavior Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Any notes about your dog's behavior, temperament, or training progress"
                          className="min-h-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="medical" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="medical_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Any notes about your dog's health, medications, or special needs"
                          className="min-h-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="mckaynine"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
