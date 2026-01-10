import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, Mail, MapPin, Phone, Briefcase, Stethoscope, Check, X, HelpCircle, Send, FileCheck, Syringe } from "lucide-react";
import { formatPhoneNumber } from "../utils/handlerUtils";
import { useBranch } from "@/context/BranchContext";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { EnrollmentRegistration } from "@/types/handler";
import { SendQuickEmailModal } from "./SendQuickEmailModal";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type ConsentStatus = 'yes' | 'no' | 'not_marked' | 'unsure';

interface HandlerBooking {
  id: string;
  is_enrolled: boolean | null;
  vaccination_verified: boolean | null;
  dog_id: string;
  class_schedule_id: string;
  dogs?: {
    id: string;
    name: string;
  };
}

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
    enrollment_registrations?: EnrollmentRegistration[];
    bookings?: HandlerBooking[];
  };
}

function ConsentBadge({ status, label }: { status?: ConsentStatus | string; label: string }) {
  const normalizedStatus = status?.toLowerCase();
  const getStatusDetails = () => {
    switch (normalizedStatus) {
      case 'yes':
        return { icon: Check, className: 'bg-green-100 text-green-800 hover:bg-green-100', text: 'Yes' };
      case 'no':
        return { icon: X, className: 'bg-red-100 text-red-800 hover:bg-red-100', text: 'No' };
      case 'unsure':
        return { icon: HelpCircle, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', text: 'Unsure' };
      default:
        return { icon: HelpCircle, className: 'bg-gray-100 text-gray-600 hover:bg-gray-100', text: 'Not marked' };
    }
  };

  const { icon: Icon, className, text } = getStatusDetails();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </Badge>
    </div>
  );
}

export function HandlerInfo({ handler }: HandlerInfoProps) {
  const { branches } = useBranch();
  const [branchName, setBranchName] = useState<string>("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (handler.branch_id && branches) {
      const branch = branches.find(b => b.id === handler.branch_id);
      if (branch) {
        setBranchName(branch.name);
      }
    }
  }, [handler.branch_id, branches]);

  // Get consent statuses from the most recent enrollment registration
  const consentStatuses = useMemo(() => {
    const registrations = handler.enrollment_registrations;
    if (!registrations || registrations.length === 0) {
      return {
        whatsapp: handler.uses_whatsapp_status,
        photo: handler.social_media_consent_status
      };
    }
    // Get the most recent registration
    const latestRegistration = [...registrations].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return {
      whatsapp: latestRegistration.whatsapp_permission || handler.uses_whatsapp_status,
      photo: latestRegistration.photo_permission || handler.social_media_consent_status
    };
  }, [handler.enrollment_registrations, handler.uses_whatsapp_status, handler.social_media_consent_status]);

  // Calculate aggregate admin verification status from all bookings
  const adminVerification = useMemo(() => {
    const bookings = handler.bookings || [];
    if (bookings.length === 0) {
      return { hasEnrolled: false, hasVaccVerified: false, bookingCount: 0 };
    }
    
    // Check if ANY booking has these verified
    const hasEnrolled = bookings.some(b => b.is_enrolled === true);
    const hasVaccVerified = bookings.some(b => b.vaccination_verified === true);
    
    return { hasEnrolled, hasVaccVerified, bookingCount: bookings.length };
  }, [handler.bookings]);

  // Update all bookings for this handler
  const handleAdminVerificationChange = async (field: 'is_enrolled' | 'vaccination_verified', checked: boolean) => {
    const bookings = handler.bookings || [];
    if (bookings.length === 0) {
      toast({
        title: "No bookings found",
        description: "This handler has no class bookings to update.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update all bookings for this client
      const bookingIds = bookings.map(b => b.id);
      const { error } = await supabase
        .from('bookings')
        .update({ [field]: checked })
        .in('id', bookingIds);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `${field === 'is_enrolled' ? 'Enrollment form' : 'Vaccination'} status updated for all bookings.`,
      });

      // Refresh the handler data
      queryClient.invalidateQueries({ queryKey: ['client', handler.id] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Handler Information</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setEmailModalOpen(true)}
          disabled={!handler.email}
          className="gap-1"
        >
          <Send className="h-3.5 w-3.5" />
          Email
        </Button>
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
            <ConsentBadge status={consentStatuses.whatsapp} label="WhatsApp" />
            <ConsentBadge status={consentStatuses.photo} label="Photo/Social Media" />
          </div>
        </div>

        {/* Admin Verification - Enrol & Vacc checkboxes */}
        <div className="space-y-2">
          <h3 className="font-semibold text-muted-foreground text-sm">Admin Verification</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Enrollment Form Received</span>
              </div>
              <Checkbox
                checked={adminVerification.hasEnrolled}
                onCheckedChange={(checked) => handleAdminVerificationChange('is_enrolled', !!checked)}
                disabled={adminVerification.bookingCount === 0}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Vaccination Certificate</span>
              </div>
              <Checkbox
                checked={adminVerification.hasVaccVerified}
                onCheckedChange={(checked) => handleAdminVerificationChange('vaccination_verified', !!checked)}
                disabled={adminVerification.bookingCount === 0}
              />
            </div>
            {adminVerification.bookingCount === 0 && (
              <p className="text-xs text-muted-foreground">No bookings found for this handler</p>
            )}
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
    
    <SendQuickEmailModal
      open={emailModalOpen}
      onOpenChange={setEmailModalOpen}
      handler={{
        id: handler.id,
        first_name: handler.first_name,
        last_name: handler.last_name,
        email: handler.email,
      }}
    />
    </>
  );
}
