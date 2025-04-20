
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
    invoices?: any[];
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
  };
}

export function HandlerTableRow({ handler }: HandlerTableRowProps) {
  const fullName = `${handler.first_name} ${handler.last_name || ''}`.trim();
  const invoiceCount = handler.invoices?.length || 0;

  return (
    <TableRow key={handler.id}>
      <TableCell>
        <Link 
          to={`/handlers/${handler.id}`}
          className="hover:text-blue-600 font-medium"
        >
          {fullName}
        </Link>
      </TableCell>
      <TableCell>{handler.email}</TableCell>
      <TableCell>{handler.phone || "—"}</TableCell>
      <TableCell className="text-center">
        <span className="inline-flex items-center justify-center h-6 min-w-6 bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-1.5">
          {handler.dogs?.length || 0}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <span className="inline-flex items-center justify-center h-6 min-w-6 bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-1.5">
          {invoiceCount}
        </span>
      </TableCell>
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
