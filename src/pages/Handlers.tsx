
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AddHandlerModal } from "@/components/handlers/AddHandlerModal";
import { ImportHandlersModal } from "@/components/handlers/ImportHandlersModal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Handlers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredHandlers = handlers?.filter(handler => 
    (handler.first_name + " " + handler.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.dogs.some(dog => 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Pagination logic
  const totalPages = filteredHandlers ? Math.ceil(filteredHandlers.length / itemsPerPage) : 0;
  const paginatedHandlers = filteredHandlers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper function to extract class-specific notes
  const extractClassNotes = (notes: string | null, className: string) => {
    if (!notes) return "";
    
    const regex = new RegExp(`${className}:\\s*(.*?)(?=\\n[A-Z\\s]+:|$)`, "s");
    const match = notes.match(regex);
    return match ? match[1].trim() : "";
  };

  // Helper function to extract preferences
  const extractPreference = (notes: string | null, preference: string) => {
    if (!notes) return "";
    
    const regex = new RegExp(`${preference}:\\s*(Yes|No)`, "i");
    const match = notes.match(regex);
    return match ? match[1] : "";
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
          
          {/* Handlers list */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle>All Handlers</CardTitle>
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
              ) : paginatedHandlers && paginatedHandlers.length > 0 ? (
                <>
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
                      {paginatedHandlers.map((handler) => (
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
                            {handler.dogs.length > 0 && handler.dogs[0].age 
                              ? `${handler.dogs[0].age} years`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {handler.dogs.length > 0 && handler.dogs[0].behavior_notes
                              ? handler.dogs[0].behavior_notes.substring(0, 20) + (handler.dogs[0].behavior_notes.length > 20 ? "..." : "")
                              : "-"}
                          </TableCell>
                          <TableCell>{handler.phone || "-"}</TableCell>
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
                          <TableCell>{extractPreference(handler.notes, "WhatsApp")}</TableCell>
                          <TableCell>{extractPreference(handler.notes, "Photo Permission")}</TableCell>
                          <TableCell className="text-right">
                            <Link to={`/handlers/${handler.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="py-4 border-t">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-xl font-medium mb-2">No handlers found</h3>
                  <p className="text-sm text-gray-500 mb-8">
                  {searchQuery ? "Try a different search term" : "Add your first handler to get started"}
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
