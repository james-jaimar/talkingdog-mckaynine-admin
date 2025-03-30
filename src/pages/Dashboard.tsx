
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { ClassesScheduled } from "@/components/dashboard/ClassesScheduled";
import { Dog, Users, Calendar, MapPin } from "lucide-react";
import { Helmet } from "react-helmet";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: clientCount }, 
        { count: dogCount }, 
        { count: bookingCount }, 
        { count: branchCount }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('dogs').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('branches').select('*', { count: 'exact', head: true })
      ]);
      
      return {
        clientCount: clientCount || 0,
        dogCount: dogCount || 0,
        bookingCount: bookingCount || 0,
        branchCount: branchCount || 0
      };
    }
  });

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Total Clients"
            value={isLoading ? "Loading..." : stats?.clientCount || 0}
            icon={Users}
            description="Active client accounts"
          />
          <StatsCard
            title="Dogs Registered"
            value={isLoading ? "Loading..." : stats?.dogCount || 0}
            icon={Dog}
            description="Dogs in training programs"
          />
          <StatsCard
            title="Total Bookings"
            value={isLoading ? "Loading..." : stats?.bookingCount || 0}
            icon={Calendar}
            description="Class bookings made"
          />
          <StatsCard
            title="Training Branches"
            value={isLoading ? "Loading..." : stats?.branchCount || 0}
            icon={MapPin}
            description="Active locations"
          />
        </div>
        
        {/* Two-column layout for bookings and classes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RecentBookings />
          <ClassesScheduled />
        </div>
      </div>
    </DashboardLayout>
  );
}
