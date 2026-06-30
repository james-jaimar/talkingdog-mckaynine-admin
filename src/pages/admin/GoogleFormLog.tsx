import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { RefreshCw, Eye, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { extractDriveUrls } from "@/lib/google-form/extractDriveUrls";

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

export default function GoogleFormLog() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Submission | null>(null);

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

  const replayMutation = useMutation({
    mutationFn: async (sub: Submission) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-form-intake`;
      // Replay requires the shared secret — admins must enter it via the prompt.
      const secret = window.prompt("Enter GOOGLE_FORM_WEBHOOK_SECRET to replay:");
      if (!secret) throw new Error("Cancelled");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
        body: JSON.stringify(sub.raw_payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "Replay failed");
      return json;
    },
    onSuccess: () => {
      toast.success("Replayed");
      qc.invalidateQueries({ queryKey: ["google-form-submissions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <Helmet>
        <title>Google Form Log - McKaynine</title>
      </Helmet>
      <div className="py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Form Submissions</h1>
            <p className="text-muted-foreground">Raw log of every webhook submission from Google Forms.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent submissions ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground">No submissions yet. Once Shannon's Google Form fires, rows will appear here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-3">Received</th>
                      <th className="py-2 pr-3">Source</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Result</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {format(new Date(r.received_at), "yyyy-MM-dd HH:mm")}
                        </td>
                        <td className="py-2 pr-3">{r.source}</td>
                        <td className="py-2 pr-3">{r.email || "—"}</td>
                        <td className="py-2 pr-3">
                          <Badge variant="secondary" className={statusColor[r.status] || ""}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          {r.status === "ingested" && r.client_id ? (
                            <Link to={`/handlers/${r.client_id}`} className="text-primary underline">
                              View handler
                            </Link>
                          ) : r.status === "failed" ? (
                            <span className="text-red-600 text-xs">{r.error_message?.slice(0, 60)}</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3 flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(r.status === "failed" || r.status === "received") && (
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => replayMutation.mutate(r)}
                              disabled={replayMutation.isPending}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission detail</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-3 text-sm">
                <div><strong>Received:</strong> {format(new Date(selected.received_at), "PPpp")}</div>
                <div><strong>Source:</strong> {selected.source}</div>
                <div><strong>Status:</strong> {selected.status}</div>
                {(() => {
                  const urls = extractDriveUrls(selected.raw_payload);
                  if (urls.length === 0) return null;
                  return (
                    <div>
                      <strong>Drive attachments ({urls.length}):</strong>
                      <ul className="mt-1 space-y-1">
                        {urls.map((u) => (
                          <li key={u} className="truncate">
                            <a
                              href={u} target="_blank" rel="noopener noreferrer"
                              className="text-primary underline text-xs"
                            >{u}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                <div>
                  <strong>Raw payload:</strong>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selected.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
