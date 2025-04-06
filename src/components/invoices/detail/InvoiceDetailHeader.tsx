
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Invoice } from "@/hooks/invoices/types";

interface InvoiceDetailHeaderProps {
  invoice: Invoice;
  onGeneratePDF: () => void;
  backPath: string;
}

export function InvoiceDetailHeader({ invoice, onGeneratePDF, backPath }: InvoiceDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
      </div>
      <div>
        <Button variant="outline" onClick={onGeneratePDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
