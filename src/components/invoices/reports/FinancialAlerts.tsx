
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProblematicInvoices } from "@/hooks/invoices/useProblematicInvoices";

interface FinancialAlertsProps {
  className?: string;
}

export function FinancialAlerts({ className }: FinancialAlertsProps) {
  const { data, isLoading } = useProblematicInvoices();
  const navigate = useNavigate();
  
  const problematicInvoicesCount = data?.count || 0;
  
  if (isLoading || problematicInvoicesCount === 0) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-amber-700">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
          Financial Data Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Unlinked Invoice Items Detected</AlertTitle>
          <AlertDescription className="text-amber-700">
            We found {problematicInvoicesCount} {problematicInvoicesCount === 1 ? 'invoice' : 'invoices'} with 
            items that aren't linked to bookings. These appear as "General Training Services" 
            in financial reports and calculations may be inaccurate.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p><Info className="h-4 w-4 inline mr-1" /> Items without booking links affect:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Class-specific revenue tracking</li>
            <li>Financial forecasting</li>
            <li>Tax calculations</li>
            <li>Trainer payment calculations</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="outline" 
          className="text-amber-700 border-amber-300 hover:bg-amber-50"
          onClick={() => navigate("/admin/problematic-invoices")}
        >
          View & Fix Issues
        </Button>
      </CardFooter>
    </Card>
  );
}
