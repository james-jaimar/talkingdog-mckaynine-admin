import { TableCell, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ActionMenu } from "./ActionMenu";
import { ConsentStatusBadge } from "../status/ConsentStatusBadge";
import { CLASS_TYPES } from "@/components/classes/types/class-types";
import { ClassStatusCell } from "./ClassStatusCell";

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
    class_statuses?: {
      class_type: string;
      status: 'completed' | 'interested' | 'not-interested';
      period?: string;
    }[];
  };
  index?: number;
}

export function HandlerTableRow({ handler, index = 0 }: HandlerTableRowProps) {
  const fullName = `${handler.first_name} ${handler.last_name || ''}`.trim();
  const invoiceCount = handler.invoices?.length || 0;

  // Helper function to find the class status for a specific class type
  const getClassStatus = (classType: string) => {
    return handler.class_statuses?.find(status => status.class_type === classType);
  };

  return (
    <TableRow 
      className={index % 2 === 0 ? "bg-gray-50" : "bg-gray-200"}
      key={handler.id}
    >
      
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
      
      {/* Class Type Columns */}
      {CLASS_TYPES.map((classType) => {
        const classStatus = getClassStatus(classType);
        return (
          <ClassStatusCell
            key={`${handler.id}-${classType}`}
            classType={classType}
            clientId={handler.id}
            initialStatus={classStatus?.status || null}
            initialPeriod={classStatus?.period || ''}
          />
        );
      })}
      
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
