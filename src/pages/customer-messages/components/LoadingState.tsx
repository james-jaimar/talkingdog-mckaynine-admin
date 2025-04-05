
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600 mb-4" />
          <p className="text-lg text-mckaynine-600">Loading your messages...</p>
        </div>
      </div>
    </>
  );
}
