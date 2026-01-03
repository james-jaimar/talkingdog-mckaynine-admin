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

  // Helper function to find the class status for a specific class type
  const getClassStatus = (classType: string) => {
    return handler.class_statuses?.find(status => status.class_type === classType);
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
        const classStatus = getClassStatus(classType);
        return (
          <ClassStatusCell
            key={`${handler.id}-${classType}`}
            classType={classType}
            clientId={handler.id}
            initialStatus={classStatus?.status || null}
            initialPeriod={classStatus?.period || ''}
            initialPassPercentage={classStatus?.pass_percentage}
            initialNextAction={classStatus?.next_action}
            initialNotes={classStatus?.result_notes || ''}
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
