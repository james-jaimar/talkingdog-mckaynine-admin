
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormNavigationProps {
  title: string;
  isSubmitting?: boolean;
  onPrint?: () => void;
  onSave?: () => void;
  backPath?: string;
  backLabel?: string;
  subtitle?: string;
}

export function FormNavigation({
  title,
  isSubmitting = false,
  onPrint,
  onSave,
  backPath = "/forms",
  backLabel = "Back to Forms",
  subtitle
}: FormNavigationProps) {
  const isMobile = useIsMobile();
  
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link to={backPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isMobile ? "Back" : backLabel}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mckaynine-800">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      
      <div className="space-x-2">
        {onSave && (
          <Button variant="mckaynine" size="sm" onClick={onSave} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isMobile ? "Save" : "Save Form"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          {isMobile ? "Print" : "Print Form"}
        </Button>
      </div>
    </div>
  );
}
