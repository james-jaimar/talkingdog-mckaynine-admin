
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ClassSchedule } from "../types/classSchedule";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useQueryClient } from "@tanstack/react-query";
import { format, isBefore, isAfter } from "date-fns";

interface UseScheduleSubmitProps {
  classId: string;
  schedule: ClassSchedule | null;
  onSuccess: () => void;
}

export function useScheduleSubmit({ 
  classId, 
  schedule, 
  onSuccess 
}: UseScheduleSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

  // Helper function to filter dates by term period
  const filterDatesByTerm = (dates: Date[], termStart: Date, termEnd: Date): Date[] => {
    return dates.filter(date => {
      // Check if the date falls within this term
      return !isBefore(date, termStart) && !isAfter(date, termEnd);
    });
  };

  const onSubmit = async (data: ClassScheduleFormValues) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      console.log("Starting schedule submission with data:", data);
      console.log("For class ID:", classId);
      
      // Check if we have selected dates
      if (!data.selectedDates || data.selectedDates.length === 0) {
        throw new Error("Please select at least one date");
      }
      
      // Sort dates to find first and last
      const sortedDates = [...data.selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Set hours and minutes from time strings
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      
      const startDateTime = new Date(firstDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(firstDate); // Use same day for end time
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // If end time is earlier than start time, assume it's for the next day
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      // Calculate end date by adding the same time difference to the last date
      const lastEndDateTime = new Date(lastDate);
      lastEndDateTime.setHours(endHour, endMinute, 0, 0);
      if (lastEndDateTime < lastDate) {
        lastEndDateTime.setDate(lastEndDateTime.getDate() + 1);
      }

      // Default schedule data
      const baseScheduleData = {
        class_id: classId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        recurring: data.isRecurring,
        recurrence_pattern: data.referenceTitle,
        selected_dates: data.selectedDates.map(date => date.toISOString()),
        // Use No Trainer ID if 'none' is selected
        trainer_id: data.trainerId === 'none' ? NO_TRAINER_ID : data.trainerId,
      };

      console.log("Prepared base schedule data for submission:", baseScheduleData);

      // Handle multi-term schedules
      if (data.spansMultipleTerms && data.relatedTermIds && data.relatedTermIds.length > 0) {
        console.log("Processing multi-term schedule");
        
        // Fetch details of the selected terms
        const { data: termsData, error: termsError } = await supabase
          .from("terms")
          .select("id, start_date, end_date")
          .in("id", data.relatedTermIds);
        
        if (termsError) {
          console.error("Error fetching terms:", termsError);
          throw termsError;
        }
        
        console.log("Terms data for multi-term schedule:", termsData);
        
        // Create a schedule for each term with the dates that fall within that term
        const scheduleInserts = [];
        let primaryScheduleId = null;
        
        // First, create a primary schedule with a relation ID
        const relationId = crypto.randomUUID();
        
        for (const term of termsData) {
          const termStart = new Date(term.start_date);
          const termEnd = new Date(term.end_date);
          
          // Filter dates that fall within this term
          const termDates = filterDatesByTerm(data.selectedDates, termStart, termEnd);
          
          // Only create a schedule if there are dates for this term
          if (termDates.length > 0) {
            const termScheduleData = {
              ...baseScheduleData,
              term_id: term.id,
              selected_dates: termDates.map(date => date.toISOString()),
              multi_term_relation_id: relationId,
              spans_multiple_terms: true
            };
            
            console.log(`Creating schedule for term ${term.id} with ${termDates.length} dates`);
            scheduleInserts.push(termScheduleData);
          }
        }
        
        // Insert all the schedules
        if (scheduleInserts.length > 0) {
          if (schedule) {
            // If updating an existing multi-term schedule, delete all related schedules first
            if (schedule.multi_term_relation_id) {
              const { error: deleteError } = await supabase
                .from("class_schedules")
                .delete()
                .eq("multi_term_relation_id", schedule.multi_term_relation_id);
              
              if (deleteError) {
                console.error("Error deleting related schedules:", deleteError);
                throw deleteError;
              }
            } else {
              // If it wasn't multi-term before, just delete the single schedule
              const { error: deleteError } = await supabase
                .from("class_schedules")
                .delete()
                .eq("id", schedule.id);
              
              if (deleteError) {
                console.error("Error deleting existing schedule:", deleteError);
                throw deleteError;
              }
            }
            
            // Now insert the new schedules
            const { data: insertedData, error: insertError } = await supabase
              .from("class_schedules")
              .insert(scheduleInserts)
              .select("id");
            
            if (insertError) {
              console.error("Error inserting new schedules:", insertError);
              throw insertError;
            }
            
            console.log("Updated multi-term schedules:", insertedData);
            toast({
              title: "Schedules updated",
              description: `Created ${insertedData.length} schedules across multiple terms.`,
            });
          } else {
            // Create new schedules
            const { data: insertedData, error: insertError } = await supabase
              .from("class_schedules")
              .insert(scheduleInserts)
              .select("id");
            
            if (insertError) {
              console.error("Error inserting new schedules:", insertError);
              throw insertError;
            }
            
            console.log("Created multi-term schedules:", insertedData);
            toast({
              title: "Schedules created",
              description: `Created ${insertedData.length} schedules across multiple terms.`,
            });
          }
        } else {
          throw new Error("No valid dates found for any of the selected terms");
        }
      } else {
        // Handle single-term schedule (original behavior)
        console.log("Processing single-term schedule");
        let result;
        
        if (schedule) {
          // Update existing schedule
          result = await supabase
            .from("class_schedules")
            .update(baseScheduleData)
            .eq("id", schedule.id);
            
          if (result.error) {
            console.error("Supabase update error:", result.error);
            throw result.error;
          }
          
          console.log("Schedule updated successfully:", result);
          
          toast({
            title: "Schedule updated",
            description: "The class schedule has been successfully updated.",
          });
        } else {
          // Create new schedule
          result = await supabase
            .from("class_schedules")
            .insert(baseScheduleData);
            
          if (result.error) {
            console.error("Supabase insert error:", result.error);
            throw result.error;
          }
          
          console.log("Schedule created successfully:", result);
          
          toast({
            title: "Schedule created",
            description: "The class schedule has been successfully created.",
          });
        }
      }

      // Avoid immediate invalidation to prevent recursion
      setTimeout(() => {
        // Invalidate all related queries to ensure UI is updated
        queryClient.invalidateQueries({ 
          queryKey: ["class-schedules"],
          // Disable refetchType to prevent automatic refetches
          refetchType: 'none'
        });
        
        // Wait a moment before triggering success callback
        onSuccess();
      }, 100);
      
    } catch (error) {
      console.error("Error submitting schedule:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    onSubmit,
  };
}
