
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const enhancedSupabase = supabase as EnhancedSupabaseClient;
  
  // Add a console log to debug auth state
  console.log("Dashboard - Auth state:", { user: !!user, isLoading: authLoading });
  
  // Force refetch dashboard stats on every dashboard visit
  useEffect(() => {
    if (user) {
      console.log("Dashboard - Force refreshing payment data");
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.info("Payment data refreshed");
    }
  }, [user, queryClient]);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log("Dashboard - Fetching stats");
      try {
        // First get counts for standard metrics
        const [
          { count: clientCount, error: clientError }, 
          { count: dogCount, error: dogError }, 
          { count: bookingCount, error: bookingError }, 
          { count: branchCount, error: branchError }
        ] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('dogs').select('*', { count: 'exact', head: true }),
          supabase.from('bookings').select('*', { count: 'exact', head: true }),
          supabase.from('branches').select('*', { count: 'exact', head: true })
        ]);
        
        // Check for errors in any of the count queries
        if (clientError) throw clientError;
        if (dogError) throw dogError;
        if (bookingError) throw bookingError;
        if (branchError) throw branchError;
        
        // Now fetch unpaid bookings directly since RPC function may not be available
        let unpaidCount = 0;
        try {
          // Query bookings that don't have proof of payment
          const { data: unpaidBookings, error: unpaidError } = await supabase
            .from('bookings')
            .select(`
              id,
              proof_of_payment
            `)
            .or('proof_of_payment.is.null,proof_of_payment.eq.');
          
          if (unpaidError) {
            console.error("Dashboard - Error fetching unpaid bookings:", unpaidError);
          } else {
            // For each booking without proof of payment, check if it has a paid invoice
            const filteredBookings = [];
            for (const booking of unpaidBookings || []) {
              // Check if booking has a paid invoice
              const { data: invoiceItem, error: invoiceError } = await supabase
                .from('invoice_items')
                .select(`
                  invoice_id,
                  invoices:invoice_id (
                    id,
                    status,
                    payment_received
                  )
                `)
                .eq('booking_id', booking.id)
                .maybeSingle();
              
              if (invoiceError) {
                console.error(`Error checking invoice for booking ${booking.id}:`, invoiceError);
                continue;
              }
              
              // Only include booking if it has no invoice or invoice is not paid
              if (!invoiceItem || (invoiceItem && !invoiceItem.invoices.payment_received)) {
                filteredBookings.push(booking);
              }
            }
            
            unpaidCount = filteredBookings.length;
            console.log(`Dashboard - Found ${unpaidCount} truly unpaid bookings`);
          }
        } catch (unpaidError) {
          console.error("Dashboard - Error counting unpaid bookings:", unpaidError);
          // Still continue with the stats we have, just set unpaidCount to 0
        }
        
        console.log("Dashboard stats:", { clientCount, dogCount, bookingCount, branchCount, unpaidCount });
        
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
    enabled: !!user // Only run query when user is authenticated
  });

  const handleUnpaidClick = () => {
    navigate('/unpaid-handlers');
  };

  // Add this console log to verify the query is running
  console.log("Dashboard - Query state:", { isLoading, hasStats: !!stats });

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
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
          <StatsCard
            title="Missing Payments"
            value={isLoading ? "Loading..." : stats?.unpaidCount || 0}
            icon={AlertCircle}
            description="Bookings missing proof of payment"
            className="cursor-pointer border-amber-200 hover:border-amber-300 transition-colors"
            onClick={handleUnpaidClick}
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
