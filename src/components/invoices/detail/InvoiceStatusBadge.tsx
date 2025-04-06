
import { InvoiceStatus } from "@/hooks/invoices/types";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusColors: { [key in InvoiceStatus]: string } = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-400 text-gray-900",
  };

  return (
    <div
      className={`px-2 py-1 rounded-full text-sm font-medium ${
        statusColors[status]
      }`}
    >
      {status}
    </div>
  );
}
