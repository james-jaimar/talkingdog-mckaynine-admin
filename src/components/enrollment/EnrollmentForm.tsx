import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, ArrowRight, Check, PawPrint } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";
import { Step1Privacy, Step2Owner, Step3Dog, Step4Home, Step5Training, Step6Class } from "./steps";
import { useEnrollmentSubmission } from "./hooks/useEnrollmentSubmission";
import { 
  FullEnrollmentFormValues, 
  defaultFormValues,
  privacySchema,
  ownerSchema,
  dogSchema,
  homeSchema,
  trainingSchema,
  classSchema,
  fullEnrollmentSchema
} from "./types";

const stepSchemas = [
  privacySchema,
  ownerSchema,
  dogSchema,
  homeSchema,
  trainingSchema,
  classSchema,
];

export function EnrollmentForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { submitEnrollment } = useEnrollmentSubmission();

  const form = useForm<FullEnrollmentFormValues>({
    resolver: zodResolver(fullEnrollmentSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const validateCurrentStep = async () => {
    const schema = stepSchemas[currentStep - 1];
    const values = form.getValues();
    
    try {
      await schema.parseAsync(values);
      return true;
    } catch {
      // Trigger validation to show errors
      const fields = Object.keys(schema.shape);
      fields.forEach((field) => {
        form.trigger(field as any);
      });
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (data: FullEnrollmentFormValues) => {
    if (!uploadedFile) {
      toast.error("Please upload your vet clearance document");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitEnrollment(data, uploadedFile);
      console.log("Enrollment submitted successfully:", result);

      toast.success("Enrollment submitted successfully! We'll be in touch soon.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit enrollment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Privacy form={form} />;
      case 2: return <Step2Owner form={form} />;
      case 3: return <Step3Dog form={form} />;
      case 4: return <Step4Home form={form} />;
      case 5: return <Step5Training form={form} onFileUpload={handleFileUpload} uploadedFileName={uploadedFile?.name} onRemoveFile={handleRemoveFile} />;
      case 6: return <Step6Class form={form} branches={branches} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-customer-bg py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with decorative gradient */}
        <div className="relative mb-4 sm:mb-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-customer-accent/20 via-customer-accent/10 to-transparent rounded-2xl blur-xl" />
          <div className="relative flex items-center justify-center gap-3 py-3 sm:py-4">
            <div className="p-2 bg-customer-accent/10 rounded-xl">
              <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-customer-accent" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Class Registration</h1>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg bg-white">
          <div className="bg-gradient-to-r from-customer-accent/5 to-customer-accent/10 border-b border-customer-accent/10 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <ProgressIndicator currentStep={currentStep} />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-6 lg:p-8">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2 border-gray-200 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep < 6 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  className="gap-2 bg-customer-accent hover:bg-customer-accent/90 text-white"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="gap-2 bg-customer-accent hover:bg-customer-accent/90 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Submit Enrollment
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
