
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoTab } from "./dog-form/BasicInfoTab";
import { BehaviorTab } from "./dog-form/BehaviorTab";
import { MedicalTab } from "./dog-form/MedicalTab";
import { FormActions } from "./dog-form/FormActions";
import { formSchema, type FormValues, type DogData } from "./dog-form/dogFormSchema";

interface EditDogFormProps {
  dog?: DogData;
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
      date_of_birth: dog?.date_of_birth || "",
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
          date_of_birth: values.date_of_birth,
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
      } else if (dog?.id) {
        // Update existing dog
        const { error } = await supabase
          .from("dogs")
          .update({
            name: values.name,
            breed: values.breed,
            age: values.age,
            weight: values.weight,
            date_of_birth: values.date_of_birth,
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

  const handleCancel = () => {
    if (onSuccess) onSuccess();
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
          
          <TabsContent value="basic">
            <BasicInfoTab control={form.control} />
          </TabsContent>
          
          <TabsContent value="behavior">
            <BehaviorTab control={form.control} />
          </TabsContent>
          
          <TabsContent value="medical">
            <MedicalTab control={form.control} />
          </TabsContent>
        </Tabs>

        <FormActions 
          isSubmitting={isSubmitting} 
          onCancel={handleCancel}
          isNew={isNew}
        />
      </form>
    </Form>
  );
}
