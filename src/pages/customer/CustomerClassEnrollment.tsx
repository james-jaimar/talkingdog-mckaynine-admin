import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Helmet } from "react-helmet";
import { format, parseISO, isPast } from "date-fns";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Dog, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  GraduationCap,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { useInvoices } from "@/hooks/useInvoices";
import { createInvoice } from "@/lib/invoices/createInvoiceUtils";

interface InvitationData {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  completed_class_type: string | null;
  handler: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  dog: {
    id: string;
    name: string;
    breed: string;
  };
  class_schedule: {
    id: string;
    start_time: string;
    selected_dates: string[];
    class: {
      id: string;
      name: string;
      description: string;
      course_fee: number;
      enrollment_fee: number;
      capacity: number;
      duration: number;
    };
    trainer: {
      first_name: string;
      last_name: string;
    } | null;
  };
  booking_id: string | null;
}

export default function CustomerClassEnrollment() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateInvoiceNumber } = useInvoices();
  
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Fetch invitation details
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["class-invitation", token],
    queryFn: async (): Promise<InvitationData | null> => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("class_invitations")
        .select(`
          id,
          token,
          status,
          expires_at,
          completed_class_type,
          booking_id,
          handler:clients!handler_id (
            id,
            first_name,
            last_name,
            email
          ),
          dog:dogs!dog_id (
            id,
            name,
            breed
          ),
          class_schedule:class_schedules!class_schedule_id (
            id,
            start_time,
            selected_dates,
            class:classes!class_id (
              id,
              name,
              description,
              course_fee,
              enrollment_fee,
              capacity,
              duration
            ),
            trainer:trainers!trainer_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("token", token)
        .single();

      if (error) {
        console.error("Error fetching invitation:", error);
        throw error;
      }

      // Transform the data to match our interface
      return {
        id: data.id,
        token: data.token,
        status: data.status,
        expires_at: data.expires_at,
        completed_class_type: data.completed_class_type,
        booking_id: data.booking_id,
        handler: data.handler as any,
        dog: data.dog as any,
        class_schedule: data.class_schedule as any,
      };
    },
    enabled: !!token,
  });

  // Check if invitation is expired
  const isExpired = invitation ? isPast(parseISO(invitation.expires_at)) : false;
  const isAlreadyProcessed = invitation?.status !== "pending";

  // Calculate total cost
  const courseFee = invitation?.class_schedule?.class?.course_fee || 0;
  const enrollmentFee = invitation?.class_schedule?.class?.enrollment_fee || 0;
  const totalCost = courseFee + enrollmentFee;

  // Handle enrollment
  const handleEnroll = async () => {
    if (!invitation || !token) return;
    
    setIsEnrolling(true);
    try {
      // Check if already enrolled
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("client_id", invitation.handler.id)
        .eq("dog_id", invitation.dog.id)
        .eq("class_schedule_id", invitation.class_schedule.id)
        .maybeSingle();

      if (existingBooking) {
        toast.error("You're already enrolled in this class");
        return;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          client_id: invitation.handler.id,
          dog_id: invitation.dog.id,
          class_schedule_id: invitation.class_schedule.id,
          is_enrolled: true,
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (bookingError) throw bookingError;

      // Create invoice if there's a cost
      let invoiceId: string | null = null;
      if (totalCost > 0) {
        const invoiceNumber = await generateInvoiceNumber();
        const classData = invitation.class_schedule.class;
        
        const invoiceData = {
          client_id: invitation.handler.id,
          invoice_number: invoiceNumber,
          status: "sent",
          issued_date: new Date(),
          due_date: new Date(), // Due date defaults to today (same as issued date)
          notes: `Self-enrollment for ${classData.name} training class for ${invitation.dog.name}.`,
          tax_rate: 0,
          items: [
            {
              description: `${classData.name} training class for ${invitation.dog.name}`,
              quantity: 1,
              unit_price: courseFee,
              booking_id: booking.id,
              item_type: 'course_fee',
            },
            ...(enrollmentFee > 0 ? [{
              description: `Enrollment fee for ${classData.name}`,
              quantity: 1,
              unit_price: enrollmentFee,
              booking_id: booking.id,
              item_type: 'enrollment_fee',
            }] : []),
          ],
          subtotal: totalCost,
          total: totalCost,
        };

        try {
          const result = await createInvoice(invoiceData);
          invoiceId = result?.id || null;
        } catch (invoiceError) {
          console.error("Invoice creation failed:", invoiceError);
          // Continue even if invoice fails - booking is created
        }
      }

      // Update invitation status
      await supabase
        .from("class_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          booking_id: booking.id,
        })
        .eq("id", invitation.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["class-invitation", token] });
      queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["class-invitations"] });

      toast.success("Successfully enrolled in class!");
      
      // Redirect to invoice if created, otherwise to dashboard
      if (invoiceId) {
        navigate(`/customer/invoices/${invoiceId}`);
      } else {
        navigate("/customer/dashboard");
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error(`Failed to enroll: ${error.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Handle decline
  const handleDecline = async () => {
    if (!invitation) return;
    
    setIsDeclining(true);
    try {
      await supabase
        .from("class_invitations")
        .update({
          status: "declined",
        })
        .eq("id", invitation.id);

      queryClient.invalidateQueries({ queryKey: ["class-invitation", token] });
      queryClient.invalidateQueries({ queryKey: ["class-invitations"] });

      toast.info("Invitation declined");
      navigate("/customer/dashboard");
    } catch (error: any) {
      console.error("Decline error:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setIsDeclining(false);
    }
  };

  // Format class dates
  const formatClassDates = () => {
    if (!invitation?.class_schedule) return "";
    const dates = invitation.class_schedule.selected_dates;
    if (dates && dates.length > 0) {
      return dates.map(d => format(parseISO(d), "EEEE, MMMM d")).join(" • ");
    }
    return format(parseISO(invitation.class_schedule.start_time), "EEEE, MMMM d, yyyy");
  };

  // Loading state
  if (isLoading) {
    return (
      <CustomerDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading invitation...</p>
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  // Error or not found
  if (error || !invitation) {
    return (
      <CustomerDashboardLayout>
        <Helmet>
          <title>Invitation Not Found - McKaynine Training Centre</title>
        </Helmet>
        <div className="max-w-lg mx-auto mt-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invitation Not Found</AlertTitle>
            <AlertDescription>
              This invitation link is invalid or has been removed. Please contact McKaynine for assistance.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => navigate("/customer/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  // Already processed
  if (isAlreadyProcessed) {
    return (
      <CustomerDashboardLayout>
        <Helmet>
          <title>Invitation {invitation.status === "accepted" ? "Accepted" : "Processed"} - McKaynine Training Centre</title>
        </Helmet>
        <div className="max-w-lg mx-auto mt-12">
          <Alert variant={invitation.status === "accepted" ? "default" : "destructive"}>
            {invitation.status === "accepted" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {invitation.status === "accepted" ? "Already Enrolled!" : "Invitation " + invitation.status}
            </AlertTitle>
            <AlertDescription>
              {invitation.status === "accepted" 
                ? "You've already accepted this invitation and are enrolled in the class."
                : `This invitation has been ${invitation.status}.`
              }
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center space-x-2">
            <Button onClick={() => navigate("/customer/dashboard")}>
              Go to Dashboard
            </Button>
            {invitation.status === "accepted" && (
              <Button variant="outline" onClick={() => navigate("/customer/invoices")}>
                View Invoices
              </Button>
            )}
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  // Expired
  if (isExpired) {
    return (
      <CustomerDashboardLayout>
        <Helmet>
          <title>Invitation Expired - McKaynine Training Centre</title>
        </Helmet>
        <div className="max-w-lg mx-auto mt-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invitation Expired</AlertTitle>
            <AlertDescription>
              This invitation expired on {format(parseISO(invitation.expires_at), "MMMM d, yyyy")}. 
              Please contact McKaynine to request a new invitation.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => navigate("/customer/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  const classData = invitation.class_schedule.class;
  const trainerName = invitation.class_schedule.trainer 
    ? `${invitation.class_schedule.trainer.first_name} ${invitation.class_schedule.trainer.last_name}`
    : "TBD";

  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>Enroll in {classData.name} - McKaynine Training Centre</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            <GraduationCap className="h-4 w-4" />
            You're Invited!
          </div>
          <h1 className="text-3xl font-bold">Continue Your Training Journey</h1>
          {invitation.completed_class_type && (
            <p className="text-muted-foreground">
              Congratulations on completing {invitation.completed_class_type}! 
              You're ready for the next step.
            </p>
          )}
        </div>

        {/* Class Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{classData.name}</CardTitle>
                <CardDescription className="mt-1">
                  {classData.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {classData.duration} weeks
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Schedule Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Class Dates</p>
                  <p className="text-sm text-muted-foreground">
                    {formatClassDates()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(invitation.class_schedule.start_time), "h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Trainer</p>
                  <p className="text-sm text-muted-foreground">{trainerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Dog className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Your Dog</p>
                  <p className="text-sm text-muted-foreground">
                    {invitation.dog.name} ({invitation.dog.breed})
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Investment
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Course Fee</span>
                  <span>R {courseFee.toFixed(2)}</span>
                </div>
                {enrollmentFee > 0 && (
                  <div className="flex justify-between">
                    <span>Enrollment Fee</span>
                    <span>R {enrollmentFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>R {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Expiry Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Respond by {format(parseISO(invitation.expires_at), "MMMM d, yyyy")}</AlertTitle>
              <AlertDescription>
                This invitation will expire in {Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days.
                Secure your spot while spaces are available!
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1 sm:flex-none" 
              size="lg"
              onClick={handleEnroll}
              disabled={isEnrolling || isDeclining}
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  I Want This Class!
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleDecline}
              disabled={isEnrolling || isDeclining}
            >
              {isDeclining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Not Right Now"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Contact Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Questions? Contact us at the training centre.</p>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
}
