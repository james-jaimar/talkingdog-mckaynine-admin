
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { HandlerPersonalInfoFields } from "./form/HandlerPersonalInfoFields";
import { DogInfoFields } from "./form/DogInfoFields";
import { ClassAndPreferencesFields } from "./form/ClassAndPreferencesFields";
import { Separator } from "@/components/ui/separator";
import { useAddHandlerForm } from "./hooks/useAddHandlerForm";

interface AddHandlerFormProps {
  onSuccess: () => void;
}

export function AddHandlerForm({ onSuccess }: AddHandlerFormProps) {
  const { form, isSubmitting, onSubmit } = useAddHandlerForm(onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Handler Information</h3>
          <HandlerPersonalInfoFields control={form.control} />
        </div>
        
        <Separator className="my-6" />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Dog Information</h3>
          <DogInfoFields control={form.control} />
        </div>
        
        <Separator className="my-6" />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Class & Preferences</h3>
          <ClassAndPreferencesFields control={form.control} />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="mckaynine"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding Handler..." : "Add Handler"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
