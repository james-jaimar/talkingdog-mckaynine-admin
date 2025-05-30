
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFranchiseClassesData } from "@/hooks/useFranchiseClassesData";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface FranchiseClassesReportProps {
  termId: string;
  termLabel: string;
}

export function FranchiseClassesReport({ termId, termLabel }: FranchiseClassesReportProps) {
  const { data: franchiseData, isLoading, error } = useFranchiseClassesData(termId);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading franchise report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading franchise report</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Term ID: {termId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!franchiseData?.classes || franchiseData.classes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Franchise Classes Report - {termLabel}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground font-medium">No classes found for the selected term.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This could mean:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside">
              <li>No classes are scheduled for this term</li>
              <li>No bookings exist for scheduled classes</li>
              <li>Classes exist but have no enrolled handlers</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
              Debug Info - Term ID: {termId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Franchise Classes Report - {termLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Revenue</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(franchiseData.reportTotals.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Franchise Fees</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(franchiseData.reportTotals.totalFranchiseFees)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Admin Fees</h3>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(franchiseData.reportTotals.totalAdminFees)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">McKaynine Commission</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(franchiseData.reportTotals.totalMckaynineCommission)}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {franchiseData.classes.map((classGroup, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classGroup.className}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {classGroup.classType} • Course Fee: {formatCurrency(classGroup.courseFee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Class Total: {formatCurrency(classGroup.classTotals.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">{classGroup.handlers.length} handlers</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Handler</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dog</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Invoice Amount</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Franchise Fee</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Admin Fee</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {classGroup.handlers.map((handler, handlerIndex) => (
                          <tr key={`${handler.clientId}-${handler.dogId}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{handler.clientName}</td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium">{handler.dogName}</p>
                                <p className="text-xs text-gray-500">{handler.dogBreed}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {handler.attendanceCount}/{handler.totalClasses}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                handler.paymentStatus === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {handler.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatCurrency(handler.invoiceAmount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(handler.franchiseFee)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(handler.adminFee)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(handler.mckaynineCommission)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Class Totals:</span>
                      <div className="flex space-x-8">
                        <span>Revenue: {formatCurrency(classGroup.classTotals.totalRevenue)}</span>
                        <span>Franchise: {formatCurrency(classGroup.classTotals.totalFranchiseFees)}</span>
                        <span>Admin: {formatCurrency(classGroup.classTotals.totalAdminFees)}</span>
                        <span>Commission: {formatCurrency(classGroup.classTotals.totalMckaynineCommission)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
