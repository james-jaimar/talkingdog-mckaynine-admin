
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function InvoiceItemEmptyState() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    // Force a hard refresh of the page
    window.location.reload();
  };

  return (
    <div className="py-6 px-4 text-center bg-amber-50 rounded-md border border-amber-200">
      <div className="flex items-center justify-center mb-2">
        <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
        <p className="font-medium text-amber-700">No items found on this invoice</p>
      </div>
      <p className="text-sm text-amber-600">
        This invoice doesn't have any line items. If this invoice was created from class bookings,
        there might be an issue with the data connection between your bookings and this invoice.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button size="sm" variant="outline" onClick={handleRefresh} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh page
        </Button>
      </div>
      <p className="text-xs text-amber-500 mt-4">
        If refreshing doesn't work, the booking data may be missing or incorrectly linked.
        Try editing the invoice to manually add items.
      </p>
    </div>
  );
}
