
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { Calendar, Clock, MapPin, User, Dog, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { format, parseISO, isAfter } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { isRandburgPuppyClass, RANDBURG_PUPPY_SESSION_COUNT } from "@/lib/classes/randburgPuppy";

interface ClassBooking {
  id: string;
  status: string;
  payment_status: string;
  dogs: {
    id: string;
    name: string;
    breed: string;
  };
  class_schedules: {
    id: string;
    start_time: string;
    end_time: string;
    selected_dates: string[] | null;
    classes: {
      id: string;
      name: string;
      description: string;
      class_type: string;
      duration: number;
      branches: { name: string } | null;
    };
    trainers: {
      id: string;
      name: string;
    };
  };
  attendances?: Array<{ attendance_status: string; performance_grade: string | null }>;
}

export default function CustomerClasses() {
  const { user } = useAuth();

  // Fetch client record for the current user
  const { data: clientData } = useQuery({
    queryKey: ['customer-client', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch class bookings for the client
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['customer-classes', clientData?.id],
    queryFn: async () => {
      if (!clientData?.id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          payment_status,
          dogs:dog_id (
            id,
            name,
            breed
          ),
          class_schedules:class_schedule_id (
            id,
            start_time,
            end_time,
            selected_dates,
            classes:class_id (
              id,
              name,
              description,
              class_type,
              duration,
              branches:branch_id ( name )
            ),
            trainers:trainer_id (
              id,
              name
            )
          ),
          attendances:class_attendance ( attendance_status, performance_grade )
        `)
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ClassBooking[];
    },
    enabled: !!clientData?.id,
  });

  // Separate upcoming and past classes
  const now = new Date();
  const upcomingClasses = bookings?.filter(booking => {
    const schedule = booking.class_schedules;
    if (!schedule?.selected_dates?.length) return true; // Include if no dates set
    const lastDate = schedule.selected_dates[schedule.selected_dates.length - 1];
    return isAfter(parseISO(lastDate), now);
  }) || [];

  const pastClasses = bookings?.filter(booking => {
    const schedule = booking.class_schedules;
    if (!schedule?.selected_dates?.length) return false;
    const lastDate = schedule.selected_dates[schedule.selected_dates.length - 1];
    return !isAfter(parseISO(lastDate), now);
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Payment Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return null;
    }
  };

  const formatClassType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const ClassCard = ({ booking, isPast = false }: { booking: ClassBooking; isPast?: boolean }) => {
    const schedule = booking.class_schedules;
    const classInfo = schedule?.classes;
    const trainer = schedule?.trainers;
    const dog = booking.dogs;

    if (!classInfo) return null;

    const isRandburgPuppy = isRandburgPuppyClass(
      classInfo.branches?.name,
      classInfo.class_type
    );

    const upcomingDates = schedule?.selected_dates?.filter(d => isAfter(parseISO(d), now)).slice(0, 3) || [];

    // For Randburg Puppy, count completed sessions (present + grade 1-6)
    const completedSessions = isRandburgPuppy
      ? (booking.attendances || []).filter(
          a => a.attendance_status === 'present' && ['1','2','3','4','5','6'].includes(a.performance_grade || '')
        ).length
      : 0;

    return (
      <Card className={`overflow-hidden transition-all hover:shadow-md ${isPast ? 'opacity-75' : ''}`}>
        <div className={`h-1 ${isPast ? 'bg-muted' : 'bg-customer-accent'}`} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{classInfo.name}</CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="outline" className="mr-2">
                  {formatClassType(classInfo.class_type)}
                </Badge>
                {isRandburgPuppy && (
                  <Badge variant="secondary" className="mr-2">
                    {RANDBURG_PUPPY_SESSION_COUNT} sessions
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {getStatusBadge(booking.status)}
              {getPaymentBadge(booking.payment_status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dog Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-customer-accent/10 flex items-center justify-center">
              <Dog className="h-5 w-5 text-customer-accent" />
            </div>
            <div>
              <p className="font-medium">{dog?.name}</p>
              <p className="text-sm text-muted-foreground">{dog?.breed}</p>
            </div>
          </div>

          {/* Class Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{classInfo.duration} minutes</span>
            </div>
            {trainer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{trainer.name}</span>
              </div>
            )}
          </div>

          {/* Randburg Puppy: session-count summary instead of date pills */}
          {!isPast && isRandburgPuppy && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-customer-accent" />
                Session Progress
              </p>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-sm font-semibold">
                  {completedSessions} of {RANDBURG_PUPPY_SESSION_COUNT} sessions completed
                </p>
                <p className="text-xs text-muted-foreground">
                  Attend any {RANDBURG_PUPPY_SESSION_COUNT} of the available class dates — your trainer tracks each session.
                </p>
              </div>
            </div>
          )}

          {/* Upcoming Dates (non-Randburg-Puppy only) */}
          {!isPast && !isRandburgPuppy && upcomingDates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-customer-accent" />
                Upcoming Sessions
              </p>
              <div className="flex flex-wrap gap-2">
                {upcomingDates.map((date, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {format(parseISO(date), "EEE, MMM d")}
                  </Badge>
                ))}
                {schedule?.selected_dates && schedule.selected_dates.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{schedule.selected_dates.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>My Classes - McKaynine Training Centre</title>
        <meta name="description" content="View your enrolled dog training classes and upcoming sessions" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Classes</h1>
          <p className="text-muted-foreground">View your enrolled classes and upcoming training sessions</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !bookings?.length ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't enrolled in any classes yet. Contact your trainer to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Classes */}
            {upcomingClasses.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-customer-accent" />
                  Current & Upcoming Classes
                  <Badge variant="secondary">{upcomingClasses.length}</Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingClasses.map((booking) => (
                    <ClassCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Classes */}
            {pastClasses.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  Past Classes
                  <Badge variant="outline">{pastClasses.length}</Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pastClasses.map((booking) => (
                    <ClassCard key={booking.id} booking={booking} isPast />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
}
