import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { useClientDashboardData } from "@/hooks/useClientDashboardData";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { DogsSummaryCard } from "@/components/dashboard/customer/DogsSummaryCard";
import { UpcomingClassesCard } from "@/components/dashboard/customer/UpcomingClassesCard";
import { MessagesCard } from "@/components/dashboard/customer/MessagesCard";
import { RegistrationFormsCard } from "@/components/dashboard/customer/RegistrationFormsCard";
import { Sparkles } from "lucide-react";

export default function CustomerDashboard() {
  const { data: clientData, isLoading } = useClientDashboardData();
  const { unreadMessageCount } = useUnreadMessages(clientData?.id);
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>Dashboard - McKaynine Training Centre</title>
        <meta name="description" content="Manage your dog training classes, view upcoming sessions, and communicate with trainers." />
      </Helmet>
      
      <div className="space-y-6 md:space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-customer-accent/10 via-customer-accent/5 to-transparent p-6 md:p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-customer-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-customer-warm/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative">
            <div className="flex items-start gap-3 mb-2">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-customer-accent/20 items-center justify-center">
                <Sparkles className="h-5 w-5 text-customer-accent" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {getGreeting()}, {isLoading ? "..." : clientData?.first_name || "there"}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back to your training dashboard. Here's what's happening with your dogs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <DogsSummaryCard clientData={clientData} isLoading={isLoading} />
          <UpcomingClassesCard clientData={clientData} isLoading={isLoading} />
          <MessagesCard unreadMessageCount={unreadMessageCount} />
        </div>
        
        {/* Registration Forms Section */}
        <RegistrationFormsCard />
      </div>
    </CustomerDashboardLayout>
  );
}
