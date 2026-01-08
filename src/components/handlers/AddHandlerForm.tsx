
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { HandlerPersonalInfoFields } from "./form/HandlerPersonalInfoFields";
import { DogInfoFields } from "./form/DogInfoFields";
import { useAddHandlerForm } from "./hooks/add-handler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, FileText, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddHandlerFormProps {
  onSuccess: () => void;
}

export function AddHandlerForm({ onSuccess }: AddHandlerFormProps) {
  const { form, isSubmitting, errorMessage, onSubmit } = useAddHandlerForm(onSuccess);

  const handleOpenPuppyForm = () => {
    window.open('/customer/forms/puppy-class', '_blank');
  };

  return (
    <Tabs defaultValue="puppy-form" className="w-full">
      <TabsList className="mb-4 w-full justify-start">
        <TabsTrigger value="puppy-form" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Puppy Form
        </TabsTrigger>
        <TabsTrigger value="quick-add" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Quick Add
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="puppy-form" className="space-y-4 pt-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-mckaynine-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-mckaynine-600" />
          </div>
          <h3 className="text-lg font-semibold text-mckaynine-600">Full Puppy Class Registration</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Use this form to register a new handler with complete puppy class details including vaccination info, vet details, and behavior information.
          </p>
          <p className="text-sm text-muted-foreground">
            This opens the same form that handlers use, allowing you to fill it in on their behalf.
          </p>
          <Button
            type="button"
            variant="mckaynine"
            size="lg"
            onClick={handleOpenPuppyForm}
            className="mt-4"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Puppy Class Form
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="quick-add" className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Handler Information</h3>
              <HandlerPersonalInfoFields control={form.control} />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Dog Information</h3>
              <DogInfoFields control={form.control} />
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
      </TabsContent>
    </Tabs>
  );
}
