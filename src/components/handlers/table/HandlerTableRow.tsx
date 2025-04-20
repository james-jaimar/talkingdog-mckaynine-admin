
import { TableCell, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ActionMenu } from "./ActionMenu";
import { ConsentStatusBadge } from "../status/ConsentStatusBadge";

interface HandlerTableRowProps {
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    dogs?: any[];
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
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
      <TableCell className="text-center">
        <ConsentStatusBadge status={handler.uses_whatsapp_status} />
      </TableCell>
      <TableCell className="text-center">
        <ConsentStatusBadge status={handler.social_media_consent_status} />
      </TableCell>
      <TableCell className="text-right">
        <ActionMenu handler={handler} />
      </TableCell>
    </TableRow>
  );
}
