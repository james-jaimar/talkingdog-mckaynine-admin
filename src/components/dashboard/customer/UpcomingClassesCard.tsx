
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ClientWithDogs } from "@/types/customer-dashboard";
import { getUpcomingClasses } from "@/hooks/useClientDashboardData";

interface UpcomingClassesCardProps {
  clientData?: ClientWithDogs | null;
  isLoading: boolean;
}

export function UpcomingClassesCard({ clientData, isLoading }: UpcomingClassesCardProps) {
  const upcomingClasses = getUpcomingClasses(clientData);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Calendar className="h-4 w-4 mr-2 text-mckaynine-600" />
          Upcoming Classes
        </CardTitle>
        <CardDescription>View your scheduled classes</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : upcomingClasses.length ? (
          <ul className="space-y-2">
            {upcomingClasses.slice(0, 3).map(booking => (
              <li key={booking.id} className="p-2 border rounded-md">
                <p className="font-medium">{booking.class_schedule.class.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(booking.class_schedule.start_time).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming classes</p>
        )}
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/customer/classes">View All Classes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
