
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { HandlerPersonalInfoFields } from "./form/HandlerPersonalInfoFields";
import { DogInfoFields } from "./form/DogInfoFields";
import { PuppyClassFields } from "./form/PuppyClassFields";
import { ClassAndPreferencesFields } from "./form/ClassAndPreferencesFields";
import { Separator } from "@/components/ui/separator";
import { useAddHandlerForm } from "./hooks/add-handler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddHandlerFormProps {
  onSuccess: () => void;
}

export function AddHandlerForm({ onSuccess }: AddHandlerFormProps) {
  const { form, isSubmitting, errorMessage, onSubmit } = useAddHandlerForm(onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="puppy">Puppy Class</TabsTrigger>
            <TabsTrigger value="classes">Classes & Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 pt-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Handler Information</h3>
              <HandlerPersonalInfoFields control={form.control} />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Dog Information</h3>
              <DogInfoFields control={form.control} />
            </div>
          </TabsContent>
          
          <TabsContent value="puppy" className="pt-4">
            <PuppyClassFields control={form.control} />
          </TabsContent>
          
          <TabsContent value="classes" className="pt-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Class & Preferences</h3>
              <ClassAndPreferencesFields control={form.control} />
            </div>
          </TabsContent>
        </Tabs>

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
