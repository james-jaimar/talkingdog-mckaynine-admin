import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { useBusinessTransactions } from "@/hooks/useBusinessTransactions";
import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BookkeepingSummaryProps {
  month: number;
  year: number;
  monthLabel: string;
}

const EXPENSE_COLOR = "hsl(0, 72%, 51%)";
const INCOME_COLOR = "hsl(142, 71%, 45%)";

export function BookkeepingSummary({ month, year, monthLabel }: BookkeepingSummaryProps) {
  const { data: expenses = [], isLoading: loadingExpenses } = useBusinessTransactions({ month, year, type: 'expense' });
  const { data: income = [], isLoading: loadingIncome } = useBusinessTransactions({ month, year, type: 'income' });

  if (loadingExpenses || loadingIncome) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpenses;

  // Category breakdown
  const categoryMap = new Map<string, { amount: number; type: string }>();
  [...expenses, ...income].forEach(t => {
    const existing = categoryMap.get(t.category);
    categoryMap.set(t.category, {
      amount: (existing?.amount || 0) + t.amount,
      type: t.type,
    });
  });

  const chartData = Array.from(categoryMap.entries())
    .map(([name, { amount, type }]) => ({ name, amount, type }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Other Income</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">{income.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="h-4 w-4" />
              <p className="text-sm font-medium text-muted-foreground">Net</p>
            </div>
            <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(net)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Income minus Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown - {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.type === 'income' ? INCOME_COLOR : EXPENSE_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
