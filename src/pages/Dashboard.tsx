
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { ClassesScheduled } from "@/components/dashboard/ClassesScheduled";
import { useBranch } from "@/context/BranchContext";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, Dog, Book, Calendar } from "lucide-react";

export default function Dashboard() {
  const { currentBranch } = useBranch();
  const {
    clientCount,
    dogCount,
    bookingCount,
    upcomingClassCount
  } = useDashboardStats();

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <StatsCard
            title="Clients"
            value={clientCount ?? "-"}
            icon={Users}
            description="Registered clients"
          />
          <StatsCard
            title="Dogs"
            value={dogCount ?? "-"}
            icon={Dog}
            description="Total dogs"
          />
          <StatsCard
            title="Bookings"
            value={bookingCount ?? "-"}
            icon={Book}
            description="All bookings"
          />
          <StatsCard
            title="Upcoming Classes"
            value={upcomingClassCount ?? "-"}
            icon={Calendar}
            description="Scheduled classes"
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
