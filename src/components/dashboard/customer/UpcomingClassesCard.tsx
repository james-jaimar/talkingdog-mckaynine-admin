import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Clock, FileText } from "lucide-react";
import { ClientWithDogs } from "@/types/customer-dashboard";
import { getUpcomingClasses } from "@/hooks/useClientDashboardData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UpcomingClassesCardProps {
  clientData?: ClientWithDogs | null;
  isLoading: boolean;
}

export function UpcomingClassesCard({ clientData, isLoading }: UpcomingClassesCardProps) {
  const upcomingClasses = getUpcomingClasses(clientData);

  return (
    <Card className="bg-customer-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-customer-warm/10 to-customer-warm/5 px-5 py-4 border-b border-customer-warm/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-customer-warm/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-customer-warm" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Upcoming Classes</h3>
              <p className="text-xs text-muted-foreground">
                {upcomingClasses.length} {upcomingClasses.length === 1 ? 'session' : 'sessions'} scheduled
              </p>
            </div>
          </div>
          {upcomingClasses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-customer-warm hover:text-customer-warm hover:bg-customer-warm/10"
            >
              <Link to="/customer/classes">
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-4 rounded-xl bg-muted/50">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : upcomingClasses.length > 0 ? (
          <div className="space-y-3">
            {upcomingClasses.slice(0, 3).map((booking) => {
              const startTime = new Date(booking.class_schedule.start_time);
              
              return (
                <div
                  key={booking.id}
                  className={cn(
                    "p-4 rounded-xl border border-border/50 bg-background",
                    "hover:border-customer-warm/30 hover:bg-customer-warm/5 transition-all duration-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {booking.class_schedule.class.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(startTime, "MMM d")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(startTime, "h:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-customer-warm/10 text-customer-warm text-xs font-medium">
                      Confirmed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No upcoming classes scheduled</p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-customer-warm text-customer-warm hover:bg-customer-warm hover:text-customer-accent-foreground"
            >
              <Link to="/customer/forms/puppy-class">
                <FileText className="h-4 w-4 mr-2" />
                Register for a Class
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
