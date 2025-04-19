import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
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
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { EditHandlerModal } from "./EditHandlerModal";
import { useToast } from "@/hooks/use-toast";
import { deleteHandler } from "@/lib/api/handlers";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

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
  const [pageIndex, setPageIndex] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setPageIndex(0); // Reset to the first page when handlers or searchQuery changes
  }, [handlers, searchQuery]);

  const columns: ColumnDef<ClientData>[] = [
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
                <DotsHorizontalIcon className="h-4 w-4" />
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
      pagination: {
        pageIndex,
        pageSize: itemsPerPage,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        setPageIndex((prev) => updater(prev));
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
  });

  // Filter handlers based on search query
  const filteredHandlers = handlers.filter((handler) => {
    const fullName = `${handler.first_name} ${handler.last_name || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Handler row component
  const HandlerRow = ({ handler, index }: { handler: ClientData; index: number }) => {
    return (
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
        <TableCell>{handler.phone}</TableCell>
        <TableCell>{handler.address}</TableCell>
        <TableCell>{handler.city}</TableCell>
        <TableCell>{handler.postal_code}</TableCell>
        <TableCell>{handler.notes}</TableCell>
        <TableCell>{handler.branch_id}</TableCell>
        <TableCell>
          <EditHandlerModal handler={handler} />
        </TableCell>
      </TableRow>
    );
  };

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
                  pageIndex * itemsPerPage,
                  (pageIndex + 1) * itemsPerPage
                )
                .map((handler, index) => (
                  <HandlerRow key={handler.id} handler={handler} index={index} />
                ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2 px-4">
        <div className="text-sm text-gray-500">
          {pageIndex * itemsPerPage + 1} -{" "}
          {Math.min((pageIndex + 1) * itemsPerPage, filteredHandlers.length)}{" "}
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
  );
}
