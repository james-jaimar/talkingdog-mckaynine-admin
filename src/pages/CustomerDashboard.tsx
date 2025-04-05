import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Dog, FileText, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ClientWithDogs {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dogs: {
    id: string;
    name: string;
    breed: string;
  }[];
  bookings: {
    id: string;
    class_schedule_id: string;
    dog_id: string;
    class_schedule: {
      id: string;
      start_time: string;
      class: {
        id: string;
        name: string;
        description: string;
      };
    };
  }[];
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        // First get client record by email
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            dogs (
              id,
              name,
              breed
            ),
            bookings:bookings (
              id,
              class_schedule_id,
              dog_id,
              class_schedule:class_schedules (
                id,
                start_time,
                class:classes (
                  id,
                  name,
                  description
                )
              )
            )
          `)
          .eq('email', user.email)
          .single();
          
        if (clientError) throw clientError;
        return clientData as ClientWithDogs;
      } catch (error) {
        console.error("Error fetching client data:", error);
        return null;
      }
    },
    enabled: !!user
  });

  // Fetch unread messages count
  useEffect(() => {
    if (!clientData?.id) return;

    const fetchUnreadMessages = async () => {
      try {
        // Use direct RPC function to count unread messages
        const { data, error } = await supabase
          .rpc('get_unread_message_count', { p_client_id: clientData.id });
          
        if (error) {
          console.error("Error getting unread messages count:", error);
          
          // Fallback approach
          const { data: messages, error: msgError } = await supabase
            .from('client_messages')
            .select('id')
            .eq('client_id', clientData.id)
            .eq('is_from_client', false)
            .is('is_read', false);
            
          if (msgError) {
            console.error("Error in fallback unread count:", msgError);
            return;
          }
          
          setUnreadMessageCount(messages?.length || 0);
        } else {
          setUnreadMessageCount(data || 0);
        }
      } catch (error) {
        console.error("Error checking messages:", error);
      }
    };

    fetchUnreadMessages();
  }, [clientData]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!clientData?.id) return;

    const channel = supabase
      .channel(`client-messages-${clientData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientData.id} AND is_from_client=eq.false` // Only staff messages
        },
        (payload) => {
          // Increment unread count when a new message arrives
          setUnreadMessageCount(prev => prev + 1);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientData]);

  const upcomingClasses = clientData?.bookings?.filter(booking => {
    const classDate = new Date(booking.class_schedule.start_time);
    return classDate > new Date();
  }) || [];
  
  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>Customer Dashboard - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Welcome, {isLoading ? "Loading..." : clientData?.first_name || "Handler"}</h1>
        <p className="text-gray-600 mb-6">Manage your dogs, classes, and training progress</p>
        
        {/* Responsive grid for main cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Dog className="h-4 w-4 mr-2 text-mckaynine-600" />
                Your Dogs
              </CardTitle>
              <CardDescription>Manage your dog profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading...</p>
              ) : clientData?.dogs?.length ? (
                <ul className="space-y-2">
                  {clientData.dogs.map(dog => (
                    <li key={dog.id} className="p-2 border rounded-md">
                      <p className="font-medium">{dog.name}</p>
                      <p className="text-sm text-gray-600">{dog.breed}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No dogs found</p>
              )}
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/customer/profile">Manage Dogs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
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
          
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="h-4 w-4 mr-2 text-mckaynine-600" />
                Messages
                {unreadMessageCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0.5">
                    {unreadMessageCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>View your conversations</CardDescription>
            </CardHeader>
            <CardContent>
              {unreadMessageCount > 0 ? (
                <p className="text-gray-700">You have {unreadMessageCount} unread {unreadMessageCount === 1 ? 'message' : 'messages'}</p>
              ) : (
                <p className="text-gray-500">No unread messages</p>
              )}
              <div className="mt-4">
                <Button 
                  variant={unreadMessageCount > 0 ? "default" : "outline"} 
                  size="sm" 
                  className={unreadMessageCount > 0 ? "bg-mckaynine-600 hover:bg-mckaynine-700" : ""}
                  asChild
                >
                  <Link to="/customer/messages">View Messages</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Registration forms section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-4 w-4 mr-2 text-mckaynine-600" />
              Registration Forms
            </CardTitle>
            <CardDescription>Complete registration for new classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md text-center">
                <h3 className="font-medium">Puppy Class</h3>
                <p className="text-sm text-gray-500 mb-3">For dogs under 6 months</p>
                <Button variant="mckaynine" size="sm" asChild>
                  <Link to="/customer/forms/puppy-class">Register</Link>
                </Button>
              </div>
              <div className="p-4 border rounded-md text-center">
                <h3 className="font-medium">Basic Obedience</h3>
                <p className="text-sm text-gray-500 mb-3">For all ages</p>
                <Button variant="mckaynine" size="sm" asChild>
                  <Link to="/customer/forms/basic-obedience">Register</Link>
                </Button>
              </div>
              <div className="p-4 border rounded-md text-center">
                <h3 className="font-medium">Advanced Training</h3>
                <p className="text-sm text-gray-500 mb-3">For trained dogs</p>
                <Button variant="mckaynine" size="sm" asChild>
                  <Link to="/customer/forms/advanced">Register</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerDashboardLayout>
  );
}
