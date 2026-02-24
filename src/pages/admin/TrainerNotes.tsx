import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrainerNotes, usePendingTrainerNoteCount } from "@/hooks/useTrainerNotes";
import { useBranch } from "@/context/BranchContext";

const STATUS_OPTIONS = [
  { value: "all", label: "All Notes" },
  { value: "pending", label: "Unacknowledged" },
  { value: "completed", label: "Acknowledged" },
];

type SortDirection = "asc" | "desc" | null;

export default function TrainerNotes() {
  const { currentBranch } = useBranch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [handlerSort, setHandlerSort] = useState<SortDirection>(null);

  const { notes, isLoading, refetch, acknowledgeNote } = useTrainerNotes({
    status: statusFilter,
    search,
  }, currentBranch?.id);

  const { count: pendingCount } = usePendingTrainerNoteCount(currentBranch?.id);

  // Sort notes by handler name
  const sortedNotes = useMemo(() => {
    if (!handlerSort) return notes;
    
    return [...notes].sort((a, b) => {
      const nameA = a.handler 
        ? `${a.handler.first_name} ${a.handler.last_name}`.toLowerCase() 
        : "zzz";
      const nameB = b.handler 
        ? `${b.handler.first_name} ${b.handler.last_name}`.toLowerCase() 
        : "zzz";
      
      if (handlerSort === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }, [notes, handlerSort]);

  const toggleHandlerSort = () => {
    if (handlerSort === null) setHandlerSort("asc");
    else if (handlerSort === "asc") setHandlerSort("desc");
    else setHandlerSort(null);
  };

  const getSortIcon = () => {
    if (handlerSort === "asc") return <ArrowUp className="h-4 w-4 ml-1" />;
    if (handlerSort === "desc") return <ArrowDown className="h-4 w-4 ml-1" />;
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  const handleAcknowledge = (noteId: string) => {
    acknowledgeNote.mutate(noteId);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Trainer Notes | McKaynine</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Trainer Notes
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} unread
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Review notes left by trainers about handlers
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by handler name or note content..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={toggleHandlerSort}
                  >
                    <div className="flex items-center">
                      Handler
                      {getSortIcon()}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[300px]">Note</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No trainer notes found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>
                        {note.handler ? (
                          <Link 
                            to={`/handlers/${note.handler.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {note.handler.first_name} {note.handler.last_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                        {note.handler?.email && (
                          <div className="text-xs text-muted-foreground">
                            {note.handler.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{note.title}</div>
                        {note.description && (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                            {note.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={note.status === "pending" ? "destructive" : "secondary"}
                        >
                          {note.status === "pending" ? "Unread" : "Acknowledged"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {note.created_at && format(new Date(note.created_at), "MMM d, yyyy")}
                        <div className="text-xs text-muted-foreground">
                          {note.created_at && format(new Date(note.created_at), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {note.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(note.id)}
                            disabled={acknowledgeNote.isPending}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Acknowledge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
