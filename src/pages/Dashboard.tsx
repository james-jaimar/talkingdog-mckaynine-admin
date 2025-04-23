
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { ClassesScheduled } from "@/components/dashboard/ClassesScheduled";
import { useBranch } from "@/context/BranchContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, Dog, Book, Calendar } from "lucide-react";
import { useTermSelection } from "@/hooks/useTermSelection";
import { TermDisplay } from "@/components/dashboard/TermDisplay";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const { termData, termDateRange, isTermLoading } = useTermSelection();
  const [termId, setTermId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    clientCount,
    dogCount,
    bookingCount,
    upcomingClassCount,
    refetchAllStats,
    isLoading: statsLoading
  } = useDashboardStats();

  // Track term changes and force refetch
  useEffect(() => {
    console.log("Dashboard detected term data change:", termData?.id);
    
    // Only trigger refetch if term ID actually changed
    if (termData?.id !== termId) {
      console.log("Term ID changed from", termId, "to", termData?.id, "- refetching stats");
      setTermId(termData?.id || null);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries();
      
      // Also call our refetch function with a short delay
      setTimeout(() => {
        refetchAllStats();
      }, 50);
    }
  }, [termData, termId, refetchAllStats, queryClient]);

  // Determine if we're in a loading state
  const isLoading = isTermLoading || statsLoading || !termId;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        {/* Term Display */}
        <div className="mb-4">
          <TermDisplay />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <StatsCard
            title="Clients"
            value={isLoading ? "Loading..." : clientCount ?? "-"}
            icon={Users}
            description="Registered clients"
          />
          <StatsCard
            title="Dogs"
            value={isLoading ? "Loading..." : dogCount ?? "-"}
            icon={Dog}
            description="Total dogs"
          />
          <StatsCard
            title="Bookings"
            value={isLoading ? "Loading..." : bookingCount ?? "-"}
            icon={Book}
            description={`Bookings ${termData ? `in Term ${termData.term_number}` : ''}`}
          />
          <StatsCard
            title="Upcoming Classes"
            value={isLoading ? "Loading..." : upcomingClassCount ?? "-"}
            icon={Calendar}
            description={`Classes ${termData ? `in Term ${termData.term_number}` : 'scheduled'}`}
          />
        </div>

        {/* Grid layout for dashboard cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <RecentBookings branchId={currentBranch?.id} />
          <ClassesScheduled branchId={currentBranch?.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
