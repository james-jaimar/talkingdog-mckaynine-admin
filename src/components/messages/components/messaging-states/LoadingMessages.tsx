
import { Loader2 } from "lucide-react";

export function LoadingMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-mckaynine-500 mb-2" />
      <p>Loading messages...</p>
    </div>
  );
}
