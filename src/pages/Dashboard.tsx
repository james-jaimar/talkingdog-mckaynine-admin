
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { ClassesScheduled } from "@/components/dashboard/ClassesScheduled";
import { useBranch } from "@/context/BranchContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, Dog, Book, Calendar } from "lucide-react";
import { useTerm } from "@/context/TermContext";
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { currentBranch } = useBranch();
  const { termData, isTermLoading, selectedTermNumber, selectedYear, termDateRange } = useTerm();
  
  const {
    clientCount,
    dogCount,
    bookingCount,
    upcomingClassCount,
    refetchAllStats,
    isLoading: statsLoading
  } = useDashboardStats();

  // Fetch stats when component mounts or term changes
  useEffect(() => {
    console.log("📊 Dashboard detected term change, refetching stats", {
      termId: termData?.id,
      termNumber: selectedTermNumber,
      year: selectedYear,
      dateRange: termDateRange
    });
    
    if (termData) {
      // Only show toast if there's actual term data
      toast.info(`Term ${termData.term_number} data loaded`);
    }
    
    refetchAllStats();
  }, [termData?.id, selectedTermNumber, selectedYear, refetchAllStats, termDateRange]);

  // Determine if we're in a loading state
  const isLoading = isTermLoading || statsLoading;

  // Format date range for display, ensuring we use the correct year
  const formattedDateRange = termDateRange ? {
    startDate: format(parseISO(termDateRange.startDate), 'M/d/yyyy'),
    endDate: format(parseISO(termDateRange.endDate), 'M/d/yyyy')
  } : null;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard - McKaynine Training Centre</title>
      </Helmet>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          {termData && (
            <div className="text-sm text-muted-foreground">
              Current term: Term {termData.term_number}, {termData.academic_years?.year || selectedYear} 
              {formattedDateRange && (
                <span className="ml-2">
                  ({formattedDateRange.startDate} - {formattedDateRange.endDate})
                </span>
              )}
            </div>
          )}
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
