import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminPayments, useAdminPaymentMutation } from "@/hooks/useAdminPayments";
import { Loader2, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { MonthSelector } from "./MonthSelector";
import { AdminPaymentDialog } from "./AdminPaymentDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/context/BranchContext";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminPaymentsTab() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const { data: adminData, isLoading, error } = useAdminPayments({
    month: selectedMonth,
    year: selectedYear
  });
  const { upsertPayment } = useAdminPaymentMutation();

  const handleSavePayment = async (payment: {
    amountPaid: number;
    paymentDate?: string;
    paymentReference?: string;
    paymentMethod?: string;
    notes?: string;
    status: 'pending' | 'partial' | 'paid';
  }) => {
    if (!adminData) return;

    try {
      await upsertPayment({
        month: selectedMonth,
        year: selectedYear,
        totalAdminFees: adminData.totalAdminFees,
        ...payment
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-payments-data', currentBranch?.id, selectedMonth, selectedYear]
      });

      toast.success("Admin fee payment recorded successfully!");
    } catch (error) {
      console.error("Error saving admin payment:", error);
      toast.error("Failed to save payment");
      throw error;
    }
  };

  const getPaymentStatusBadge = () => {
    if (!adminData?.paymentStatus) {
      return (
        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
          <Clock className="h-3 w-3" />
          Not Recorded
        </Badge>
      );
    }

    switch (adminData.paymentStatus.status) {
      case 'paid':
        return (
          <Badge className="gap-1 bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 bg-blue-50">
            <AlertCircle className="h-3 w-3" />
            Partial ({formatCurrency(adminData.paymentStatus.amountPaid)})
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading admin fee data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading admin fee data</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthLabel = adminData?.monthLabel || '';
  const totalDue = adminData?.totalAdminFees || 0;
  const amountPaid = adminData?.paymentStatus?.amountPaid || 0;
  const balance = Math.max(0, totalDue - amountPaid);
  const isPaid = adminData?.paymentStatus?.status === 'paid';
  const isPartial = adminData?.paymentStatus?.status === 'partial';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>Admin Fee Payments - {monthLabel}</CardTitle>
              {getPaymentStatusBadge()}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MonthSelector
                month={selectedMonth}
                year={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(true)}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!adminData?.classes || adminData.classes.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-muted-foreground font-medium">No admin fees for {monthLabel}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Classes with revenue during this month will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Total Admin Fees</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalDue)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Amount Paid</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(amountPaid)}
                  </p>
                </div>
                {isPaid ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 lg:col-span-2">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-green-900">Paid in Full</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(0)}</p>
                    {adminData.paymentStatus?.paymentDate && (
                      <p className="text-xs text-green-700 mt-1">
                        Paid on {new Date(adminData.paymentStatus.paymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : isPartial ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 lg:col-span-2">
                    <h3 className="font-semibold text-blue-900">Balance Outstanding</h3>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance)}</p>
                    <p className="text-xs text-blue-700 mt-1">Paid: {formatCurrency(amountPaid)}</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 lg:col-span-2">
                    <h3 className="font-semibold text-amber-900">Balance Outstanding</h3>
                    <p className="text-xs text-amber-700 mb-1">No payment recorded</p>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalDue)}</p>
                  </div>
                )}
              </div>

              {/* Class Breakdown Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Admin Fee</TableHead>
                    <TableHead className="text-right">Admin Fee Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminData.classes.map((cls, index) => (
                    <TableRow key={index} isEven={index % 2 === 1}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cls.className}</p>
                          <p className="text-xs text-muted-foreground">{cls.classType}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(cls.revenue)}</TableCell>
                      <TableCell className="text-right">
                        {cls.adminFeeType === 'percentage' 
                          ? `${cls.adminFeeValue}%` 
                          : formatCurrency(cls.adminFeeValue)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cls.adminFeeTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalDue)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <AdminPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        totalDue={totalDue}
        currentPayment={adminData?.paymentStatus}
        onSave={handleSavePayment}
        monthLabel={monthLabel}
      />
    </div>
  );
}
