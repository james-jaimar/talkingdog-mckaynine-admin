
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddHandlerModal } from "@/components/handlers/AddHandlerModal";
import { ImportHandlersModal } from "@/components/handlers/ImportHandlersModal";
import { HandlerSearchBar } from "@/components/handlers/HandlerSearchBar";
import { HandlerAlphabetPagination } from "@/components/handlers/HandlerAlphabetPagination";
import { HandlerTable } from "@/components/handlers/HandlerTable";
import { useHandlersData } from "@/components/handlers/hooks/useHandlersData";
import { Helmet } from "react-helmet";

export default function Handlers() {
  const { 
    handlers, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    currentGroup, 
    setCurrentGroup, 
    itemsPerPage 
  } = useHandlersData();

  return (
    <DashboardLayout>
      <Helmet>
        <title>Handlers - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Handlers</h1>
          <div className="flex flex-wrap gap-2">
            <AddHandlerModal />
            <ImportHandlersModal />
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1 w-full">
          {/* Search and filter */}
          <HandlerSearchBar 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
          />
          
          {/* Alphabet pagination */}
          <div className="overflow-x-auto">
            <HandlerAlphabetPagination 
              currentGroup={currentGroup} 
              onGroupChange={(group) => {
                setCurrentGroup(group);
                setSearchQuery("");
              }} 
            />
          </div>
          
          {/* Handlers list */}
          <Card className="border border-gray-200 shadow-sm w-full">
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
              <HandlerTable 
                handlers={handlers} 
                searchQuery={searchQuery}
                itemsPerPage={itemsPerPage}
                loading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
