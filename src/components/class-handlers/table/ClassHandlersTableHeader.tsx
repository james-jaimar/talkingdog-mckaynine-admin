
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClassHandlersTableHeaderProps {
  scheduleDates: string[];
}

export function ClassHandlersTableHeader({ scheduleDates }: ClassHandlersTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[200px]">Handler / Dog</TableHead>
        <TableHead className="text-center">Enrol</TableHead>
        <TableHead className="text-center">Vacc</TableHead>
        <TableHead>Payment</TableHead>
        
        {/* Attendance date columns */}
        {scheduleDates.map((date) => (
          <TableHead key={date} className="text-center w-14">
            <div className="flex flex-col items-center text-xs">
              <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </TableHead>
        ))}
        
        <TableHead>Notes</TableHead>
        <TableHead>Info EO</TableHead>
        <TableHead className="text-center">WA</TableHead>
        <TableHead className="text-center">Social</TableHead>
        <TableHead>Info PG</TableHead>
        <TableHead className="w-[150px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
