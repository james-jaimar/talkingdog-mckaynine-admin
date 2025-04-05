
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { useClientDashboardData } from "@/hooks/useClientDashboardData";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { DogsSummaryCard } from "@/components/dashboard/customer/DogsSummaryCard";
import { UpcomingClassesCard } from "@/components/dashboard/customer/UpcomingClassesCard";
import { MessagesCard } from "@/components/dashboard/customer/MessagesCard";
import { RegistrationFormsCard } from "@/components/dashboard/customer/RegistrationFormsCard";

export default function CustomerDashboard() {
  // Use our custom hooks for data fetching
  const { data: clientData, isLoading } = useClientDashboardData();
  const { unreadMessageCount } = useUnreadMessages(clientData?.id);
  
  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>Customer Dashboard - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Welcome, {isLoading ? "Loading..." : clientData?.first_name || "Handler"}</h1>
        <p className="text-gray-600 mb-6">Manage your dogs, classes, and training progress</p>
        
        {/* Responsive grid for main cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DogsSummaryCard clientData={clientData} isLoading={isLoading} />
          <UpcomingClassesCard clientData={clientData} isLoading={isLoading} />
          <MessagesCard unreadMessageCount={unreadMessageCount} />
        </div>
        
        {/* Registration forms section */}
        <RegistrationFormsCard />
      </div>
    </CustomerDashboardLayout>
  );
}
