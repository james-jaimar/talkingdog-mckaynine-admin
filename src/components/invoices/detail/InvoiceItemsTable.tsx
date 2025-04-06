
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left">
          <th className="pb-2">Description</th>
          <th className="pb-2">Quantity</th>
          <th className="pb-2">Unit Price</th>
          <th className="pb-2 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items?.map((item) => {
          const booking = item.bookings;
          const classData = booking?.class_schedules?.classes;
          const dogName = booking?.dogs?.name;
          
          return (
            <tr key={item.id} className="border-t border-gray-200">
              <td className="py-4">
                <div>
                  <p className="font-medium">{item.description}</p>
                  {booking && (
                    <p className="text-xs text-gray-500">
                      {dogName && <span>Dog: {dogName} | </span>}
                      {classData && <span>Class: {classData.name}</span>}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-4">{item.quantity}</td>
              <td className="py-4">{formatCurrency(item.unit_price)}</td>
              <td className="py-4 text-right">{formatCurrency(item.amount)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
