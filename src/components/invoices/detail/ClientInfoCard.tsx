
import { Invoice } from "@/hooks/invoices/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientInfoCardProps {
  invoice: Invoice;
  onGeneratePDF: () => void;
}

export function ClientInfoCard({ invoice, onGeneratePDF }: ClientInfoCardProps) {
  // Debug logging for client data
  console.log("ClientInfoCard rendering with invoice:", invoice);
  console.log("ClientInfoCard client data:", invoice.client);
  
  const noClientInfo = !invoice.client || 
    (invoice.client && !invoice.client.first_name && !invoice.client.last_name);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent>
        {!noClientInfo ? (
          <div className="space-y-2">
            <p className="font-medium text-lg">
              {invoice.client.first_name} {invoice.client.last_name}
            </p>
            {invoice.client.email && (
              <p className="text-gray-600">{invoice.client.email}</p>
            )}
            {invoice.client.phone && (
              <p className="text-gray-600">{invoice.client.phone}</p>
            )}
            {invoice.client.address && (
              <p className="text-gray-600">{invoice.client.address}</p>
            )}
            {invoice.client.city && invoice.client.postal_code && (
              <p className="text-gray-600">
                {invoice.client.city}, {invoice.client.postal_code}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-500 italic">Client information unavailable</p>
            <p className="text-xs text-red-500 mt-1">
              Client ID: {invoice.client_id || "Unknown"}
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={onGeneratePDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
