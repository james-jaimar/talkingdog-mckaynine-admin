
import { formatCurrency } from "@/lib/formatters";

interface ClassExpenseBreakdown {
  className: string;
  adminFee: number;
  trainerFee: number;
  franchiseFee: number;
  totalRevenue: number;
}

interface Props {
  breakdowns: ClassExpenseBreakdown[];
}

export function ClassExpenseBreakdownTable({ breakdowns }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left">Class</th>
            <th className="px-2 py-2 text-center">Admin Fee</th>
            <th className="px-2 py-2 text-center">Trainer Fee</th>
            <th className="px-2 py-2 text-center">Franchise Fee</th>
            <th className="px-2 py-2 text-center">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {breakdowns.map((row) => (
            <tr key={row.className}>
              <td className="border-b px-2 py-1">{row.className}</td>
              <td className="border-b px-2 py-1 text-center text-blue-600 font-medium">{formatCurrency(row.adminFee)}</td>
              <td className="border-b px-2 py-1 text-center text-green-600 font-medium">{formatCurrency(row.trainerFee)}</td>
              <td className="border-b px-2 py-1 text-center text-amber-600 font-medium">{formatCurrency(row.franchiseFee)}</td>
              <td className="border-b px-2 py-1 text-center">{formatCurrency(row.totalRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
