
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlatformTemplate } from "@/hooks/usePlatformTemplates";
import { Loader2 } from "lucide-react";
import { renderTemplate } from "@/lib/email/template-renderer";

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
}

export function TemplatePreviewModal({ open, onOpenChange, templateId }: TemplatePreviewModalProps) {
  const { data: template, isLoading } = usePlatformTemplate(templateId);

  const getSampleVariables = () => {
    const variables: Record<string, string> = {
      handler_name: "John Smith",
      handler_email: "john@example.com",
      handler_phone: "082 123 4567",
      dog_name: "Max",
      dog_breed: "German Shepherd",
      branch_name: "McKaynine Randburg",
      branch_email: "info@mckaynine.co.za",
      branch_phone: "011 123 4567",
    };
    
    // Add configurable fields with sample values
    template?.configurable_fields.forEach(field => {
      variables[field.key] = field.defaultValue || field.placeholder || `[${field.label}]`;
    });
    
    return variables;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!template) {
    return null;
  }

  const previewHtml = renderTemplate(template.html_content, getSampleVariables());
  const previewSubject = renderTemplate(template.subject, getSampleVariables());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Template Preview: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg">
          <div className="bg-muted p-3 border-b sticky top-0">
            <p className="text-sm">
              <strong>Subject:</strong> {previewSubject}
            </p>
          </div>
          <div 
            className="p-6 bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
