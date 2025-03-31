
import { formatDate } from "@/lib/utils";

interface BasicInfoTabProps {
  age?: number;
  weight?: number;
  notes?: string;
  date_of_birth?: string;
}

export function BasicInfoTab({ age, weight, notes, date_of_birth }: BasicInfoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {date_of_birth && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
            <p className="mt-1">{formatDate(date_of_birth)}</p>
          </div>
        )}
        {age !== undefined && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Age</h4>
            <p className="mt-1">{age} years</p>
          </div>
        )}
        {weight !== undefined && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Weight</h4>
            <p className="mt-1">{weight} lbs</p>
          </div>
        )}
      </div>
      
      {notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-500">Notes</h4>
          <p className="mt-1 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
      
      {!date_of_birth && !age && !weight && !notes && (
        <p className="text-gray-500 italic">No basic information recorded</p>
      )}
    </div>
  );
}
