import { format } from "date-fns";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface HandlerDetail {
  handlerName: string;
  handlerEmail?: string;
  dogName?: string;
  dogBreed?: string;
  courseFee?: number;
  commissionAmount: number;
  paymentStatus?: string;
}

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
  handlers?: HandlerDetail[];
  isSubstitute?: boolean;
  substituteDates?: number;
  totalDates?: number;
  originalTrainerName?: string;
  substituteTrainerName?: string;
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
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

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

  const toggleClass = (index: number) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedClasses(new Set(classes.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedClasses(new Set());
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

      {/* Class Details - Expandable Cards */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-900">Class Details</h2>
          {classes.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Expand All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={collapseAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map((cls, index) => {
              const isExpanded = expandedClasses.has(index);
              const hasHandlers = cls.handlers && cls.handlers.length > 0;
              
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {/* Class Header */}
                  <div
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isExpanded ? "bg-blue-600 text-white" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleClass(index)}
                  >
                    <div className="flex items-center gap-2">
                      {hasHandlers ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      ) : (
                        <div className="w-4" />
                      )}
                      <div>
                        <p className="font-semibold">{cls.className}</p>
                        <p className={`text-xs ${isExpanded ? "text-blue-100" : "text-gray-500"}`}>
                          {cls.classDate} • {cls.bookingsCount} handler{cls.bookingsCount !== 1 ? "s" : ""}
                        </p>
                        {cls.isSubstitute && cls.originalTrainerName && (
                          <p className={`text-xs font-medium mt-0.5 ${isExpanded ? "text-yellow-200" : "text-amber-600"}`}>
                            Substitute for {cls.originalTrainerName}
                            {cls.substituteDates != null && cls.totalDates != null
                              ? ` (${cls.substituteDates} of ${cls.totalDates} dates)`
                              : ""}
                          </p>
                        )}
                        {!cls.isSubstitute && cls.substituteTrainerName && (
                          <p className={`text-xs font-medium mt-0.5 ${isExpanded ? "text-yellow-200" : "text-amber-600"}`}>
                            Subbed by {cls.substituteTrainerName}
                            {cls.substituteDates != null && cls.totalDates != null
                              ? ` (${cls.substituteDates} of ${cls.totalDates} dates)`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xs ${isExpanded ? "text-blue-100" : "text-gray-500"}`}>
                          Class Total
                        </p>
                        <p className="font-bold">{formatCurrency(cls.commissionAmount)}</p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                          isExpanded
                            ? cls.paymentStatus === "paid"
                              ? "bg-green-200 text-green-900"
                              : cls.paymentStatus === "partial"
                              ? "bg-yellow-200 text-yellow-900"
                              : "bg-red-200 text-red-900"
                            : getStatusColor(cls.paymentStatus)
                        }`}
                      >
                        {cls.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Handler Details */}
                  {isExpanded && hasHandlers && (
                    <div className="border-t">
                      <table className="w-full text-left">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase">Handler</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase">Dog</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase">Email</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase text-right">Course Fee</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase text-right">
                              <span className="text-green-600">Commission</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {cls.handlers!.map((handler, hIndex) => (
                            <tr key={hIndex} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {handler.handlerName}
                              </td>
                              <td className="px-3 py-2">
                                <span className="font-medium text-gray-900">{handler.dogName || "—"}</span>
                                {handler.dogBreed && (
                                  <span className="text-gray-500 text-xs ml-1">({handler.dogBreed})</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-600 text-xs">
                                {handler.handlerEmail || "—"}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-900">
                                {handler.courseFee ? formatCurrency(handler.courseFee) : "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-green-600">
                                {formatCurrency(handler.commissionAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 font-semibold text-gray-700">
                              Class Totals
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">
                              {formatCurrency(cls.handlers!.reduce((sum, h) => sum + (h.courseFee || 0), 0))}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-green-600">
                              {formatCurrency(cls.commissionAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Show message if no handlers */}
                  {isExpanded && !hasHandlers && (
                    <div className="p-4 text-center text-gray-500 border-t">
                      No handler details available for this class.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No class data available for this period.</p>
        )}
      </div>

      {/* Grand Total */}
      {classes.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Grand Total Commission</span>
          <span className="text-xl font-bold text-green-600">{formatCurrency(totalCommission)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 text-center text-xs text-gray-500">
        <p>Generated on {format(new Date(), "dd MMM yyyy 'at' HH:mm")}</p>
        <p className="mt-1">This is a preview. Click "Download PDF" to save a copy.</p>
      </div>
    </div>
  );
}
