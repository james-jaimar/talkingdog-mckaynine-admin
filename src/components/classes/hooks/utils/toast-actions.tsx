
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Export a function that returns JSX for the toast action button
export function createScheduleAction(classId: string) {
  const navigate = useNavigate();
  
  return (
    <Button 
      onClick={() => navigate(`/classes/${classId}/schedules`)}
      variant="primary"
      size="sm"
      className="bg-mckaynine-600 hover:bg-mckaynine-700 text-white"
    >
      Create Schedule
    </Button>
  );
}

// Function to show a toast with the schedule action button
export function showClassCreatedToast(className: string, classId: string) {
  toast({
    title: "Class created successfully",
    description: `${className} has been added. Would you like to create a schedule for this class?`,
    action: createScheduleAction(classId),
    duration: 8000, // Show toast for longer to give time to click
  });
}

// Function to show a class updated toast
export function showClassUpdatedToast(className: string) {
  toast({
    title: "Class updated successfully",
    description: `${className} has been updated.`,
  });
}

// Function to show an error toast
export function showClassErrorToast(error: unknown) {
  toast({
    title: "Failed to save class",
    description: String(error) || "An unexpected error occurred.",
    variant: "destructive",
  });
}
