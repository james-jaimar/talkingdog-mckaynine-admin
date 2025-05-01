
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentTrackerProps {
  step: 'processing' | 'pdf' | 'email' | 'database' | 'complete';
  sendEmail: boolean;
}

export function PaymentTracker({ step, sendEmail }: PaymentTrackerProps) {
  // Only show steps relevant to the payment flow
  const steps = [
    { id: 'processing', name: 'Processing Payment' },
    { id: 'pdf', name: 'Generating Payment Summary' },
    { id: 'email', name: 'Sending Email', hidden: !sendEmail },
    { id: 'database', name: 'Updating Records' },
    { id: 'complete', name: 'Complete' },
  ].filter(s => !s.hidden);
  
  return (
    <div className="my-6">
      <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 space-x-2">
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isComplete = getStepValue(s.id) < getStepValue(step);
          
          return (
            <li key={s.id} className={cn(
              "flex items-center", 
              idx < steps.length - 1 ? "flex-1" : "")
            }>
              <div className="flex items-center justify-center w-full">
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors",
                  isComplete ? "bg-green-600" :
                  isActive ? "bg-blue-600" : "bg-gray-200"
                )}>
                  {isComplete ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <span className="text-xs text-gray-800">{idx + 1}</span>
                  )}
                </div>
                <div className="hidden sm:flex w-full bg-gray-200 h-0.5 ml-1">
                  {idx < steps.length - 1 && (
                    <div 
                      className={cn(
                        "h-0.5 transition-all duration-300",
                        isComplete ? "bg-green-600 w-full" : "w-0"
                      )}
                    />
                  )}
                </div>
              </div>
              <div className="mt-1 hidden sm:block">
                <span className={cn(
                  "text-xs",
                  isActive ? "text-blue-600 font-medium" : 
                  isComplete ? "text-green-600" : ""
                )}>
                  {s.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Helper to determine step ordering for comparison
function getStepValue(step: string): number {
  const order = {
    'processing': 1,
    'pdf': 2,
    'email': 3,
    'database': 4,
    'complete': 5,
  };
  return order[step as keyof typeof order] || 0;
}
