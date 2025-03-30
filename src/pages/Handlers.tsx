
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AddHandlerModal } from "@/components/handlers/AddHandlerModal";
import { ImportHandlersModal } from "@/components/handlers/ImportHandlersModal";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

// Define the alphabet groups for pagination
const alphabetGroups = [
  { label: "A", range: ["A"] },
  { label: "B", range: ["B"] },
  { label: "C", range: ["C"] },
  { label: "D", range: ["D"] },
  { label: "E", range: ["E"] },
  { label: "F", range: ["F"] },
  { label: "G", range: ["G"] },
  { label: "H", range: ["H"] },
  { label: "I-J", range: ["I", "J"] },
  { label: "K", range: ["K"] },
  { label: "L", range: ["L"] },
  { label: "M-N", range: ["M", "N"] },
  { label: "O-P", range: ["O", "P"] },
  { label: "Q-R-S", range: ["Q", "R", "S"] },
  { label: "T-U-V", range: ["T", "U", "V"] },
  { label: "W-X-Y-Z", range: ["W", "X", "Y", "Z"] },
];

export default function Handlers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroup, setCurrentGroup] = useState("A");
  const itemsPerPage = 50;

  const { data: handlers, isLoading } = useQuery({
    queryKey: ['handlers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at,
          notes,
          dogs (
            id,
            name,
            breed,
            age,
            behavior_notes,
            notes,
            medical_notes
          )
        `)
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Filter handlers by search query
  const filteredHandlers = handlers?.filter(handler => 
    (handler.first_name + " " + handler.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.dogs.some(dog => 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filter by current alphabet group
  const currentGroupHandlers = searchQuery 
    ? filteredHandlers 
    : filteredHandlers?.filter(handler => {
        const firstLetter = handler.first_name.charAt(0).toUpperCase();
        const group = alphabetGroups.find(group => 
          group.range.some(letter => firstLetter === letter)
        );
        return group?.label === currentGroup;
      });

  // Helper function to extract class-specific notes
  const extractClassNotes = (notes: string | null, className: string) => {
    if (!notes) return "";
    
    const regex = new RegExp(`${className}:\\s*(.*?)(?=\\n[A-Z\\s]+:|$)`, "s");
    const match = notes.match(regex);
    return match ? match[1].trim() : "";
  };

  // Helper function to extract preferences
  const extractPreference = (notes: string | null, preference: string) => {
    if (!notes) return false;
    
    const regex = new RegExp(`${preference}:\\s*(Yes|No|True|False|1|0)`, "i");
    const match = notes.match(regex);
    if (!match) return false;
    
    const value = match[1].toLowerCase();
    return value === 'yes' || value === 'true' || value === '1';
  };

  // Extract date of birth from dog's age or notes
  const extractDOB = (dog: any) => {
    if (!dog) return "-";
    
    // Check if we have age in years, convert to approximate DOB
    if (dog.age) {
      const today = new Date();
      const birthYear = today.getFullYear() - dog.age;
      return format(new Date(birthYear, 0, 1), "dd/MM/yyyy");
    }
    
    // Try to find DOB in notes
    if (dog.notes && dog.notes.includes("DOB:")) {
      const regex = /DOB:\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/;
      const match = dog.notes.match(regex);
      if (match) {
        const dateStr = match[1];
        try {
          // Handle different date formats
          let date;
          if (dateStr.includes('/')) {
            // Format: DD/MM/YYYY
            const [day, month, year] = dateStr.split('/').map(Number);
            date = new Date(year, month - 1, day);
          } else {
            // Format: YYYY-MM-DD
            date = new Date(dateStr);
          }
          if (!isNaN(date.getTime())) {
            return format(date, "dd/MM/yyyy");
          }
        } catch (e) {
          // Return original string if parsing fails
          return dateStr;
        }
      }
    }
    
    return "-";
  };

  // Format phone number to ensure it starts with 0
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return "-";
    
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If the number doesn't start with 0, add it
    if (!cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    
    // Format with spaces for readability
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Handlers</h1>
          <div className="flex">
            <AddHandlerModal />
            <ImportHandlersModal />
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1">
          {/* Search and filter */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search handlers or dogs..."
                  className="pl-8 w-full max-w-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Alphabet pagination */}
          <div className="flex overflow-x-auto py-2 space-x-1">
            {alphabetGroups.map((group) => (
              <Button
                key={group.label}
                variant={currentGroup === group.label ? "default" : "outline"}
                className="min-w-10 px-2"
                onClick={() => {
                  setCurrentGroup(group.label);
                  setSearchQuery("");
                }}
              >
                {group.label}
              </Button>
            ))}
          </div>
          
          {/* Handlers list */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle>All Handlers {searchQuery ? `(Search: "${searchQuery}")` : `(${currentGroup})`}</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('add-handler-trigger')?.click()}
                className="flex items-center gap-1 text-mckaynine-600 border-mckaynine-300 hover:bg-mckaynine-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add New</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-pulse text-gray-500">Loading handlers...</div>
                </div>
              ) : currentGroupHandlers && currentGroupHandlers.length > 0 ? (
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
                    {currentGroupHandlers.slice(0, itemsPerPage).map((handler) => (
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
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-xl font-medium mb-2">No handlers found</h3>
                  <p className="text-sm text-gray-500 mb-8">
                  {searchQuery ? "Try a different search term" : `No handlers in the "${currentGroup}" category`}
                  </p>
                  <Button 
                    onClick={() => document.getElementById('add-handler-trigger')?.click()}
                    variant="mckaynine"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    <span>Add Your First Handler</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
