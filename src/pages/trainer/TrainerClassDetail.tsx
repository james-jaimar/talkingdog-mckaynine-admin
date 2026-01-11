import { useAuth } from "@/context/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Users, Clock, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TrainerClassDetail() {
  const { trainerProfile, isTrainer } = useAuth();
  const { id: scheduleId } = useParams();
  const navigate = useNavigate();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['trainer-class-detail', scheduleId, trainerProfile?.id],
    queryFn: async () => {
      if (!trainerProfile?.id || !scheduleId) return null;

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          term_number,
          academic_year,
          trainer_id,
          classes:class_id (
            id,
            name,
            class_type,
            capacity,
            description
          ),
          bookings (
            id,
            status,
            payment_status,
            dogs:dog_id (
              id,
              name,
              breed
            ),
            clients:client_id (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq('id', scheduleId)
        .eq('trainer_id', trainerProfile.id)
        .single();

      if (error) {
        console.error("Error fetching class detail:", error);
        return null;
      }

      return data;
    },
    enabled: !!trainerProfile?.id && !!scheduleId,
  });

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!schedule) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Button variant="ghost" onClick={() => navigate('/trainer/classes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div className="flex items-center justify-center h-64">
            <p>Class not found or you don't have access to this class.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPast = new Date(schedule.start_time) < new Date();

  return (
    <DashboardLayout>
      <Helmet>
        <title>{schedule.classes?.name} - Class Details</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/trainer/classes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>

        {/* Class Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{schedule.classes?.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{schedule.classes?.class_type}</Badge>
                  {isPast ? (
                    <Badge variant="outline">Completed</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Upcoming</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium">{format(new Date(schedule.start_time), "PPP")}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(new Date(schedule.start_time), "p")} - {format(new Date(schedule.end_time), "p")}
                  </p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {schedule.bookings?.length || 0} / {schedule.classes?.capacity || '∞'}
                  </p>
                  <p className="text-sm text-muted-foreground">Enrolled</p>
                </div>
              </div>
            </div>
            
            {schedule.classes?.description && (
              <p className="text-muted-foreground">{schedule.classes.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Enrolled Students */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
          </CardHeader>
          <CardContent>
            {!schedule.bookings || schedule.bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No students enrolled yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Handler</TableHead>
                    <TableHead>Dog</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.clients?.first_name} {booking.clients?.last_name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{booking.dogs?.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({booking.dogs?.breed})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{booking.clients?.email}</div>
                          <div className="text-muted-foreground">{booking.clients?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.payment_status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            {booking.payment_status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{booking.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
