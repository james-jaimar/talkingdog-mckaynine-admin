
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HandlerNotFound() {
  return (
    <div className="text-center py-16">
      <h3 className="text-xl font-medium mb-2">Handler not found</h3>
      <p className="text-sm text-gray-500 mb-8">
        The handler you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild variant="mckaynine">
        <Link to="/handlers">Back to Handlers</Link>
      </Button>
    </div>
  );
}
