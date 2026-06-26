import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { ExtractedData } from "@/components/intake-scans/types";
import { googleFormPayloadToExtractedData } from "@/lib/google-form/toExtractedData";
import { saveEnrollmentSubmission } from "@/lib/enrollments/saveEnrollmentSubmission";
import { OwnerSection } from "@/components/intake-scans/review-panel/OwnerSection";
import { DogSection } from "@/components/intake-scans/review-panel/DogSection";

type Submission = {
  id: string;
  received_at: string;
  source: string;
  raw_payload: any;
  submitted_at: string | null;
  email: string | null;
  status: "received" | "ingested" | "failed" | "duplicate";
  error_message: string | null;
  client_id: string | null;
  dog_ids: string[] | null;
  enrollment_ids: string[] | null;
  branch_id: string | null;
};

const statusColor: Record<string, string> = {
  ingested: "bg-green-500/15 text-green-700 dark:text-green-400",
  received: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
  duplicate: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export function GoogleFormsReviewTab() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edited, setEdited] = useState<ExtractedData | null>(null);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["google-form-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_form_submissions")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Submission[];
    },
  });

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setEdited(null);
      return;
    }
    try {
      const ed = googleFormPayloadToExtractedData(selected.raw_payload);
      setEdited(ed);
    } catch (e) {
      console.error("Map error", e);
      setEdited(null);
    }
  }, [selectedId]);

  const approve = useMutation({
    mutationFn: async () => {
      if (!selected || !edited) throw new Error("Nothing selected");
      const result = await saveEnrollmentSubmission(edited);
      const { error } = await supabase
        .from("google_form_submissions")
        .update({
          status: "ingested",
          client_id: result.clientId,
          dog_ids: result.dogIds,
          enrollment_ids: result.enrollmentIds,
          branch_id: result.branchId,
          error_message: null,
        })
        .eq("id", selected.id);
      if (error) throw error;
      return result;
    },
    onSuccess: (r) => {
      toast.success(
        `Created handler with ${r.dogIds.length} dog(s), ${r.enrollmentIds.length} enrollment(s)`
      );
      qc.invalidateQueries({ queryKey: ["google-form-submissions"] });
      qc.invalidateQueries({ queryKey: ["handlers"] });
      setSelectedId(null);
    },
    onError: (e: any) => {
      toast.error(e.message);
      if (selected) {
        supabase
          .from("google_form_submissions")
          .update({ status: "failed", error_message: e.message })
          .eq("id", selected.id)
          .then(() => qc.invalidateQueries({ queryKey: ["google-form-submissions"] }));
      }
    },
  });

  const pendingCount = rows.filter((r) => r.status === "received" || r.status === "failed").length;

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-18rem)]">
      {/* Queue */}
      <Card className="col-span-4 flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Submissions ({pendingCount} pending)
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            {isLoading ? (
              <p className="p-4 text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="p-4 text-muted-foreground text-sm">
                No submissions yet. Once Shannon's Google Form fires, rows appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className={`px-3 py-2 cursor-pointer hover:bg-muted/50 ${
                      selectedId === r.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.email || "(no email)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.source} · {format(new Date(r.received_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                      <Badge variant="secondary" className={statusColor[r.status] || ""}>
                        {r.status}
                      </Badge>
                    </div>
                    {r.status === "ingested" && r.client_id && (
                      <Link
                        to={`/handlers/${r.client_id}`}
                        className="text-xs text-primary underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View handler →
                      </Link>
                    )}
                    {r.error_message && (
                      <p className="text-xs text-red-600 truncate">{r.error_message}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Review pane */}
      <Card className="col-span-8 flex flex-col min-h-0">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {selected ? `Review: ${selected.email || "submission"}` : "Select a submission"}
          </CardTitle>
          {selected && (
            <div className="flex gap-2">
              {selected.status === "ingested" ? (
                <Badge className="bg-green-600">Already ingested</Badge>
              ) : (
                <Button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending || !edited}
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {approve.isPending ? "Saving…" : "Approve & Create Handler"}
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Pick a submission from the left to review and ingest.
            </div>
          ) : !edited ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Unable to map this payload. Inspect raw JSON below.
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <OwnerSection
                  owner={edited.owner}
                  fieldConfidence={edited.field_confidence}
                  onUpdate={(o) => setEdited({ ...edited, owner: o })}
                />
                {edited.dogs.map((dog, i) => (
                  <DogSection
                    key={i}
                    dog={dog}
                    dogIndex={i}
                    fieldConfidence={edited.field_confidence}
                    onUpdate={(d) => {
                      const dogs = [...edited.dogs];
                      dogs[i] = d;
                      setEdited({ ...edited, dogs });
                    }}
                  />
                ))}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Raw payload
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                    {JSON.stringify(selected.raw_payload, null, 2)}
                  </pre>
                </details>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
