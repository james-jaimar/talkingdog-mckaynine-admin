
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Handler {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dogs: any[];
}

interface HandlersTableProps {
  handlers: Handler[];
  expandedHandlers: string[];
  toggleHandler: (id: string) => void;
}

export function HandlersTable({ handlers, expandedHandlers, toggleHandler }: HandlersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Handler Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {handlers.map(handler => (
          <TableRow 
            key={handler.id}
            className={expandedHandlers.includes(handler.id) ? "bg-slate-50" : ""}
          >
            <TableCell>
              <button 
                onClick={() => toggleHandler(handler.id)}
                className="text-left font-medium hover:underline"
              >
                {handler.first_name} {handler.last_name}
              </button>
            </TableCell>
            <TableCell>{handler.email}</TableCell>
            <TableCell>{handler.phone || "-"}</TableCell>
            <TableCell>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleHandler(handler.id)}
              >
                {expandedHandlers.includes(handler.id) ? "Hide Dogs" : "Show Dogs"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
