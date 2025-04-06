
import { Loader2 } from "lucide-react";

export function InvoiceLoadingState() {
  return (
    <div className="w-full py-6 flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      Loading invoice...
    </div>
  );
}
