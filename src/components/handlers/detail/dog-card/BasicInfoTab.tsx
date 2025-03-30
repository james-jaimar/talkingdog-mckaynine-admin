
interface BasicInfoTabProps {
  age?: number;
  weight?: number;
  notes?: string;
}

export function BasicInfoTab({ age, weight, notes }: BasicInfoTabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {age && (
        <div>
          <p className="text-sm font-medium text-gray-500">Age</p>
          <p>{age} years</p>
        </div>
      )}
      {weight && (
        <div>
          <p className="text-sm font-medium text-gray-500">Weight</p>
          <p>{weight} lbs</p>
        </div>
      )}
      {notes && (
        <div className="col-span-2">
          <p className="text-sm font-medium text-gray-500">Notes</p>
          <p className="whitespace-pre-line">{notes}</p>
        </div>
      )}
    </div>
  );
}
