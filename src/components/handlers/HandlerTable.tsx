
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { EditHandlerModal } from "./EditHandlerModal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteHandler } from "@/lib/api/handlers"; // Import from API lib
import { Checkbox } from "@/components/ui/checkbox";
import { TablePagination } from "@/components/ui/table-pagination";

interface ClientData {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string;
}

interface HandlerTableProps {
  handlers: ClientData[];
  searchQuery: string;
  itemsPerPage: number;
  loading: boolean;
}

export function HandlerTable({ handlers, searchQuery, itemsPerPage, loading }: HandlerTableProps) {
  // Use a pagination state object instead of just a page number
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: itemsPerPage,
  });
  const [selectedHandlers, setSelectedHandlers] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Reset to the first page when handlers or searchQuery changes
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [handlers, searchQuery]);

  const toggleSelectHandler = (id: string) => {
    setSelectedHandlers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAll = () => {
    const currentPageHandlers = filteredHandlers
      .slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize);
    
    const allSelected = currentPageHandlers.every(handler => selectedHandlers[handler.id]);
    
    const newSelectedHandlers = { ...selectedHandlers };
    currentPageHandlers.forEach(handler => {
      newSelectedHandlers[handler.id] = !allSelected;
    });
    
    setSelectedHandlers(newSelectedHandlers);
  };

  const columns: ColumnDef<ClientData>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const currentPageHandlers = filteredHandlers
          .slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize);
        const allSelected = currentPageHandlers.length > 0 && 
          currentPageHandlers.every(handler => selectedHandlers[handler.id]);
        
        return (
          <Checkbox 
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => {
        const handler = row.original;
        const isSelected = !!selectedHandlers[handler.id];
        
        return (
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => toggleSelectHandler(handler.id)}
            aria-label={`Select ${handler.first_name}`}
          />
        );
      },
    },
    {
      accessorKey: "first_name",
      header: "First Name",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const handler = row.original;
        const [isDeleting, setIsDeleting] = useState(false);

        const handleDelete = async () => {
          setIsDeleting(true);
          try {
            await deleteHandler(handler.id);
            toast({
              title: "Handler deleted",
              description: "The handler has been deleted successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["handlers"] });
          } catch (error) {
            console.error("Error deleting handler:", error);
            toast({
              variant: "destructive",
              title: "Failed to delete handler",
              description: "There was an error deleting the handler",
            });
          } finally {
            setIsDeleting(false);
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <EditHandlerModal handler={handler} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: handlers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil(handlers.length / itemsPerPage),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    manualPagination: false,
  });

  // Filter handlers based on search query
  const filteredHandlers = handlers.filter((handler) => {
    const fullName = `${handler.first_name} ${handler.last_name || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (handler.email && handler.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (handler.phone && handler.phone.includes(searchQuery));
  });

  const totalPages = Math.ceil(filteredHandlers.length / pagination.pageSize);

  return (
    <div className="rounded-md border">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  Loading handlers...
                </td>
              </tr>
            ) : filteredHandlers.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  No handlers found.
                </td>
              </tr>
            ) : (
              filteredHandlers
                .slice(
                  pagination.pageIndex * pagination.pageSize,
                  (pagination.pageIndex + 1) * pagination.pageSize
                )
                .map((handler, index) => (
                  <TableRow key={handler.id}>
                    <TableCell>
                      <Checkbox 
                        checked={!!selectedHandlers[handler.id]}
                        onCheckedChange={() => toggleSelectHandler(handler.id)}
                        aria-label={`Select ${handler.first_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/handlers/${handler.id}`}
                        className="hover:text-blue-600 font-medium"
                      >
                        {handler.first_name} {handler.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{handler.email}</TableCell>
                    <TableCell>{handler.phone}</TableCell>
                    <TableCell>
                      <EditHandlerModal handler={handler} />
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        {selectedHandlers && Object.values(selectedHandlers).filter(Boolean).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {Object.values(selectedHandlers).filter(Boolean).length} handlers selected
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedHandlers({})}
            >
              Clear selection
            </Button>
          </div>
        )}
        <div className="ml-auto flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {pagination.pageIndex * pagination.pageSize + 1} -{" "}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredHandlers.length)}{" "}
            of {filteredHandlers.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
