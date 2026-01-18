import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, Briefcase, Stethoscope, Send, FileCheck, Syringe, UserPlus } from "lucide-react";
import { formatPhoneNumber } from "../utils/handlerUtils";
import { EnrollmentRegistration } from "@/types/handler";
import { SendQuickEmailModal } from "./SendQuickEmailModal";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ClickableConsentBadge } from "../status/ClickableConsentBadge";
import { MultiBranchSelector } from "./MultiBranchSelector";

type ConsentStatus = 'yes' | 'no' | 'not_marked' | 'unsure';

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
    // Secondary contact fields
    secondary_first_name?: string;
    secondary_last_name?: string;
    secondary_email?: string;
    secondary_phone?: string;
    uses_whatsapp_status?: ConsentStatus;
    social_media_consent_status?: ConsentStatus;
    enrollment_registrations?: EnrollmentRegistration[];
    // Handler-level admin verification fields
    enrollment_verified?: boolean;
    vaccination_verified?: boolean;
  };
}


export function HandlerInfo({ handler }: HandlerInfoProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();


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

  // Update handler-level verification status
  const handleAdminVerificationChange = async (field: 'enrollment_verified' | 'vaccination_verified', checked: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ [field]: checked })
        .eq('id', handler.id);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `${field === 'enrollment_verified' ? 'Enrollment form' : 'Vaccination certificate'} status updated.`,
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

          </div>
        </div>

        {/* Multi-Branch Selector */}
        <MultiBranchSelector handlerId={handler.id} />


        {/* Secondary Contact */}
        {(handler.secondary_first_name || handler.secondary_email || handler.secondary_phone) && (
          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Secondary Contact
            </h3>
            <div className="grid gap-2 pl-6">
              {(handler.secondary_first_name || handler.secondary_last_name) && (
                <div className="text-sm font-medium">
                  {handler.secondary_first_name} {handler.secondary_last_name}
                </div>
              )}
              {handler.secondary_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${handler.secondary_email}`} className="text-sm hover:underline">
                    {handler.secondary_email}
                  </a>
                </div>
              )}
              {handler.secondary_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${handler.secondary_phone}`} className="text-sm hover:underline">
                    {formatPhoneNumber(handler.secondary_phone)}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Consent Statuses - Clickable */}
        <div className="space-y-2">
          <h3 className="font-semibold text-muted-foreground text-sm">Permissions</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">WhatsApp</span>
              <ClickableConsentBadge
                status={(consentStatuses.whatsapp as 'yes' | 'no' | 'not_marked') || 'not_marked'}
                handlerId={handler.id}
                field="uses_whatsapp_status"
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['client', handler.id] })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Photo/Social Media</span>
              <ClickableConsentBadge
                status={(consentStatuses.photo as 'yes' | 'no' | 'not_marked') || 'not_marked'}
                handlerId={handler.id}
                field="social_media_consent_status"
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['client', handler.id] })}
              />
            </div>
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
                checked={handler.enrollment_verified ?? false}
                onCheckedChange={(checked) => handleAdminVerificationChange('enrollment_verified', !!checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Vaccination Certificate</span>
              </div>
              <Checkbox
                checked={handler.vaccination_verified ?? false}
                onCheckedChange={(checked) => handleAdminVerificationChange('vaccination_verified', !!checked)}
              />
            </div>
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
        secondary_email: handler.secondary_email,
        secondary_first_name: handler.secondary_first_name,
      }}
    />
    </>
  );
}
