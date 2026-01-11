import { useAuth } from "@/context/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Users, Clock, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TrainerClasses() {
  const { trainerProfile, isTrainer } = useAuth();
  const navigate = useNavigate();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['trainer-my-classes', trainerProfile?.id],
    queryFn: async () => {
      if (!trainerProfile?.id) return [];

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          term_number,
          academic_year,
          classes:class_id (
            id,
            name,
            class_type,
            capacity,
            description
          ),
          bookings:bookings (
            id,
            status
          )
        `)
        .eq('trainer_id', trainerProfile.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error("Error fetching trainer classes:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!trainerProfile?.id,
  });

  // Group by class type
  const upcomingClasses = classes.filter(c => new Date(c.start_time) >= new Date());
  const pastClasses = classes.filter(c => new Date(c.start_time) < new Date());

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>My Classes</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Classes</h1>
          <p className="text-muted-foreground">Classes you are assigned to teach</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Upcoming Classes */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Upcoming Classes ({upcomingClasses.length})</h2>
              {upcomingClasses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No upcoming classes scheduled.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingClasses.map((schedule) => (
                    <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{schedule.classes?.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {schedule.classes?.class_type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(schedule.start_time), "PPP")}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          {format(new Date(schedule.start_time), "p")} - {format(new Date(schedule.end_time), "p")}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          {schedule.bookings?.length || 0} / {schedule.classes?.capacity || '∞'} enrolled
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => navigate(`/trainer/class/${schedule.id}`)}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Classes */}
            {pastClasses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Past Classes ({pastClasses.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastClasses.slice(0, 6).map((schedule) => (
                    <Card key={schedule.id} className="opacity-75">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{schedule.classes?.name}</CardTitle>
                        <Badge variant="outline">{schedule.classes?.class_type}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(schedule.start_time), "PPP")}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Users className="h-4 w-4 mr-2" />
                          {schedule.bookings?.length || 0} attended
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
