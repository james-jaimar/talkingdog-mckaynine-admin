
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { CalendarClock, Users, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function TrainerDashboard() {
  const { user, isTrainer, trainerProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is a trainer
    if (user && !isTrainer) {
      toast({
        title: "Access Restricted",
        description: "This page is only accessible to trainers.",
        variant: "destructive",
      });
      // Redirect to home page
      window.location.href = "/";
    } else {
      setLoading(false);
    }
  }, [user, isTrainer, toast]);

  // Fetch upcoming classes for this trainer
  const { data: upcomingClasses = [] } = useQuery({
    queryKey: ['trainer-upcoming-classes', trainerProfile?.id],
    queryFn: async () => {
      if (!trainerProfile?.id) return [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          classes:class_id (
            name,
            class_type
          ),
          bookings:bookings!class_schedules_id_fkey (
            id
          )
        `)
        .eq('trainer_id', trainerProfile.id)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error("Error fetching trainer classes:", error);
        return [];
      }
      
      return data.map(cls => ({
        ...cls,
        studentCount: cls.bookings?.length || 0,
      }));
    },
    enabled: !!trainerProfile?.id,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mckaynine-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Trainer Dashboard - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6 w-full py-6">
        <h1 className="text-3xl font-bold tracking-tight">Trainer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingClasses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingClasses.reduce((total, cls) => total + cls.studentCount, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Next Class</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingClasses.length > 0 
                  ? format(new Date(upcomingClasses[0].start_time), "PPp")
                  : "No upcoming classes"}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <p className="text-muted-foreground">No upcoming classes scheduled.</p>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex flex-col md:flex-row justify-between p-4 border rounded-md">
                    <div>
                      <h3 className="font-semibold">{cls.classes?.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.classes?.class_type} Class</p>
                    </div>
                    <div>
                      <p className="text-sm">
                        {format(new Date(cls.start_time), "PPP")}
                      </p>
                      <p className="text-sm">
                        {format(new Date(cls.start_time), "p")} - {format(new Date(cls.end_time), "p")}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{cls.studentCount} students</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
