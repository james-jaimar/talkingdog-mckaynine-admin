
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { FormSelector } from "@/components/forms/FormSelector";
import { Clipboard, FileText, School } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Class } from "@/components/classes/types/class";
import { ClassSchedule } from "@/components/classes/types/class-schedule";

const staticFormOptions = [
  {
    id: "puppy-class",
    title: "Puppy Class Registration",
    description: "Registration form for puppy training classes",
    summary: "Collect owner and puppy information for class enrollment",
    path: "/forms/puppy-class-registration",
    icon: <FileText className="h-5 w-5 mr-2 text-mckaynine-600" />,
    secondaryAction: {
      label: "View Submissions",
      path: "/handlers",
      icon: <Clipboard className="mr-2 h-4 w-4" />,
    },
  },
];

export default function Forms() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch available puppy classes for registration
  const { data: puppyClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['forms-puppy-classes'],
    queryFn: async () => {
      try {
        // First get the class schedule data
        const { data: schedules, error: scheduleError } = await supabase
          .from('class_schedules')
          .select(`
            *,
            classes:class_id (*)
          `)
          .order('start_time', { ascending: true });
        
        if (scheduleError) {
          console.error("Error fetching class schedules:", scheduleError);
          throw scheduleError;
        }
        
        // Then get active class information
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('level', 'puppy')
          .order('created_at', { ascending: false });
        
        if (classError) {
          console.error("Error fetching puppy classes:", classError);
          throw classError;
        }
        
        // Combine the data to create a more complete representation
        const enrichedClasses = schedules.map((schedule) => {
          const classData = schedule.classes as Class;
          return {
            id: schedule.id,
            class_id: classData.id,
            name: classData.name,
            description: classData.description,
            level: classData.level,
            price: classData.price,
            branch_id: classData.branch_id,
            capacity: classData.capacity,
            created_at: schedule.created_at,
            updated_at: schedule.updated_at,
            // Display fields formatted from the schedule data
            title: `${classData.name} - ${classData.description}`,
            start_date: new Date(schedule.start_time).toLocaleDateString(),
            time: `${new Date(schedule.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(schedule.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            location: 'Main Branch', // Default location if not specified
            schedule_id: schedule.id,
            selected_dates: schedule.selected_dates
          };
        });
        
        return enrichedClasses;
      } catch (error) {
        console.error("Error in fetchPuppyClasses:", error);
        return [];
      }
    },
    enabled: !!isAdmin && !authLoading,
  });
  
  // Auth check and redirection
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [authLoading, isAdmin, navigate, toast]);

  if (!isAdmin) {
    return null; // Already redirected in useEffect
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Forms Management - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Forms Management</h1>
        
        <FormSelector forms={staticFormOptions} />
        
        {!classesLoading && puppyClasses && puppyClasses.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Register New Handlers for Puppy Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {puppyClasses.map((puppyClass) => (
                <div key={puppyClass.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <School className="h-5 w-5 text-mckaynine-600 mt-1" />
                    <div>
                      <h3 className="font-medium">{puppyClass.title || 'Puppy Class'}</h3>
                      <p className="text-sm text-gray-500 mt-1">{puppyClass.description || 'No description'}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Start date: {puppyClass.start_date}</p>
                        <p>Time: {puppyClass.time || 'Not specified'}</p>
                        <p>Location: {puppyClass.location || 'Main Branch'}</p>
                      </div>
                      <div className="mt-4">
                        <Button variant="mckaynine" size="sm" asChild>
                          <Link to={`/forms/puppy-class-registration/${puppyClass.id}`}>
                            Register Handler
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Placeholder card for future forms */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
            {["Training Agreement", "Customer Feedback", "Behavior Assessment"].map((title, idx) => (
              <div 
                key={idx} 
                className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center"
              >
                <h3 className="font-medium text-gray-600">{title}</h3>
                <p className="text-sm text-gray-500 mt-2">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
