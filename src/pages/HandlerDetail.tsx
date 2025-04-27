
import { useParams } from "react-router-dom";
import { HandlerDetailSkeleton } from "@/components/handlers/detail/HandlerDetailSkeleton";
import { HandlerNotFound } from "@/components/handlers/detail/HandlerNotFound";
import { HandlerDetailLayout } from "@/components/handlers/detail/HandlerDetailLayout";
import { useHandlerDetail } from "@/hooks/useHandlerDetail";

export default function HandlerDetail() {
  // Make sure we use the correct parameter name that matches the route definition
  const { id } = useParams<{ id: string }>();
  const { data: clientData, isLoading, refetch } = useHandlerDetail(id);

  if (isLoading) {
    return <HandlerDetailSkeleton />;
  }

  if (!clientData) {
    return <HandlerNotFound />;
  }

  return (
    <HandlerDetailLayout
      handler={clientData}
      isLoading={isLoading}
      onHandlerUpdated={refetch}
    />
  );
}
