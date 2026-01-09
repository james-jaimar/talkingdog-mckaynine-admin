import { TableCell, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ActionMenu } from "./ActionMenu";
import { ConsentStatusBadge } from "../status/ConsentStatusBadge";
import { CLASS_TYPES } from "@/components/classes/types/class-types";
import { ClassStatusCell } from "./ClassStatusCell";
import { TaskBadge } from "../TaskBadge";

interface HandlerTableRowProps {
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    dogs?: any[];
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
    class_statuses?: {
      class_type: string;
      status: 'completed' | 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend' | 'interested' | 'not-interested';
      period?: string;
      pass_percentage?: number | null;
      next_action?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
      result_notes?: string;
      next_class_type?: string | null;
      next_term_number?: string | null;
      next_term_year?: number | null;
      dog_name?: string | null;
      dog_id?: string | null;
      booking_id?: string | null;
    }[];
    email?: string;
    phone?: string;
    branch_id?: string | null;
    notes?: string;
  };
  index?: number;
}

export function HandlerTableRow({ handler, index = 0 }: HandlerTableRowProps) {
  const fullName = `${handler.first_name} ${handler.last_name || ''}`.trim();
  const isEven = index % 2 === 0;

  // Helper function to find ALL class statuses for a specific class type (multiple dogs)
  const getClassStatuses = (classType: string) => {
    return handler.class_statuses?.filter(status => status.class_type === classType) || [];
  };

  return (
    <TableRow 
      isEven={isEven}
      key={handler.id}
    >
      <TableCell className="w-[180px] font-medium">
        <Link 
          to={`/handlers/${handler.id}`}
          className="hover:text-blue-600"
        >
          {fullName}
        </Link>
      </TableCell>
      
      <TableCell className="text-center w-[60px]">
        <span className="inline-flex items-center justify-center h-6 min-w-6 bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-1.5">
          {handler.dogs?.length || 0}
        </span>
      </TableCell>
      
      {/* Class Type Columns */}
      {CLASS_TYPES.map((classType) => {
        const classStatuses = getClassStatuses(classType);
        return (
          <ClassStatusCell
            key={`${handler.id}-${classType}`}
            classType={classType}
            clientId={handler.id}
            statuses={classStatuses}
            className="w-[90px]"
          />
        );
      })}
      
      <TableCell className="text-center w-[60px]">
        <ConsentStatusBadge status={handler.uses_whatsapp_status} />
      </TableCell>
      <TableCell className="text-center w-[60px]">
        <ConsentStatusBadge status={handler.social_media_consent_status} />
      </TableCell>
      <TableCell className="text-center w-[70px]">
        <TaskBadge handlerId={handler.id} />
      </TableCell>
      <TableCell className="text-right w-[80px]">
        <ActionMenu handler={handler} />
      </TableCell>
    </TableRow>
  );
}
