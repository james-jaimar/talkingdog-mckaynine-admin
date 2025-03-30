
interface NotesTabProps {
  notes?: string;
  emptyMessage: string;
}

export function NotesTab({ notes, emptyMessage }: NotesTabProps) {
  return notes ? (
    <div>
      <p className="whitespace-pre-line">{notes}</p>
    </div>
  ) : (
    <p className="text-gray-500 italic">{emptyMessage}</p>
  );
}
