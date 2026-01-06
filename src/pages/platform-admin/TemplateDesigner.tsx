
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Mail, Copy, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlatformTemplates } from "@/hooks/usePlatformTemplates";
import { TemplateEditorModal } from "@/components/platform-templates/TemplateEditorModal";
import { TemplatePreviewModal } from "@/components/platform-templates/TemplatePreviewModal";
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

export default function TemplateDesigner() {
  const { isPlatformAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { templates, isLoading, deleteTemplate, duplicateTemplate } = usePlatformTemplates();
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPlatformAdmin) {
    navigate("/dashboard");
    return null;
  }

  const handleCreate = () => {
    setSelectedTemplateId(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedTemplateId(id);
    setEditorOpen(true);
  };

  const handlePreview = (id: string) => {
    setSelectedTemplateId(id);
    setPreviewOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id);
  };

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const getClassTypeBadgeColor = (classType: string | null) => {
    const colors: Record<string, string> = {
      "Puppy": "bg-pink-100 text-pink-800",
      "EO": "bg-blue-100 text-blue-800",
      "CGC Bronze": "bg-amber-100 text-amber-800",
      "CGC Silver": "bg-slate-100 text-slate-800",
      "Beginner": "bg-green-100 text-green-800",
      "Novice": "bg-purple-100 text-purple-800",
    };
    return colors[classType || ""] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Template Designer | Platform Admin</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Email Template Designer</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage email templates that branch admins can configure
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {templates?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first email template to get started
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.class_type && (
                      <Badge className={getClassTypeBadgeColor(template.class_type)}>
                        {template.class_type}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {template.configurable_fields.length} fields
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 truncate">
                    Subject: {template.subject}
                  </p>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(template.id)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreview(template.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDuplicate(template.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TemplateEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        templateId={selectedTemplateId}
      />

      <TemplatePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        templateId={selectedTemplateId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
