import { format } from "date-fns";

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
}

interface TrainerStatementHTMLPreviewProps {
  trainerName: string;
  trainerEmail: string;
  termInfo: string;
  dateRange: { from: Date; to: Date };
  totalCommission: number;
  totalPaid: number;
  outstanding: number;
  classes: ClassDetail[];
  branchName: string;
}

export function TrainerStatementHTMLPreview({
  trainerName,
  trainerEmail,
  termInfo,
  dateRange,
  totalCommission,
  totalPaid,
  outstanding,
  classes,
  branchName,
}: TrainerStatementHTMLPreviewProps) {
  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 space-y-6 text-sm">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">{branchName}</h1>
        <p className="text-gray-600">Trainer Payment Statement</p>
      </div>

      {/* Statement Period */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-2">Statement Period</h2>
        <p className="text-gray-700">{termInfo}</p>
        <p className="text-gray-600 text-xs mt-1">
          {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
        </p>
      </div>

      {/* Trainer Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Trainer</p>
          <p className="font-medium text-gray-900">{trainerName}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Email</p>
          <p className="text-gray-700">{trainerEmail}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Total Commission</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Already Paid</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Outstanding</p>
          <p className={`text-lg font-bold ${outstanding > 0 ? "text-red-600" : "text-gray-900"}`}>
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>

      {/* Classes Table */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Class Details</h2>
        {classes.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase">Class</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase text-center">Bookings</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase text-right">Commission</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.map((cls, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{cls.className}</td>
                    <td className="px-3 py-2 text-gray-600">{cls.classDate}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{cls.bookingsCount}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      {formatCurrency(cls.commissionAmount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusColor(cls.paymentStatus)}`}>
                        {cls.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-3 py-2" colSpan={3}>Total</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(totalCommission)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No class data available for this period.</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-xs text-gray-500">
        <p>Generated on {format(new Date(), "dd MMM yyyy 'at' HH:mm")}</p>
        <p className="mt-1">This is a preview. Click "Download PDF" to save a copy.</p>
      </div>
    </div>
  );
}
