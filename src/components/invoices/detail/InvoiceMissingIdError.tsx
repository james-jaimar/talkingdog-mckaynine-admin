
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function InvoiceMissingIdError() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Invoice ID is required.</AlertDescription>
      </Alert>
      <Button 
        variant="outline" 
        onClick={() => navigate('/invoices')} 
        className="mt-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Invoices
      </Button>
    </div>
  );
}
