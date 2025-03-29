
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

export default function Handlers() {
  const [searchQuery, setSearchQuery] = useState("");

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
          dogs (
            id,
            name,
            breed
          )
        `)
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredHandlers = handlers?.filter(handler => 
    handler.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.dogs.some(dog => 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Handlers</h1>
          <AddHandlerModal />
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
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-pulse text-gray-500">Loading handlers...</div>
                </div>
              ) : filteredHandlers && filteredHandlers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Dogs</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHandlers.map((handler) => (
                      <TableRow key={handler.id}>
                        <TableCell className="font-medium">
                          {handler.first_name} {handler.last_name}
                        </TableCell>
                        <TableCell>{handler.email}</TableCell>
                        <TableCell>{handler.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {handler.dogs.map((dog) => (
                              <span key={dog.id} className="text-sm">
                                {dog.name} ({dog.breed})
                              </span>
                            ))}
                            {handler.dogs.length === 0 && (
                              <span className="text-sm text-gray-500">No dogs</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(handler.created_at).toLocaleDateString()}
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
                    {searchQuery ? "Try a different search term" : "Add your first handler to get started"}
                  </p>
                  <Button 
                    onClick={() => document.getElementById('add-handler-trigger')?.click()}
                    className="bg-mckaynine-600 hover:bg-mckaynine-700"
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
