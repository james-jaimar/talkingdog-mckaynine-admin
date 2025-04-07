
import { AlertCircle } from "lucide-react";

export function InvoiceItemEmptyState() {
  return (
    <div className="py-6 px-4 text-center bg-amber-50 rounded-md border border-amber-200">
      <div className="flex items-center justify-center mb-2">
        <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
        <p className="font-medium text-amber-700">No items found on this invoice</p>
      </div>
      <p className="text-sm text-amber-600">
        This invoice doesn't have any line items. If you created this invoice from a class booking,
        there might be an issue with the data connection. Try refreshing or check the invoice creation process.
      </p>
    </div>
  );
}
