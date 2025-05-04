
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, FileCheck, HelpCircle } from "lucide-react";

interface PaymentMethodBadgeProps {
  method: string;
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  switch (method) {
    case "bank_transfer":
      return (
        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
          <CreditCard className="h-3 w-3 mr-1" />
          Bank Transfer
        </Badge>
      );
    case "cash":
      return (
        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
          <Banknote className="h-3 w-3 mr-1" />
          Cash
        </Badge>
      );
    case "check":
      return (
        <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
          <FileCheck className="h-3 w-3 mr-1" />
          Check
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-700 bg-gray-50 border-gray-200">
          <HelpCircle className="h-3 w-3 mr-1" />
          {method || "Other"}
        </Badge>
      );
  }
}
