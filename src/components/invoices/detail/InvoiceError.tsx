
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface InvoiceErrorProps {
  error: Error | unknown;
  navigatePath?: string;
}

export function InvoiceError({ error, navigatePath = '/invoices' }: InvoiceErrorProps) {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-6">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load invoice details. Please try again later."}
        </AlertDescription>
      </Alert>
      <Button 
        variant="outline" 
        onClick={() => navigate(navigatePath)} 
        className="mt-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Invoices
      </Button>
    </div>
  );
}
