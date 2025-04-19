
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassFinance } from "@/hooks/useClassFinancialData";
import { formatCurrency } from "@/lib/formatters";

interface ClassFinancialTableProps {
  classFinances: ClassFinance[];
  showInvoiceCount?: boolean;
}

export function ClassFinancialTable({ classFinances, showInvoiceCount = true }: ClassFinancialTableProps) {
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
            </TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.totalRevenue)}</TableCell>
            <TableCell className="text-right">{classItem.bookingsCount}</TableCell>
            {showInvoiceCount && (
              <TableCell className="text-right">{classItem.invoiceCount}</TableCell>
            )}
            <TableCell className="text-right">{formatCurrency(classItem.franchiseFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.adminFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.instructorFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(classItem.profit)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold bg-muted/50">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
          <TableCell className="text-right">{totals.bookings}</TableCell>
          {showInvoiceCount && (
            <TableCell className="text-right">{totals.invoices}</TableCell>
          )}
          <TableCell className="text-right">{formatCurrency(totals.franchise)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.admin)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.instructor)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.profit)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
