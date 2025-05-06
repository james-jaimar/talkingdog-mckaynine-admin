
import { DialogTrainerClassDetail } from "./types";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

interface PaymentDetailsPanelProps {
  classDetails: DialogTrainerClassDetail[];
}

export function PaymentDetailsPanel({ classDetails }: PaymentDetailsPanelProps) {
  // Calculate total revenue
  const totalRevenue = classDetails.reduce((sum, detail) => sum + detail.revenue, 0);
  
  // Calculate potential revenue (what could be earned)
  const potentialRevenue = classDetails.reduce((sum, detail) => sum + detail.potentialRevenue, 0);
  
  // Count total bookings
  const totalBookings = classDetails.reduce((sum, detail) => sum + detail.bookings, 0);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Classes</h3>
          <p className="text-2xl font-bold">{classDetails.length}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Bookings</h3>
          <p className="text-2xl font-bold">{totalBookings}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Revenue</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Potential Revenue</h3>
          <p className="text-2xl font-bold">{formatCurrency(potentialRevenue)}</p>
        </div>
      </div>
      
      <div className="mt-4 border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2">Class</th>
              <th className="text-center px-2 py-2">Date</th>
              <th className="text-right px-4 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {classDetails.map((detail) => (
              <tr key={detail.scheduleId}>
                <td className="px-4 py-2">{detail.className}</td>
                <td className="text-center px-2 py-2">
                  {new Date(detail.classDate).toLocaleDateString()}
                </td>
                <td className="text-right px-4 py-2">{formatCurrency(detail.potentialRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
