
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";

export function MessagingNotAvailable() {
  return (
    <>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Messaging Not Available</AlertTitle>
          <AlertDescription>
            We couldn't set up messaging for your account. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}
