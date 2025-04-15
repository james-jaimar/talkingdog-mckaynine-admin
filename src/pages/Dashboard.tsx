
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedSupabaseClient } from "@/integrations/supabase/custom-types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { ClassesScheduled } from "@/components/dashboard/ClassesScheduled";
import { Dog, Users, Calendar, MapPin, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const enhancedSupabase = supabase as EnhancedSupabaseClient;
  
  // Add a console log to debug branch state
  console.log("Dashboard - Branch state:", { currentBranch });
  
  // Force refetch dashboard stats on branch change or dashboard visit
  useEffect(() => {
    if (user && currentBranch) {
      console.log("Dashboard - Force refreshing data for branch:", currentBranch.name);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', currentBranch.id] });
    }
  }, [user, currentBranch, queryClient]);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) return null;
      
      console.log("Dashboard - Fetching stats for branch:", currentBranch.name);
      try {
        // Filter all queries by branch_id
        const [
          { count: clientCount, error: clientError }, 
          { count: dogCount, error: dogError }, 
          { count: bookingCount, error: bookingError }
        ] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true })
            .eq('branch_id', currentBranch.id),
          supabase.from('dogs').select('*, clients!inner(*)', { count: 'exact', head: true })
            .eq('clients.branch_id', currentBranch.id),
          supabase.from('bookings').select('*, clients!inner(*)', { count: 'exact', head: true })
            .eq('clients.branch_id', currentBranch.id)
        ]);
        
        // Get total branch count (not filtered by branch)
        const { count: branchCount, error: branchError } = await supabase
          .from('branches')
          .select('*', { count: 'exact', head: true });
        
        // Check for errors in any of the count queries
        if (clientError) throw clientError;
        if (dogError) throw dogError;
        if (bookingError) throw bookingError;
        if (branchError) throw branchError;
        
        // Get unpaid bookings filtered by branch
        let unpaidCount = 0;
        try {
          // Use a single efficient query with left join to get bookings without proof of payment
          // that don't have associated paid invoices, filtered by branch
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              id,
              clients!inner(branch_id),
              invoice_items:invoice_items(
                invoice_id,
                invoices:invoice_id(
                  payment_received
                )
              )
            `)
            .eq('clients.branch_id', currentBranch.id)
            .or('proof_of_payment.is.null,proof_of_payment.eq.');
          
          if (error) {
            console.error("Dashboard - Error fetching unpaid bookings:", error);
          } else if (data) {
            // Filter bookings that have no invoice items or no paid invoices
            unpaidCount = data.filter(booking => {
              // If booking has no invoice items, it's unpaid
              if (!booking.invoice_items || booking.invoice_items.length === 0) {
                return true;
              }
              
              // If booking has any invoice items, check if all invoices are unpaid
              return booking.invoice_items.every(item => 
                !item.invoices || !item.invoices.payment_received
              );
            }).length;
            
            console.log(`Dashboard - Found ${unpaidCount} unpaid bookings for branch ${currentBranch.name}`);
          }
        } catch (unpaidError) {
          console.error("Dashboard - Error counting unpaid bookings:", unpaidError);
        }
        
        console.log("Dashboard stats for branch:", { 
          branch: currentBranch.name,
          clientCount, 
          dogCount, 
          bookingCount, 
          branchCount, 
          unpaidCount 
        });
        
        return {
          clientCount: clientCount || 0,
          dogCount: dogCount || 0,
          bookingCount: bookingCount || 0,
          branchCount: branchCount || 0,
          unpaidCount: unpaidCount || 0
        };
      } catch (error) {
        console.error("Dashboard - Error fetching stats:", error);
        throw error;
      }
    },
    enabled: !!currentBranch && !!user // Only run query when branch and user are available
  });

  const handleUnpaidClick = () => {
    navigate('/unpaid-handlers');
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <h1 className="text-3xl font-bold">
          Dashboard {currentBranch && `- ${currentBranch.name}`}
        </h1>
        
        {!currentBranch && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700">
              Please select a branch using the branch selector at the top of the page.
            </p>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <StatsCard
            title="Total Clients"
            value={isLoading || !currentBranch ? "—" : stats?.clientCount || 0}
            icon={Users}
            description={currentBranch ? `Clients in ${currentBranch.name}` : "Select a branch"}
          />
          <StatsCard
            title="Dogs Registered"
            value={isLoading || !currentBranch ? "—" : stats?.dogCount || 0}
            icon={Dog}
            description={currentBranch ? `Dogs in ${currentBranch.name}` : "Select a branch"}
          />
          <StatsCard
            title="Total Bookings"
            value={isLoading || !currentBranch ? "—" : stats?.bookingCount || 0}
            icon={Calendar}
            description={currentBranch ? `Class bookings in ${currentBranch.name}` : "Select a branch"}
          />
          <StatsCard
            title="Training Branches"
            value={isLoading ? "—" : stats?.branchCount || 0}
            icon={MapPin}
            description="Active locations"
          />
          <StatsCard
            title="Missing Payments"
            value={isLoading || !currentBranch ? "—" : stats?.unpaidCount || 0}
            icon={AlertCircle}
            description={currentBranch ? `Bookings needing payment in ${currentBranch.name}` : "Select a branch"}
            className="cursor-pointer border-amber-200 hover:border-amber-300 transition-colors"
            onClick={handleUnpaidClick}
          />
        </div>
        
        {/* Two-column layout for bookings and classes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RecentBookings branchId={currentBranch?.id} />
          <ClassesScheduled branchId={currentBranch?.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
