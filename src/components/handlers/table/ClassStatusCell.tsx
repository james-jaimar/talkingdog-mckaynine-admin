
import { useState } from "react";
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

interface ClassStatusCellProps {
  classType: string;
  initialStatus?: 'completed' | 'interested' | 'not-interested' | null;
  initialPeriod?: string;
  onUpdate?: (data: { status: string; period: string }) => void;
}

export function ClassStatusCell({ 
  classType, 
  initialStatus = null,
  initialPeriod = '',
  onUpdate 
}: ClassStatusCellProps) {
  const [status, setStatus] = useState(initialStatus);
  const [period, setPeriod] = useState(initialPeriod);
  
  const statusColors = {
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'interested': 'bg-amber-100 text-amber-800 border-amber-200',
    'not-interested': 'bg-red-100 text-red-800 border-red-200',
  };

  const handleUpdate = (newStatus: string, newPeriod: string) => {
    setStatus(newStatus as any);
    setPeriod(newPeriod);
    onUpdate?.({ status: newStatus, period: newPeriod });
  };

  if (!status) {
    return (
      <TableCell className="text-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              +
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
                onChange={(e) => handleUpdate(status || 'completed', e.target.value)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  }

  return (
    <TableCell className="text-center p-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "text-xs px-2 py-1 rounded border w-full",
              statusColors[status]
            )}
          >
            {period || "Set period"}
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
              onChange={(e) => handleUpdate(status, e.target.value)}
            />
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
}
