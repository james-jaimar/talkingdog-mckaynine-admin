
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Save } from "lucide-react";

interface FormNavigationProps {
  title: string;
  isSubmitting?: boolean;
  onPrint?: () => void;
  backPath?: string;
  backLabel?: string;
}

export function FormNavigation({
  title,
  isSubmitting = false,
  onPrint,
  backPath = "/forms",
  backLabel = "Back to Forms"
}: FormNavigationProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to={backPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      
      <div className="space-x-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Form
        </Button>
      </div>
    </div>
  );
}
