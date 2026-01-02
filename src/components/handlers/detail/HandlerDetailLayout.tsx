
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { HandlerDetailHeader } from "./HandlerDetailHeader";
import { HandlerInfo } from "./HandlerInfo";
import { HandlerCommunications } from "./HandlerCommunications";
import { DogsList } from "./DogsList";
import { HandlerInvoices } from "./HandlerInvoices";
import { EnrollmentRegistrations } from "./EnrollmentRegistrations";
import { HandlerData } from "@/types/handler";
import { transformToClientType } from "@/utils/clientDataTransform";

interface HandlerDetailLayoutProps {
  handler: HandlerData;
  isLoading: boolean;
  onHandlerUpdated: () => void;
}

export function HandlerDetailLayout({ 
  handler, 
  isLoading, 
  onHandlerUpdated 
}: HandlerDetailLayoutProps) {
  const clientData = transformToClientType(handler);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Handler Details - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <HandlerDetailHeader 
          isLoading={isLoading} 
          handler={handler}
          onHandlerUpdated={onHandlerUpdated}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <HandlerInfo handler={handler} />
            <HandlerCommunications 
              clientId={handler.id}
              clientName={`${handler.first_name} ${handler.last_name || ''}`}
            />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            {clientData && (
              <HandlerInvoices clientData={clientData} />
            )}
            
            {handler.enrollment_registrations && handler.enrollment_registrations.length > 0 && (
              <EnrollmentRegistrations registrations={handler.enrollment_registrations} />
            )}
            
            <DogsList 
              clientId={handler.id}
              dogs={handler.dogs || []}
              onDogsUpdated={onHandlerUpdated}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
