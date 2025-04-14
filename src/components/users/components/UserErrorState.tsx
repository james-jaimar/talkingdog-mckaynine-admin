
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function UserErrorState({ error, onRetry }: UserErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
      <h2 className="text-xl font-medium text-red-800 mb-2">Error Loading Users</h2>
      <p className="text-red-700">{error.message}</p>
      <Button 
        onClick={onRetry} 
        variant="outline"
        className="border-red-300 text-red-700 mt-4"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}
