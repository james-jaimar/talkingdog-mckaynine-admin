
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  extractClassNotes, 
  extractDOB, 
  extractPreference, 
  formatPhoneNumber 
} from "./utils/handlerUtils";

interface HandlerTableProps {
  handlers: any[] | null;
  searchQuery: string;
  itemsPerPage: number;
  loading: boolean;
}

export function HandlerTable({ 
  handlers, 
  searchQuery, 
  itemsPerPage, 
  loading 
}: HandlerTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse text-gray-500">Loading handlers...</div>
      </div>
    );
  }

  if (!handlers || handlers.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium mb-2">No handlers found</h3>
        <p className="text-sm text-gray-500 mb-8">
          {searchQuery ? "Try a different search term" : `No handlers in this category`}
        </p>
        <Button 
          onClick={() => document.getElementById('add-handler-trigger')?.click()}
          variant="mckaynine"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span>Add Your First Handler</span>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Dog's Name</TableHead>
          <TableHead>Breed</TableHead>
          <TableHead>DOB</TableHead>
          <TableHead>Assess</TableHead>
          <TableHead>Tel</TableHead>
          <TableHead>PUPPY</TableHead>
          <TableHead>EO</TableHead>
          <TableHead>BRONZE CGC</TableHead>
          <TableHead>SILVER CGC</TableHead>
          <TableHead>BEGINNER/Novice</TableHead>
          <TableHead>WT</TableHead>
          <TableHead>YOGA</TableHead>
          <TableHead>COMMENTS</TableHead>
          <TableHead>WhatsApp</TableHead>
          <TableHead>Photo Permission</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {handlers.slice(0, itemsPerPage).map((handler) => (
          <TableRow key={handler.id}>
            <TableCell className="font-medium">
              {handler.first_name} {handler.last_name}
            </TableCell>
            <TableCell>{handler.email}</TableCell>
            <TableCell>
              {handler.dogs.length > 0 
                ? handler.dogs.map(dog => dog.name).join(", ")
                : "-"}
            </TableCell>
            <TableCell>
              {handler.dogs.length > 0 
                ? handler.dogs.map(dog => dog.breed).join(", ")
                : "-"}
            </TableCell>
            <TableCell>
              {handler.dogs.length > 0 
                ? extractDOB(handler.dogs[0])
                : "-"}
            </TableCell>
            <TableCell>
              {handler.dogs.length > 0 && handler.dogs[0].behavior_notes
                ? handler.dogs[0].behavior_notes.substring(0, 20) + (handler.dogs[0].behavior_notes.length > 20 ? "..." : "")
                : "-"}
            </TableCell>
            <TableCell>{formatPhoneNumber(handler.phone)}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "PUPPY")}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "EO")}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "BRONZE CGC")}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "SILVER CGC")}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "BEGINNER/NOVICE")}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "WT")}</TableCell>
            <TableCell>{extractClassNotes(handler.notes, "YOGA")}</TableCell>
            <TableCell>
              {handler.notes 
                ? (handler.notes.includes("COMMENTS:") 
                  ? extractClassNotes(handler.notes, "COMMENTS") 
                  : handler.notes.substring(0, 20) + (handler.notes.length > 20 ? "..." : ""))
                : "-"}
            </TableCell>
            <TableCell className="text-center">
              <Checkbox
                checked={extractPreference(handler.notes, "WhatsApp")}
                disabled
              />
            </TableCell>
            <TableCell className="text-center">
              <Checkbox
                checked={extractPreference(handler.notes, "Photo Permission")}
                disabled
              />
            </TableCell>
            <TableCell className="text-right">
              <Link to={`/handlers/${handler.id}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
