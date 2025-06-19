import { useState, useEffect } from "react";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassStatusCellProps {
  classType: string;
  clientId: string;
  initialStatus?: 'completed' | 'interested' | 'not-interested' | null;
  initialPeriod?: string;
  className?: string;
}

export function ClassStatusCell({ 
  classType, 
  clientId,
  initialStatus = null,
  initialPeriod = '',
  className
}: ClassStatusCellProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const statusColors = {
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'interested': 'bg-amber-100 text-amber-800 border-amber-200',
    'not-interested': 'bg-red-100 text-red-800 border-red-200',
  };

  const handleUpdate = async (newStatus: string, newPeriod: string) => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('handler_class_status')
        .upsert({
          handler_id: clientId, // Use handler_id to match the database schema
          class_type: classType.toLowerCase(), // Ensure lowercase for consistency
          status: newStatus,
          period: newPeriod
        }, { 
          onConflict: 'handler_id,class_type',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Error updating class status:', error);
        toast.error('Failed to update class status');
        return;
      }
      
      setStatus(newStatus);
      setPeriod(newPeriod);
      toast.success(`${classType} class status updated`);
    } catch (error) {
      console.error('Error in handler update:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <TableCell className={cn("text-center p-1", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-6 w-6 p-0 hover:bg-muted"
              disabled={isLoading}
            >
              {isLoading ? "..." : "+"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <Select 
                onValueChange={(value) => handleUpdate(value, period)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not-interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Period (e.g., Dec/Jan 25)"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                onBlur={() => status && handleUpdate(status, period)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  }

  return (
    <TableCell className={cn("text-center p-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "text-xs px-2 py-1 rounded border w-full",
              statusColors[status as keyof typeof statusColors],
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : period || "Set period"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <Select 
              value={status}
              onValueChange={(value) => handleUpdate(value, period)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="not-interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Period (e.g., Dec/Jan 25)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              onBlur={() => status && handleUpdate(status, period)}
            />
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
}
