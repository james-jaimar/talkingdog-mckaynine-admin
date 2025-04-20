
import { TableCell, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ActionMenu } from "./ActionMenu";

interface HandlerTableRowProps {
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    dogs?: any[];
  };
}

export function HandlerTableRow({ handler }: HandlerTableRowProps) {
  return (
    <TableRow key={handler.id}>
      <TableCell>
        <Link 
          to={`/handlers/${handler.id}`}
          className="hover:text-blue-600 font-medium"
        >
          {handler.first_name} {handler.last_name}
        </Link>
      </TableCell>
      <TableCell>{handler.email}</TableCell>
      <TableCell>{handler.phone || "—"}</TableCell>
      <TableCell>{handler.dogs?.length || 0}</TableCell>
      <TableCell>—</TableCell>
      <TableCell className="text-right">
        <ActionMenu handler={handler} />
      </TableCell>
    </TableRow>
  );
}
