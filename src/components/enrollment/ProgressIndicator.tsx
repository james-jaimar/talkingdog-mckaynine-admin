import { Check, PawPrint, User, Dog, Home, Target, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { number: 1, title: "Welcome", icon: <PawPrint className="h-4 w-4" /> },
  { number: 2, title: "Owner", icon: <User className="h-4 w-4" /> },
  { number: 3, title: "Your Pup", icon: <Dog className="h-4 w-4" /> },
  { number: 4, title: "Home Life", icon: <Home className="h-4 w-4" /> },
  { number: 5, title: "Health", icon: <Target className="h-4 w-4" /> },
  { number: 6, title: "Enroll", icon: <ClipboardList className="h-4 w-4" /> },
];

interface ProgressIndicatorProps {
  currentStep: number;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full py-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-initial">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  currentStep > step.number
                    ? "bg-green-500 border-green-500 text-white"
                    : currentStep === step.number
                    ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium hidden sm:block",
                  currentStep >= step.number
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-1 sm:mx-2">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    currentStep > step.number
                      ? "bg-green-500"
                      : "bg-muted-foreground/20"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile step label */}
      <div className="sm:hidden text-center mt-4">
        <span className="text-sm font-medium text-foreground">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
        </span>
      </div>
    </div>
  );
}
