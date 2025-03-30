
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Trainer } from "./types/trainer";
import { useTrainerForm } from "./hooks/useTrainerForm";
import { TrainerPersonalInfoFields } from "./form-sections/TrainerPersonalInfoFields";
import { TrainerSpecialtyFields } from "./form-sections/TrainerSpecialtyFields";
import { TrainerBioField } from "./form-sections/TrainerBioField";

interface EditTrainerFormProps {
  trainer: Trainer;
  onSuccess: () => void;
}

export function EditTrainerForm({ trainer, onSuccess }: EditTrainerFormProps) {
  const { form, isSubmitting, branches, isLoadingBranches, onSubmit } = useTrainerForm(trainer, onSuccess);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <TrainerPersonalInfoFields form={form} />
        <TrainerSpecialtyFields 
          form={form} 
          branches={branches} 
          isLoadingBranches={isLoadingBranches} 
        />
        <TrainerBioField form={form} />
        
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
