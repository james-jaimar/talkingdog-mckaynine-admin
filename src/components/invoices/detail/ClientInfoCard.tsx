
import { Invoice } from "@/hooks/invoices/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ClientInfoCardProps {
  invoice: Invoice;
  onGeneratePDF: () => void;
}

export function ClientInfoCard({ invoice, onGeneratePDF }: ClientInfoCardProps) {
  return (
    <div className="bg-white p-6 rounded-md shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Client Information</h2>
      {invoice.client ? (
        <>
          <p className="font-medium">{invoice.client.first_name} {invoice.client.last_name}</p>
          <p className="text-gray-500">{invoice.client.email}</p>
          {invoice.client?.phone && (
            <p className="text-gray-500">{invoice.client.phone}</p>
          )}
          {invoice.client?.address && (
            <p className="text-gray-500">{invoice.client.address}</p>
          )}
          {invoice.client?.city && invoice.client?.postal_code && (
            <p className="text-gray-500">
              {invoice.client.city}, {invoice.client.postal_code}
            </p>
          )}
        </>
      ) : (
        <p className="text-gray-500">Client information unavailable</p>
      )}
      
      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={onGeneratePDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
