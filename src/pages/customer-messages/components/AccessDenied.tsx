
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";

export function AccessDenied() {
  return (
    <>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to view your messages.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}
