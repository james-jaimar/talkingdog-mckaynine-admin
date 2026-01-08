import { useState } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { Eye, Mail, Check, Clock, Plus, Edit, Trash2, FileText } from "lucide-react";
import { TemplatePreviewModal } from "@/components/email-templates/TemplatePreviewModal";
import { TemplateEditorModal } from "@/components/email-templates/TemplateEditorModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EmailTemplates() {
  const { templates, isLoading, deleteTemplate, updateTemplate } = useEmailTemplates();
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    await updateTemplate.mutateAsync({ id: template.id, is_active: !template.is_active });
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Email Templates | McKaynine</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Create reusable email templates for quick communication with handlers.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-3 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No email templates yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Create reusable email templates with merge fields for personalized handler communications.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className={`relative transition-all ${
                  template.is_active 
                    ? 'border-primary/50 shadow-md' 
                    : 'opacity-80'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {template.is_active ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Check className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {template.subject}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{template.type}</Badge>
                    {template.class_type && (
                      <Badge variant="secondary">{template.class_type}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated: {new Date(template.updated_at).toLocaleDateString()}
                  </p>
                </CardContent>

                <CardFooter className="flex justify-between items-center pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => handleToggleActive(template)}
                      disabled={updateTemplate.isPending}
                    />
                    <span className="text-sm text-muted-foreground">
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setTemplateToDelete(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">How it works</h3>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Create templates with merge fields like <code className="bg-muted px-1 rounded">{"{{handler_name}}"}</code> and <code className="bg-muted px-1 rounded">{"{{dog_name}}"}</code></li>
                  <li>• Merge fields are automatically replaced when you send an email</li>
                  <li>• Active templates appear in the "Use Template" option when emailing handlers</li>
                  <li>• Attach info packs or documents manually when sending</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor Modal */}
      <TemplateEditorModal
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        template={selectedTemplate}
      />

      {/* Preview Modal */}
      <TemplatePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        template={selectedTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
