
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface HandlersTableProps {
  handlers: any[];
  onShowDogs: (handlerId: string) => void;
}

export function HandlersTable({ handlers, onShowDogs }: HandlersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Handler Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-center">Dogs</TableHead>
          <TableHead className="text-center">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {handlers.map((handler, index) => (
          <TableRow key={handler.id} isEven={index % 2 === 0}>
            <TableCell className="font-medium">
              {handler.first_name} {handler.last_name}
            </TableCell>
            <TableCell>{handler.email}</TableCell>
            <TableCell>{handler.phone || "—"}</TableCell>
            <TableCell className="text-center">
              <span className="inline-flex items-center justify-center h-6 min-w-6 bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-1.5">
                {handler.dogs?.length || 0}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onShowDogs(handler.id)}
              >
                View Dogs <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
