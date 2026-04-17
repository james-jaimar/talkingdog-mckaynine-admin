import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { MessageSquare, Search, RefreshCw, Check } from "lucide-react";
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
import {
  useTrainerNotes,
  usePendingTrainerNoteCount,
} from "@/hooks/useTrainerNotes";
import { useAuth } from "@/context/auth";

const STATUS_OPTIONS = [
  { value: "all", label: "All Notes" },
  { value: "pending", label: "Unread" },
  { value: "completed", label: "Acknowledged" },
];

export default function TrainerNotes() {
  const { trainerProfile } = useAuth();
  const trainerId = trainerProfile?.id as string | undefined;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const { notes, isLoading, refetch, acknowledgeNote } = useTrainerNotes({
    status: statusFilter,
    search,
    trainerId,
  });

  const { count: pendingCount } = usePendingTrainerNoteCount(undefined, trainerId);

  const sortedNotes = useMemo(() => notes, [notes]);

  const isFromSubstitute = (note: any) =>
    !!note.target_trainer_id &&
    note.target_trainer_id === trainerId &&
    note.created_by_trainer_id !== trainerId;

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
              My Notes
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} unread
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Notes left for you by substitute trainers, plus notes you have written.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

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

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Handler</TableHead>
                  <TableHead className="min-w-[300px]">Note</TableHead>
                  <TableHead>From</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No notes yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedNotes.map((note: any) => (
                    <TableRow key={note.id}>
                      <TableCell>
                        {note.handler ? (
                          <span className="font-medium">
                            {note.handler.first_name} {note.handler.last_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
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
                        {isFromSubstitute(note) ? (
                          <Badge variant="outline">Substitute</Badge>
                        ) : (
                          <Badge variant="secondary">You</Badge>
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
                        {note.status === "pending" && isFromSubstitute(note) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeNote.mutate(note.id)}
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
