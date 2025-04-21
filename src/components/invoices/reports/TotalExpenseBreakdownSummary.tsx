
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  admin: number;
  trainer: number;
  franchise: number;
}

export function TotalExpenseBreakdownSummary({ admin, trainer, franchise }: Props) {
  const total = admin + trainer + franchise;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Expense Breakdown Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          <li>
            <span className="font-medium text-blue-600">Admin Fee: </span>
            {formatCurrency(admin)}
          </li>
          <li>
            <span className="font-medium text-green-600">Trainer Fee: </span>
            {formatCurrency(trainer)}
          </li>
          <li>
            <span className="font-medium text-amber-600">Franchise Fee: </span>
            {formatCurrency(franchise)}
          </li>
          <li className="mt-2">
            <span className="font-semibold">Total: </span>
            {formatCurrency(total)}
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
