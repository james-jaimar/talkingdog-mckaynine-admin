
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Mail, MapPin, Phone, Briefcase, Stethoscope, MessageCircle, Camera, Check, X, HelpCircle } from "lucide-react";
import { formatPhoneNumber } from "../utils/handlerUtils";
import { useBranch } from "@/context/BranchContext";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type ConsentStatus = 'yes' | 'no' | 'not_marked';

interface HandlerInfoProps {
  handler: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    branch_id?: string | null;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
    occupation?: string;
    vet_name?: string;
    account_holder_name?: string;
    created_at: string;
    uses_whatsapp_status?: ConsentStatus;
    social_media_consent_status?: ConsentStatus;
  };
}

function ConsentBadge({ status, label }: { status?: ConsentStatus; label: string }) {
  const getStatusDetails = () => {
    switch (status) {
      case 'yes':
        return { icon: Check, variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' };
      case 'no':
        return { icon: X, variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-100' };
      default:
        return { icon: HelpCircle, variant: 'secondary' as const, className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' };
    }
  };

  const { icon: Icon, className } = getStatusDetails();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'yes' ? 'Yes' : status === 'no' ? 'No' : 'Not marked'}
      </Badge>
    </div>
  );
}

export function HandlerInfo({ handler }: HandlerInfoProps) {
  const { branches } = useBranch();
  const [branchName, setBranchName] = useState<string>("");

  useEffect(() => {
    if (handler.branch_id && branches) {
      const branch = branches.find(b => b.id === handler.branch_id);
      if (branch) {
        setBranchName(branch.name);
      }
    }
  }, [handler.branch_id, branches]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Handler Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-muted-foreground text-sm">Contact</h3>
          <div className="grid gap-2">
            {handler.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${handler.email}`} className="text-sm hover:underline">
                  {handler.email}
                </a>
              </div>
            )}
            
            {handler.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${handler.phone}`} className="text-sm hover:underline">
                  {formatPhoneNumber(handler.phone)}
                </a>
              </div>
            )}

            {branchName && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{branchName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Handler Info */}
        {(handler.occupation || handler.vet_name || handler.account_holder_name) && (
          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground text-sm">Additional Info</h3>
            <div className="grid gap-2">
              {handler.occupation && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{handler.occupation}</span>
                </div>
              )}
              {handler.vet_name && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vet: {handler.vet_name}</span>
                </div>
              )}
              {handler.account_holder_name && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Account Holder:</span>
                  <span className="text-sm">{handler.account_holder_name}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {(handler.address || handler.city || handler.postal_code) && (
          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground text-sm">Address</h3>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                {handler.address && <div>{handler.address}</div>}
                {(handler.city || handler.postal_code) && (
                  <div>
                    {handler.city && <span>{handler.city}</span>}
                    {handler.city && handler.postal_code && <span>, </span>}
                    {handler.postal_code && <span>{handler.postal_code}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Consent Statuses */}
        <div className="space-y-2">
          <h3 className="font-semibold text-muted-foreground text-sm">Permissions</h3>
          <div className="space-y-2">
            <ConsentBadge status={handler.uses_whatsapp_status} label="WhatsApp" />
            <ConsentBadge status={handler.social_media_consent_status} label="Photo/Social Media" />
          </div>
        </div>
        
        {handler.notes && (
          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground text-sm">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{handler.notes}</p>
          </div>
        )}
        
        <div className="space-y-1 pt-2">
          <h3 className="font-semibold text-muted-foreground text-sm">Registration</h3>
          <p className="text-sm">
            Client since {new Date(handler.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
