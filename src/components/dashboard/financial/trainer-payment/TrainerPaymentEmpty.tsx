
import { CardContent } from "@/components/ui/card";

export function TrainerPaymentEmpty() {
  return (
    <CardContent className="text-center">
      <p className="text-muted-foreground py-4">No trainer payment data available</p>
    </CardContent>
  );
}
