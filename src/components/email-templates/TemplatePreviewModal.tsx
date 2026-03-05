import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmailTemplate } from "@/hooks/useEmailTemplates";
import { renderTemplate, getSampleVariables } from "@/lib/email/template-renderer";
import { wrapWithPreviewStyles } from "@/lib/email/preview-styles";
import { useBranch } from "@/context/BranchContext";

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

export function TemplatePreviewModal({ open, onOpenChange, template }: TemplatePreviewModalProps) {
  const { currentBranch } = useBranch();
  if (!template) return null;

  const sampleVariables = getSampleVariables(currentBranch?.name);
  const previewHtml = wrapWithPreviewStyles(renderTemplate(template.content, sampleVariables));
  const previewSubject = renderTemplate(template.subject, sampleVariables);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Preview: {template.name}
            <Badge variant="outline">{template.type}</Badge>
            {template.class_type && (
              <Badge variant="secondary">{template.class_type}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Preview with sample data - merge fields are replaced with example values
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-3 border-b space-y-1">
              <div>
                <strong>To:</strong> john@example.com
              </div>
              <div>
                <strong>Subject:</strong> {previewSubject}
              </div>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[500px] bg-white"
              title="Email Preview"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
