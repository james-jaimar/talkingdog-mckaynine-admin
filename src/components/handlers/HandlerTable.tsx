
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
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
        {handlers.slice(0, itemsPerPage).map((handler) => {
          // Find class enrollments for the first dog
          const firstDog = handler.dogs && handler.dogs.length > 0 ? handler.dogs[0] : null;
          const enrollments = firstDog ? firstDog.class_enrollments : [];
          const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;

          // Check for WhatsApp and Photo Permission in notes
          const whatsApp = extractPreference(handler.notes, "WhatsApp");
          const photoPermission = extractPreference(handler.notes, "Photo Permission");
          
          // Extract comments from notes (any text that isn't about WhatsApp or Photo Permission)
          const notesWithoutPreferences = handler.notes
            ? handler.notes
                .split('\n')
                .filter((line: string) => !line.includes("WhatsApp:") && !line.includes("Photo Permission:"))
                .join('\n')
            : '';
            
          return (
            <TableRow key={handler.id}>
              <TableCell className="font-medium">
                {handler.first_name}
              </TableCell>
              <TableCell>{handler.email}</TableCell>
              <TableCell>
                {handler.dogs && handler.dogs.length > 0 
                  ? handler.dogs.map((dog: any) => dog.name).join(", ")
                  : "-"}
              </TableCell>
              <TableCell>
                {handler.dogs && handler.dogs.length > 0 
                  ? handler.dogs.map((dog: any) => dog.breed).join(", ")
                  : "-"}
              </TableCell>
              <TableCell>
                {handler.dogs && handler.dogs.length > 0 
                  ? handler.dogs[0].date_of_birth || extractDOB(handler.dogs[0])
                  : "-"}
              </TableCell>
              <TableCell>
                {handler.dogs && handler.dogs.length > 0 && handler.dogs[0].behavior_notes
                  ? handler.dogs[0].behavior_notes.substring(0, 20) + (handler.dogs[0].behavior_notes.length > 20 ? "..." : "")
                  : "-"}
              </TableCell>
              <TableCell>{formatPhoneNumber(handler.phone)}</TableCell>
              <TableCell className="text-xs">
                {enrollment?.puppy_class || "-"}
              </TableCell>
              <TableCell className="text-xs">
                {enrollment?.eo_class || "-"}
              </TableCell>
              <TableCell className="text-xs">
                {enrollment?.bronze_cgc_class || "-"}
              </TableCell>
              <TableCell className="text-xs">
                {enrollment?.silver_cgc_class || "-"}
              </TableCell>
              <TableCell className="text-xs">
                {enrollment?.beginner_novice_class || "-"}
              </TableCell>
              <TableCell className="text-xs">
                {enrollment?.wt_class || "-"}
              </TableCell>
              <TableCell className="text-xs">
                {enrollment?.yoga_class || "-"}
              </TableCell>
              <TableCell>
                {notesWithoutPreferences 
                  ? (notesWithoutPreferences.substring(0, 20) + (notesWithoutPreferences.length > 20 ? "..." : ""))
                  : "-"}
              </TableCell>
              <TableCell className="text-center">
                {whatsApp ? "Yes" : "No"}
              </TableCell>
              <TableCell className="text-center">
                {photoPermission ? "Yes" : "No"}
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/handlers/${handler.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
