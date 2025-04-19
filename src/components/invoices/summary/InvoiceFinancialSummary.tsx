
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DollarSign, BadgePercent, AlertCircle } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface FinancialSummaryProps {
  invoices: Invoice[];
  currentMonthLabel: string;
}

export function InvoiceFinancialSummary({ invoices, currentMonthLabel }: FinancialSummaryProps) {
  const calculateFinancialSummary = () => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = invoices.reduce((sum, invoice) => 
      invoice.status === 'paid' ? sum + invoice.total : sum, 0);
    const outstandingAmount = invoices.reduce((sum, invoice) => 
      (invoice.status === 'sent' || invoice.status === 'overdue') ? sum + invoice.total : sum, 0);
    const overdueAmount = invoices.reduce((sum, invoice) => 
      invoice.status === 'overdue' ? sum + invoice.total : sum, 0);
    
    // Calculate collection rate as a decimal
    const collectionRate = totalAmount > 0 
      ? paidAmount / totalAmount
      : 0;
    
    return {
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      collectionRate
    };
  };
  
  const financialSummary = calculateFinancialSummary();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-2xl font-bold">{formatCurrency(financialSummary.totalAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentMonthLabel}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Collection Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <BadgePercent className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-2xl font-bold">{formatPercentage(financialSummary.collectionRate)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(financialSummary.paidAmount)} of {formatCurrency(financialSummary.totalAmount)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-amber-500 mr-2" />
            <span className="text-2xl font-bold text-amber-500">
              {formatCurrency(financialSummary.outstandingAmount)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-2xl font-bold text-red-500">
              {formatCurrency(financialSummary.overdueAmount)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Past due date
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
