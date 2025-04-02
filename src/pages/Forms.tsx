
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { FormSelector } from "@/components/forms/FormSelector";
import { Clipboard, FileText } from "lucide-react";

const formOptions = [
  {
    id: "puppy-class",
    title: "Puppy Class Registration",
    description: "Registration form for puppy training classes",
    summary: "Collect owner and puppy information for class enrollment",
    path: "/forms/puppy-class-registration",
    icon: <FileText className="h-5 w-5 mr-2 text-mckaynine-600" />,
    secondaryAction: {
      label: "View Submissions",
      path: "/handlers",
      icon: <Clipboard className="mr-2 h-4 w-4" />,
    },
  },
];

export default function Forms() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auth check and redirection
  useState(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  });

  if (!isAdmin) {
    return null; // Already redirected in useEffect
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Forms Management - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Forms Management</h1>
        
        <FormSelector forms={formOptions} />
        
        {/* Placeholder card for future forms */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
            {["Training Agreement", "Customer Feedback", "Behavior Assessment"].map((title, idx) => (
              <div 
                key={idx} 
                className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center"
              >
                <h3 className="font-medium text-gray-600">{title}</h3>
                <p className="text-sm text-gray-500 mt-2">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
