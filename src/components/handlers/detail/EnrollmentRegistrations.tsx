
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Dog, Loader2 } from "lucide-react";
import { EnrollmentRegistration } from "@/types/handler";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface EnrollmentRegistrationsProps {
  registrations: EnrollmentRegistration[];
}

function getStatusBadgeVariant(status?: string) {
  switch (status) {
    case 'submitted':
      return 'default';
    case 'approved':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatHeardFrom(heardFrom?: unknown) {
  if (!heardFrom || typeof heardFrom !== 'object') return null;
  const heardFromObj = heardFrom as Record<string, boolean>;
  const sources = Object.entries(heardFromObj)
    .filter(([_, value]) => value === true)
    .map(([key]) => {
      const labels: Record<string, string> = {
        google: 'Google',
        vet: 'Vet',
        friends: 'Friends/Family',
        breeder: 'Breeder',
        beenBefore: 'Previous Client',
      };
      return labels[key] || key;
    });
  return sources.length > 0 ? sources.join(', ') : null;
}

function VetClearanceButton({ vetClearanceUrl }: { vetClearanceUrl: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleViewDocument = async () => {
    setIsLoading(true);
    try {
      // Extract the file path from the public URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/vet-clearance-docs/userId/filename
      const urlParts = vetClearanceUrl.split('/vet-clearance-docs/');
      if (urlParts.length < 2) {
        throw new Error("Invalid vet clearance URL format");
      }
      const filePath = urlParts[1];

      // Generate a signed URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('vet-clearance-docs')
        .createSignedUrl(filePath, 3600);

      if (error) {
        throw error;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error accessing vet clearance document:", error);
      toast({
        title: "Error",
        description: "Could not access the vet clearance document. Please check permissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewDocument}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4 mr-2" />
        )}
        View Vet Clearance Document
      </Button>
    </div>
  );
}

export function EnrollmentRegistrations({ registrations }: EnrollmentRegistrationsProps) {
  if (!registrations || registrations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Enrollment Registrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {registrations.map((registration) => (
            <div
              key={registration.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(registration.status)}>
                    {registration.status || 'Unknown'}
                  </Badge>
                  <span className="font-medium">
                    {registration.class_type}
                    {registration.class_type_other && ` (${registration.class_type_other})`}
                  </span>
                </div>
                {registration.submitted_at && (
                  <span className="text-sm text-muted-foreground">
                    Submitted: {formatDate(registration.submitted_at)}
                  </span>
                )}
              </div>

              {registration.dogs && (
                <div className="flex items-center gap-2 text-sm">
                  <Dog className="h-4 w-4 text-muted-foreground" />
                  <span>Dog: {registration.dogs.name}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">WhatsApp Permission:</span>
                  <span className="ml-2 capitalize">{registration.whatsapp_permission || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Photo Permission:</span>
                  <span className="ml-2 capitalize">{registration.photo_permission || 'Not set'}</span>
                </div>
              </div>

              {formatHeardFrom(registration.heard_from) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Heard from:</span>
                  <span className="ml-2">{formatHeardFrom(registration.heard_from)}</span>
                </div>
              )}

              {registration.signature_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Signed by:</span>
                  <span className="ml-2">{registration.signature_name}</span>
                  {registration.signature_date && (
                    <span className="text-muted-foreground ml-2">
                      on {formatDate(registration.signature_date)}
                    </span>
                  )}
                </div>
              )}

              {registration.vet_clearance_url && (
                <VetClearanceButton vetClearanceUrl={registration.vet_clearance_url} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
