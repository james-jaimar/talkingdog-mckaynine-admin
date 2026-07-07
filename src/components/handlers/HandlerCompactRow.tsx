import { useState } from "react";
import { Link } from "react-router-dom";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "./table/ActionMenu";
import { HandlerNotesSheet } from "./table/HandlerNotesSheet";
import { highlightMatch } from "./utils/highlightMatch";

interface Dog {
  id: string;
  name: string;
  breed?: string;
}

interface HandlerCompactRowProps {
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    dogs?: Dog[];
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
    branch_id?: string | null;
  };
  searchQuery: string;
  isEven: boolean;
}

export function HandlerCompactRow({ handler, searchQuery, isEven }: HandlerCompactRowProps) {
  const [showNotesSheet, setShowNotesSheet] = useState(false);
  const fullName = `${handler.first_name} ${handler.last_name || ''}`.trim();
  const dogs = handler.dogs || [];

  return (
    <>
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 border-b border-gray-100 ${
          isEven ? 'bg-white' : 'bg-gray-50/50'
        } hover:bg-mckaynine-50/40 transition-colors`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Link
              to={`/handlers/${handler.id}`}
              className="font-medium hover:text-blue-600 truncate"
            >
              {highlightMatch(fullName, searchQuery)}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setShowNotesSheet(true)}
              title="Notes & Tasks"
            >
              <StickyNote
                className={`h-3.5 w-3.5 hover:text-primary ${
                  handler.notes ? 'text-amber-500' : 'text-muted-foreground'
                }`}
              />
            </Button>
            <span className="text-sm text-muted-foreground truncate">
              {handler.email && (
                <>· {highlightMatch(handler.email, searchQuery)}</>
              )}
              {handler.phone && (
                <> · {highlightMatch(handler.phone, searchQuery)}</>
              )}
            </span>
          </div>

          <div className="mt-1 text-sm text-gray-700">
            {dogs.length === 0 ? (
              <span className="text-muted-foreground italic">No dogs</span>
            ) : (
              <span>
                <span className="text-muted-foreground mr-1">
                  Dogs ({dogs.length}):
                </span>
                {dogs.map((dog, idx) => (
                  <span key={dog.id}>
                    <span className="font-medium">
                      {highlightMatch(dog.name, searchQuery)}
                    </span>
                    {dog.breed && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({highlightMatch(dog.breed, searchQuery)})
                      </span>
                    )}
                    {idx < dogs.length - 1 && <span className="text-muted-foreground"> · </span>}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <ActionMenu handler={handler} />
        </div>
      </div>

      <HandlerNotesSheet
        open={showNotesSheet}
        onOpenChange={setShowNotesSheet}
        handler={handler}
      />
    </>
  );
}
