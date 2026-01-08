import { useState } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplateConfigurations } from "@/hooks/useTemplateConfigurations";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { Settings, Eye, Mail, Check, Clock, Plus, Edit, Trash2, FileText } from "lucide-react";
import { TemplateConfigureModal } from "@/components/email-templates/TemplateConfigureModal";
import { TemplatePreviewModal } from "@/components/email-templates/TemplatePreviewModal";
import { TemplateEditorModal } from "@/components/email-templates/TemplateEditorModal";
import { PrebuiltTemplate } from "@/lib/email/templates";
import { TemplateConfiguration } from "@/hooks/useTemplateConfigurations";
import { renderTemplate, getSampleVariables } from "@/lib/email/template-renderer";
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
  const { templatesWithStatus, isLoading: prebuiltLoading, toggleActive } = useTemplateConfigurations();
  const { templates: customTemplates, isLoading: customLoading, deleteTemplate, updateTemplate } = useEmailTemplates();
  
  const [activeTab, setActiveTab] = useState<"prebuilt" | "custom">("prebuilt");
  
  // Prebuilt template modals
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PrebuiltTemplate | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<TemplateConfiguration | null>(null);
  
  // Custom template modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCustomPreviewOpen, setIsCustomPreviewOpen] = useState(false);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<EmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  // Prebuilt template handlers
  const handleConfigure = (template: PrebuiltTemplate, config: TemplateConfiguration | null) => {
    setSelectedTemplate(template);
    setSelectedConfig(config);
    setIsConfigureOpen(true);
  };

  const handlePreview = (template: PrebuiltTemplate, config: TemplateConfiguration | null) => {
    setSelectedTemplate(template);
    setSelectedConfig(config);
    setIsPreviewOpen(true);
  };

  const handleToggleActive = async (config: TemplateConfiguration) => {
    await toggleActive.mutateAsync({ id: config.id, isActive: !config.is_active });
  };

  // Custom template handlers
  const handleCreateCustom = () => {
    setSelectedCustomTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEditCustom = (template: EmailTemplate) => {
    setSelectedCustomTemplate(template);
    setIsEditorOpen(true);
  };

  const handlePreviewCustom = (template: EmailTemplate) => {
    setSelectedCustomTemplate(template);
    setIsCustomPreviewOpen(true);
  };

  const handleDeleteCustom = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const handleToggleCustomActive = async (template: EmailTemplate) => {
    await updateTemplate.mutateAsync({ id: template.id, is_active: !template.is_active });
  };

  // Create a preview-compatible template object for the prebuilt preview modal
  const getPreviewTemplate = () => {
    if (!selectedTemplate) return null;
    
    const variables = selectedConfig?.variables || {};
    const sampleVars = getSampleVariables();
    const mergedVars = { ...sampleVars, ...variables };
    
    const rawHtml = selectedTemplate.getHtml(variables);
    const renderedHtml = renderTemplate(rawHtml, mergedVars);
    const renderedSubject = renderTemplate(selectedTemplate.subject, mergedVars);
    
    return {
      id: selectedConfig?.id || 'preview',
      branch_id: '',
      name: selectedTemplate.name,
      type: 'info_pack',
      subject: renderedSubject,
      content: renderedHtml,
      class_type: selectedTemplate.classType,
      variables: [],
      is_active: selectedConfig?.is_active ?? false,
      created_at: '',
      updated_at: '',
    };
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
              Manage prebuilt class info pack templates or create your own custom templates.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "prebuilt" | "custom")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="prebuilt" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Class Info Packs
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Custom Templates
            </TabsTrigger>
          </TabsList>

          {/* PREBUILT TEMPLATES TAB */}
          <TabsContent value="prebuilt" className="mt-6">
            {prebuiltLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templatesWithStatus.map((item) => (
                  <Card 
                    key={item.code} 
                    className={`relative transition-all ${
                      item.isConfigured && item.isActive 
                        ? 'border-primary/50 shadow-md' 
                        : 'opacity-80'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {item.isConfigured ? (
                        item.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Check className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Configured
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 pr-16">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.classType}</Badge>
                        {item.isConfigured && item.configuration && (
                          <span className="text-xs text-muted-foreground">
                            Last updated: {new Date(item.configuration.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {item.isConfigured && item.configuration?.variables && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                          {item.configuration.variables.class_day_time && (
                            <p><strong>When:</strong> {item.configuration.variables.class_day_time}</p>
                          )}
                          {item.configuration.variables.class_dates && (
                            <p><strong>Dates:</strong> {item.configuration.variables.class_dates}</p>
                          )}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex justify-between items-center pt-3 border-t">
                      {item.isConfigured && item.configuration ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => handleToggleActive(item.configuration!)}
                            disabled={toggleActive.isPending}
                          />
                          <span className="text-sm text-muted-foreground">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Configure to enable
                        </span>
                      )}
                      
                      <div className="flex gap-2">
                        {item.isConfigured && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(item, item.configuration)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant={item.isConfigured ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleConfigure(item, item.configuration)}
                        >
                          <Settings className="mr-1 h-4 w-4" />
                          {item.isConfigured ? "Edit" : "Configure"}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CUSTOM TEMPLATES TAB */}
          <TabsContent value="custom" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreateCustom}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            {customLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : customTemplates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-3 rounded-full bg-muted mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No custom templates yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-4">
                    Create your own email templates with custom HTML and merge fields for personalized communications.
                  </p>
                  <Button onClick={handleCreateCustom}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customTemplates.map((template) => (
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
                        <div className="p-2 rounded-lg bg-secondary/50">
                          <FileText className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 pr-16">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1 truncate">
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
                        <span className="text-xs text-muted-foreground">
                          Updated: {new Date(template.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => handleToggleCustomActive(template)}
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
                          onClick={() => handlePreviewCustom(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustom(template)}
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
          </TabsContent>
        </Tabs>

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
                  <li>• <strong>Class Info Packs:</strong> Pre-designed templates for each class type - just configure dates and details</li>
                  <li>• <strong>Custom Templates:</strong> Create your own templates with full HTML control and merge fields</li>
                  <li>• Handler details (name, dog name) are automatically filled when you send</li>
                  <li>• Active templates appear in the "Send Info Pack" and "Send Email" options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prebuilt Template Modals */}
      <TemplateConfigureModal
        open={isConfigureOpen}
        onOpenChange={setIsConfigureOpen}
        template={selectedTemplate}
        existingConfig={selectedConfig}
      />

      <TemplatePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        template={getPreviewTemplate()}
      />

      {/* Custom Template Modals */}
      <TemplateEditorModal
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        template={selectedCustomTemplate}
      />

      <TemplatePreviewModal
        open={isCustomPreviewOpen}
        onOpenChange={setIsCustomPreviewOpen}
        template={selectedCustomTemplate}
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
              onClick={handleDeleteCustom}
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
