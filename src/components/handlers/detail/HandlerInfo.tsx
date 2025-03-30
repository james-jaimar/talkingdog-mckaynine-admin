
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Mail, MapPin, Phone } from "lucide-react";
import { formatPhoneNumber } from "../utils/handlerUtils";
import { useBranch } from "@/context/BranchContext";
import { useEffect, useState } from "react";

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
    created_at: string;
  };
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
          <h3 className="font-semibold text-gray-500 text-sm">Contact</h3>
          <div className="grid gap-2">
            {handler.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${handler.email}`} className="text-sm hover:underline">
                  {handler.email}
                </a>
              </div>
            )}
            
            {handler.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${handler.phone}`} className="text-sm hover:underline">
                  {formatPhoneNumber(handler.phone)}
                </a>
              </div>
            )}

            {branchName && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{branchName}</span>
              </div>
            )}
          </div>
        </div>
        
        {(handler.address || handler.city || handler.postal_code) && (
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-500 text-sm">Address</h3>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
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
        
        {handler.notes && (
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-500 text-sm">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{handler.notes}</p>
          </div>
        )}
        
        <div className="space-y-1 pt-2">
          <h3 className="font-semibold text-gray-500 text-sm">Registration</h3>
          <p className="text-sm">
            Client since {new Date(handler.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
