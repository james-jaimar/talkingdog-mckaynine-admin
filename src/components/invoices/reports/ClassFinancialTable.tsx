
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ClassFinance } from "@/hooks/useClassFinancialData";
import { formatCurrency } from "@/lib/formatters";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClassFinancialTableProps {
  classFinances: ClassFinance[];
  showInvoiceCount?: boolean;
  totalRevenue?: number;
  showMismatchWarning?: boolean;
}

export function ClassFinancialTable({ 
  classFinances, 
  showInvoiceCount = true,
  totalRevenue,
  showMismatchWarning = false
}: ClassFinancialTableProps) {
  // Calculate totals for the summary row
  const totals = classFinances.reduce(
    (acc, curr) => ({
      revenue: acc.revenue + curr.totalRevenue,
      bookings: acc.bookings + curr.bookingsCount,
      franchise: acc.franchise + curr.franchiseFee,
      admin: acc.admin + curr.adminFee,
      instructor: acc.instructor + curr.instructorFee,
      profit: acc.profit + curr.profit,
      invoices: acc.invoices + curr.invoiceCount,
    }),
    { revenue: 0, bookings: 0, franchise: 0, admin: 0, instructor: 0, profit: 0, invoices: 0 }
  );

  // Calculate potential total discrepancy
  const calculatedDiscrepancy = totalRevenue && Math.abs(totalRevenue - totals.revenue) > 1
    ? totalRevenue - totals.revenue
    : 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Bookings</TableHead>
          {showInvoiceCount && (
            <TableHead className="text-right">Invoices</TableHead>
          )}
          <TableHead className="text-right">Franchise Fee</TableHead>
          <TableHead className="text-right">Admin Fee</TableHead>
          <TableHead className="text-right">Instructor Fee</TableHead>
          <TableHead className="text-right">Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classFinances.map((classItem) => (
          <TableRow key={classItem.className}>
            <TableCell className="font-medium">
              {classItem.className}
              {classItem.className === "General Training Services" && (
                <span className="ml-1 text-xs text-amber-600">(unassociated invoices)</span>
              )}
              {classItem.className === "Unallocated Revenue" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="ml-1 text-red-600 cursor-help inline-flex">
                        <AlertCircle className="h-4 w-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[280px] text-sm">
                        This represents revenue from invoices that couldn't be matched to any class.
                        It may be due to invoices without booking references or other data inconsistencies.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.totalRevenue)}</TableCell>
            <TableCell className="text-right">{classItem.bookingsCount}</TableCell>
            {showInvoiceCount && (
              <TableCell className="text-right">{classItem.invoiceCount}</TableCell>
            )}
            <TableCell className="text-right">{formatCurrency(classItem.franchiseFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.adminFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.instructorFee)}</TableCell>
            <TableCell className={`text-right font-medium ${classItem.profit < 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(classItem.profit)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="bg-muted/50">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">
            {formatCurrency(totals.revenue)}
            {showMismatchWarning && calculatedDiscrepancy !== 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="ml-1 text-red-600 cursor-help inline-flex">
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      There's a discrepancy of {formatCurrency(Math.abs(calculatedDiscrepancy))} 
                      compared to the total invoice revenue ({formatCurrency(totalRevenue || 0)}).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </TableCell>
          <TableCell className="text-right">{totals.bookings}</TableCell>
          {showInvoiceCount && (
            <TableCell className="text-right">{totals.invoices}</TableCell>
          )}
          <TableCell className="text-right">{formatCurrency(totals.franchise)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.admin)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.instructor)}</TableCell>
          <TableCell className={`text-right ${totals.profit < 0 ? 'text-red-600 font-semibold' : ''}`}>
            {formatCurrency(totals.profit)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
