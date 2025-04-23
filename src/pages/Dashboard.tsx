
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { ClassesScheduled } from "@/components/dashboard/ClassesScheduled";
import { useBranch } from "@/context/BranchContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, Dog, Book, Calendar } from "lucide-react";
import { useTermSelection } from "@/hooks/useTermSelection";
import { TermDisplay } from "@/components/dashboard/TermDisplay";
import { useEffect } from "react";

export default function Dashboard() {
  const { currentBranch } = useBranch();
  const { termData, isTermLoading } = useTermSelection();
  
  const {
    clientCount,
    dogCount,
    bookingCount,
    upcomingClassCount,
    refetchAllStats,
    isLoading: statsLoading
  } = useDashboardStats();

  // Track term changes and force refetch once
  useEffect(() => {
    // Listen for term change events globally
    const handleTermChanged = () => {
      console.log("Dashboard detected global term change event");
      refetchAllStats();
    };
    
    window.addEventListener('term-changed', handleTermChanged);
    
    // Initial refetch on mount
    refetchAllStats();
    
    return () => {
      window.removeEventListener('term-changed', handleTermChanged);
    };
  }, [refetchAllStats]);

  // Determine if we're in a loading state
  const isLoading = isTermLoading || statsLoading;

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
