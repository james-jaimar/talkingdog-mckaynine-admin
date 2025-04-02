
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PuppyClassFields } from "@/components/handlers/form/PuppyClassFields";
import { HandlerPersonalInfoFields } from "@/components/handlers/form/HandlerPersonalInfoFields";
import { DogInfoFields } from "@/components/handlers/form/DogInfoFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { FormNavigation } from "@/components/forms/FormNavigation";

// Basic form schema - in a real app, this would be more comprehensive
const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  dogName: z.string().min(1, { message: "Dog's name is required" }),
  breed: z.string().min(1, { message: "Breed is required" }),
  dogDob: z.string().optional(),
  dogAge: z.number().optional(),
  // Additional fields from PuppyClassFields would be added here
});

type FormValues = z.infer<typeof formSchema>;

export default function PuppyClassForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dogName: "",
      breed: "",
      dogDob: "",
      dogAge: undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, this would submit to your backend
      console.log("Form data:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Form Submitted",
        description: "The puppy class registration has been submitted successfully.",
      });
      
      // Optionally redirect or reset form
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting the form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Puppy Class Registration - McKaynine Training Centre</title>
        <style type="text/css">{`
          @media print {
            header, footer, nav, .no-print {
              display: none !important;
            }
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <FormNavigation 
          title="Puppy Class Registration Form" 
          onPrint={handlePrint}
        />
        
        <div id="print-section" className="mb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="mb-4 w-full justify-start no-print">
                  <TabsTrigger value="form">Complete Form</TabsTrigger>
                  <TabsTrigger value="owner">Owner Information</TabsTrigger>
                  <TabsTrigger value="dog">Dog Information</TabsTrigger>
                  <TabsTrigger value="class">Class Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form">
                  <PuppyClassFields control={form.control} />
                </TabsContent>
                
                <TabsContent value="owner">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Handler Information</h3>
                    <HandlerPersonalInfoFields control={form.control} />
                  </div>
                </TabsContent>
                
                <TabsContent value="dog">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Dog Information</h3>
                    <DogInfoFields control={form.control} />
                  </div>
                </TabsContent>
                
                <TabsContent value="class">
                  <PuppyClassFields control={form.control} />
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2 pt-4 no-print">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="mckaynine"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Submit Registration
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
}
