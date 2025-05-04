
import { CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function TrainerPaymentLoading() {
  return (
    <CardContent className="flex items-center justify-center h-36">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </CardContent>
  );
}
