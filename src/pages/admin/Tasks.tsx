
import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllTasks, TaskWithHandler } from "@/hooks/useAllTasks";
import { useAvailableTerms } from "@/hooks/useAvailableTerms";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Send, ClipboardList, Mail, UserPlus, RefreshCw, Link, Plus, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare, Calendar, Pencil, Trash2 } from "lucide-react";
import { SendInfoPackModal } from "@/components/tasks/SendInfoPackModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { Link as RouterLink } from "react-router-dom";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

type SortDirection = "asc" | "desc" | null;

const TASK_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "send_info_pack", label: "Send Info Pack" },
  { value: "enrollment", label: "Enrollment" },
  { value: "follow_up", label: "Follow Up" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const CLASS_TYPE_OPTIONS = [
  { value: "all", label: "All Classes" },
  { value: "Puppy", label: "Puppy" },
  { value: "EO", label: "EO" },
  { value: "CGC Bronze", label: "CGC Bronze" },
  { value: "CGC Silver", label: "CGC Silver" },
  { value: "Beginner", label: "Beginner" },
  { value: "Novice", label: "Novice" },
  { value: "WT", label: "WT" },
  { value: "A-Test", label: "A-Test" },
  { value: "Yoga", label: "Yoga" },
];

function getTaskTypeIcon(type: string) {
  switch (type) {
    case "send_info_pack":
      return <Mail className="h-4 w-4" />;
    case "enrollment":
      return <UserPlus className="h-4 w-4" />;
    case "follow_up":
      return <RefreshCw className="h-4 w-4" />;
    case "trainer_note":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
}

function getStatusBadgeVariant(status: string | null) {
  switch (status) {
    case "pending":
      return "default";
    case "completed":
      return "secondary";
    case "cancelled":
      return "outline";
    default:
      return "default";
  }
}

export default function Tasks() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const { terms: availableTerms } = useAvailableTerms();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [classTypeFilter, setClassTypeFilter] = useState("all");
  const [termFilter, setTermFilter] = useState<string | undefined>(undefined);

  // Default term filter to current term once data is loaded
  useEffect(() => {
    if (termFilter === undefined && termData?.id) {
      setTermFilter(termData.id);
    } else if (termFilter === undefined && !termData) {
      setTermFilter("all");
    }
  }, [termData, termFilter]);
  const [selectedTask, setSelectedTask] = useState<TaskWithHandler | null>(null);
  const [isInfoPackModalOpen, setIsInfoPackModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithHandler | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [handlerSort, setHandlerSort] = useState<SortDirection>(null);

  const { tasks, isLoading, completeTask, cancelTask, updateTask, deleteTask, refetch } = useAllTasks({
    status: statusFilter,
    taskType: taskTypeFilter,
    classType: classTypeFilter,
    search,
    targetTermId: termFilter,
  }, currentBranch?.id);

  // Sort tasks by handler name
  const sortedTasks = useMemo(() => {
    if (!handlerSort) return tasks;
    
    return [...tasks].sort((a, b) => {
      const nameA = a.handler 
        ? `${a.handler.first_name} ${a.handler.last_name}`.toLowerCase() 
        : "zzz"; // Push unknown handlers to end
      const nameB = b.handler 
        ? `${b.handler.first_name} ${b.handler.last_name}`.toLowerCase() 
        : "zzz";
      
      if (handlerSort === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }, [tasks, handlerSort]);

  const toggleHandlerSort = () => {
    setHandlerSort(current => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  const handleSendInfoPack = (task: TaskWithHandler) => {
    setSelectedTask(task);
    setIsInfoPackModalOpen(true);
  };

  const handleComplete = async (taskId: string) => {
    await completeTask.mutateAsync(taskId);
  };

  const handleCancel = async (taskId: string) => {
    await cancelTask.mutateAsync(taskId);
  };

  const handleEdit = (task: TaskWithHandler) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (taskId: string, updates: Record<string, any>) => {
    await updateTask.mutateAsync({ taskId, updates });
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task? This cannot be undone.")) {
      await deleteTask.mutateAsync(taskId);
    }
  };

  const pendingCount = sortedTasks.filter(t => t.status === "pending").length;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Tasks | McKaynine</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Task Dashboard
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              View and manage handler tasks, send info packs, and track follow-ups
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateTaskModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
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
              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={classTypeFilter} onValueChange={setClassTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Class Type" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={termFilter || "all"} onValueChange={setTermFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {availableTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              {sortedTasks.length} task{sortedTasks.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "pending"
                    ? "All caught up! No pending tasks."
                    : "Try adjusting your filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={toggleHandlerSort}
                    >
                      <div className="flex items-center gap-1">
                        Handler
                        {handlerSort === null && <ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
                        {handlerSort === "asc" && <ArrowUp className="h-4 w-4" />}
                        {handlerSort === "desc" && <ArrowDown className="h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        {task.handler ? (
                          <div>
                            <RouterLink 
                              to={`/handlers/${task.handler.id}`}
                              className="font-medium hover:underline flex items-center gap-1"
                            >
                              {task.handler.first_name} {task.handler.last_name}
                              <Link className="h-3 w-3" />
                            </RouterLink>
                            <span className="text-sm text-muted-foreground">
                              {task.handler.email}
                            </span>
                            {task.dog_name && (
                              <span className="text-xs text-muted-foreground block">
                                🐕 {task.dog_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTaskTypeIcon(task.task_type)}
                          {task.task_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.class_type ? (
                          <Badge variant="secondary">{task.class_type}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.target_term ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Calendar className="h-3 w-3" />
                            Term {task.target_term.term_number} {task.target_term.academic_years?.year || ""}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.created_at
                          ? format(new Date(task.created_at), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {task.task_type === "send_info_pack" && (
                            <Button
                              size="sm"
                              variant={task.status === "completed" ? "outline" : "default"}
                              onClick={() => handleSendInfoPack(task)}
                            >
                              <Send className="mr-1 h-4 w-4" />
                              {task.status === "completed" ? "Resend" : "Send"}
                            </Button>
                          )}
                          {task.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleComplete(task.id)}
                                title="Mark as complete"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancel(task.id)}
                                title="Cancel task"
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <SendInfoPackModal
        open={isInfoPackModalOpen}
        onOpenChange={setIsInfoPackModalOpen}
        task={selectedTask}
      />

      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
      />
    </DashboardLayout>
  );
}
