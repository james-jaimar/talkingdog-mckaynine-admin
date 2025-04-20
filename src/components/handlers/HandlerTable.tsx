
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
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { EditHandlerModal } from "./EditHandlerModal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteHandler } from "@/lib/api/handlers"; // Import from API lib
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
  dogs?: any[];
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Reset to the first page when handlers or searchQuery changes
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [handlers, searchQuery]);

  const columns: ColumnDef<ClientData>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const handler = row.original;
        return (
          <Link 
            to={`/handlers/${handler.id}`}
            className="hover:text-blue-600 font-medium"
          >
            {handler.first_name} {handler.last_name}
          </Link>
        );
      }
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
      accessorKey: "dogs",
      header: "Dogs",
      cell: ({ row }) => {
        const handler = row.original;
        return (
          <span>{handler.dogs?.length || 0}</span>
        );
      }
    },
    {
      accessorKey: "invoices",
      header: "Invoices",
      cell: () => {
        // This is a placeholder; in the screenshot it shows either a dash or a document icon with a count
        return (
          <span>—</span>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
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
          <div className="flex justify-end items-center space-x-1">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/handlers/${handler.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            
            <EditHandlerModal handler={handler}>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </EditHandlerModal>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={`/handlers/${handler.id}`}>
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.getElementById(`edit-handler-${handler.id}`)?.click()}>
                  Edit handler
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                  Delete handler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
  const startItem = pagination.pageIndex * pagination.pageSize + 1;
  const endItem = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredHandlers.length);

  return (
    <div className="rounded-md border">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Dogs</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4">
                  Loading handlers...
                </TableCell>
              </TableRow>
            ) : filteredHandlers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4">
                  No handlers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredHandlers
                .slice(
                  pagination.pageIndex * pagination.pageSize,
                  (pagination.pageIndex + 1) * pagination.pageSize
                )
                .map((handler) => (
                  <TableRow key={handler.id}>
                    <TableCell>
                      <Link 
                        to={`/handlers/${handler.id}`}
                        className="hover:text-blue-600 font-medium"
                      >
                        {handler.first_name} {handler.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{handler.email}</TableCell>
                    <TableCell>{handler.phone || "—"}</TableCell>
                    <TableCell>{handler.dogs?.length || 0}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/handlers/${handler.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        
                        <EditHandlerModal handler={handler}>
                          <Button variant="ghost" size="icon" id={`edit-handler-${handler.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </EditHandlerModal>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/handlers/${handler.id}`}>
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => document.getElementById(`edit-handler-${handler.id}`)?.click()}>
                              Edit handler
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete()} disabled={isDeleting} className="text-red-600">
                              Delete handler
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm text-gray-500">
          {filteredHandlers.length > 0 ? 
            `${startItem} - ${endItem} of ${filteredHandlers.length}` : 
            'No results'}
        </div>
        <div className="ml-auto flex items-center space-x-2">
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
