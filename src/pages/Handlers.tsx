import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddHandlerModal } from "@/components/handlers/AddHandlerModal";
import { ImportHandlersModal } from "@/components/handlers/import/ImportHandlersModal";
import { HandlerSearchBar } from "@/components/handlers/HandlerSearchBar";
import { HandlerAlphabetPagination } from "@/components/handlers/HandlerAlphabetPagination";
import { HandlerTable } from "@/components/handlers/HandlerTable";
import { HandlerFilters, HandlerFilter } from "@/components/handlers/HandlerFilters";
import { useHandlersData } from "@/components/handlers/hooks/useHandlersData";
import { Helmet } from "react-helmet";
import { useEffect } from "react";

export default function Handlers() {
  const { 
    handlers, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    currentGroup, 
    setCurrentGroup, 
    actionFilter,
    setActionFilter,
    filterCounts,
    itemsPerPage,
    refetch
  } = useHandlersData();

  // Fetch data once on mount - no interval refetching
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Handlers - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Handlers</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" className="flex items-center gap-1" id="add-handler-trigger">
              <Plus className="h-4 w-4 mr-1" />
              <AddHandlerModal />
            </Button>
            <Button variant="outline" className="flex items-center gap-1">
              <ImportHandlersModal />
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1 w-full">
          {/* Search and filter */}
          <div className="flex flex-col gap-4">
            <HandlerSearchBar 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery} 
            />
            
            {/* Action Filters */}
            <HandlerFilters
              currentFilter={actionFilter as HandlerFilter}
              onFilterChange={(filter) => setActionFilter(filter)}
              counts={filterCounts}
            />
          </div>
          
          {/* Alphabet pagination - only show when filter is 'all' and no search */}
          {actionFilter === 'all' && !searchQuery && (
            <div className="overflow-x-auto">
              <HandlerAlphabetPagination 
                currentGroup={currentGroup} 
                onGroupChange={(group) => {
                  setCurrentGroup(group);
                  setSearchQuery("");
                }} 
              />
            </div>
          )}
          
          {/* Handlers list */}
          <Card className="border border-gray-200 shadow-sm w-full">
            <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle>
                {actionFilter !== 'all' 
                  ? `Handlers with "${actionFilter.replace('_', ' ')}" status`
                  : searchQuery 
                    ? `Search: "${searchQuery}"` 
                    : `All Handlers (${currentGroup})`
                }
                {handlers.length > 0 && ` - ${handlers.length} found`}
              </CardTitle>
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
