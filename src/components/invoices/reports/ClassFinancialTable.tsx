
import { formatCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassFinance } from "@/hooks/useClassFinancialData";

interface ClassFinancialTableProps {
  classFinances: ClassFinance[];
}

export function ClassFinancialTable({ classFinances }: ClassFinancialTableProps) {
  // Calculate totals
  const totals = classFinances.reduce((acc, curr) => ({
    totalRevenue: acc.totalRevenue + curr.totalRevenue,
    bookingsCount: acc.bookingsCount + curr.bookingsCount,
    franchiseFee: acc.franchiseFee + curr.franchiseFee,
    adminFee: acc.adminFee + curr.adminFee,
    instructorFee: acc.instructorFee + curr.instructorFee,
    profit: acc.profit + curr.profit
  }), {
    totalRevenue: 0,
    bookingsCount: 0,
    franchiseFee: 0,
    adminFee: 0,
    instructorFee: 0,
    profit: 0
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
          <TableHead className="text-right">Total Revenue</TableHead>
          <TableHead className="text-right">Franchise Fee</TableHead>
          <TableHead className="text-right">Admin Fee</TableHead>
          <TableHead className="text-right">Instructor Fee</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Bookings</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classFinances.map((finance, index) => (
          <TableRow key={index}>
            <TableCell>{finance.className}</TableCell>
            <TableCell className="text-right">{formatCurrency(finance.totalRevenue)}</TableCell>
            <TableCell className="text-right">{formatCurrency(finance.franchiseFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(finance.adminFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(finance.instructorFee)}</TableCell>
            <TableCell className="text-right">{formatCurrency(finance.profit)}</TableCell>
            <TableCell className="text-right">{finance.bookingsCount}</TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.totalRevenue)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.franchiseFee)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.adminFee)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.instructorFee)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.profit)}</TableCell>
          <TableCell className="text-right">{totals.bookingsCount}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
