import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { getSampleTemplate, renderTemplate, getSampleVariables } from "@/lib/email/template-renderer";
import { wrapWithPreviewStyles } from "@/lib/email/preview-styles";
import { EO3_JAN_2026_TEMPLATE, EO3_JAN_2026_SUBJECT } from "@/lib/email/templates/eo3-jan-2026";
import { CONGRATS_TEMPLATES } from "@/lib/email/templates/congrats-templates";
import { Eye, FileDown, Edit3, FileUp } from "lucide-react";
import { RichTextEditor } from "@/components/platform-templates/RichTextEditor";
import { WordUploadModal } from "@/components/platform-templates/WordUploadModal";
import { CourseTableEditor, CourseRow, generateCourseTableHtml } from "@/components/email-templates/CourseTableEditor";
import { CourseDescriptionEditor, CourseDescription, generateCourseDescriptionHtml } from "@/components/email-templates/CourseDescriptionEditor";
import { useBranch } from "@/context/BranchContext";
import { useClassTypes } from "@/hooks/useClassTypes";

interface TemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

const TEMPLATE_TYPES = [
  { value: "info_pack", label: "Info Pack" },
  { value: "welcome", label: "Welcome" },
  { value: "reminder", label: "Reminder" },
  { value: "confirmation", label: "Confirmation" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_COURSE: CourseRow = { name: "", price: "", entry_criteria: "", dates: "", day_time: "" };
const DEFAULT_DESCRIPTION: CourseDescription = { title: "", items: "" };

export function TemplateEditorModal({ open, onOpenChange, template }: TemplateEditorModalProps) {
  const { createTemplate, updateTemplate } = useEmailTemplates();
  const { currentBranch } = useBranch();
  const { classTypeNames } = useClassTypes();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showWordUpload, setShowWordUpload] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("info_pack");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [classType, setClassType] = useState("all");
  const [isActive, setIsActive] = useState(true);

  // Structured course data
  const [courses, setCourses] = useState<CourseRow[]>([{ ...DEFAULT_COURSE }]);
  const [courseFootnote, setCourseFootnote] = useState("");
  const [courseDescriptions, setCourseDescriptions] = useState<CourseDescription[]>([{ ...DEFAULT_DESCRIPTION }]);

  // Check if content uses structured course placeholders
  const hasCourseTable = content.includes("{{course_table}}");
  const hasCourseDescription = content.includes("{{course_description}}");
  const showCourseEditors = hasCourseTable || hasCourseDescription;

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || "");
        setType(template.type);
        setSubject(template.subject);
        setContent(template.content);
        setClassType(template.class_type || "all");
        setIsActive(template.is_active);
        
        // Load structured data from template variables
        const vars = template.variables as any;
        if (vars?.course_data) {
          setCourses(vars.course_data);
        } else {
          setCourses([{ ...DEFAULT_COURSE }]);
        }
        if (vars?.course_footnote) {
          setCourseFootnote(vars.course_footnote);
        } else {
          setCourseFootnote("");
        }
        if (vars?.course_descriptions) {
          setCourseDescriptions(vars.course_descriptions);
        } else {
          setCourseDescriptions([{ ...DEFAULT_DESCRIPTION }]);
        }
      } else {
        setName("");
        setType("info_pack");
        setSubject("Information about {{next_class}} Class");
        setContent(getSampleTemplate());
        setClassType("all");
        setIsActive(true);
        setCourses([{ ...DEFAULT_COURSE }]);
        setCourseFootnote("");
        setCourseDescriptions([{ ...DEFAULT_DESCRIPTION }]);
      }
      setActiveTab("edit");
    }
  }, [open, template]);

  const loadPresetTemplate = (preset: string) => {
    if (preset === "eo3-jan-2026") {
      setName("EO3 Jan 2026");
      setSubject(EO3_JAN_2026_SUBJECT);
      setContent(EO3_JAN_2026_TEMPLATE);
      setClassType("EO");
      setType("info_pack");
      setCourses([{ ...DEFAULT_COURSE }]);
      setCourseFootnote("");
      setCourseDescriptions([{ ...DEFAULT_DESCRIPTION }]);
    } else if (preset === "basic") {
      setName("");
      setSubject("Information about {{next_class}} Class");
      setContent(getSampleTemplate());
      setClassType("all");
      setType("info_pack");
      setCourses([{ ...DEFAULT_COURSE }]);
      setCourseFootnote("");
      setCourseDescriptions([{ ...DEFAULT_DESCRIPTION }]);
    } else {
      // Check if it's a congrats template
      const congratsTemplate = CONGRATS_TEMPLATES.find(t => t.name === preset);
      if (congratsTemplate) {
        setName(congratsTemplate.name);
        setSubject(congratsTemplate.subject);
        setContent(congratsTemplate.content);
        setClassType(congratsTemplate.classType || "all");
        setType("custom");
        // Load default structured data from the template
        if (congratsTemplate.defaultCourses) {
          setCourses(congratsTemplate.defaultCourses);
        } else {
          setCourses([{ ...DEFAULT_COURSE }]);
        }
        setCourseFootnote(congratsTemplate.defaultFootnote || "");
        if (congratsTemplate.defaultDescriptions) {
          setCourseDescriptions(congratsTemplate.defaultDescriptions);
        } else {
          setCourseDescriptions([{ ...DEFAULT_DESCRIPTION }]);
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Store structured course data in the variables field
    const variables: any = {};
    if (hasCourseTable) {
      variables.course_data = courses;
      if (courseFootnote) variables.course_footnote = courseFootnote;
    }
    if (hasCourseDescription) {
      variables.course_descriptions = courseDescriptions;
    }

    const data = {
      name,
      type,
      subject,
      content,
      class_type: classType === "all" ? undefined : classType,
      is_active: isActive,
      variables: Object.keys(variables).length > 0 ? variables : [],
    };

    if (template) {
      await updateTemplate.mutateAsync({ id: template.id, ...data });
    } else {
      await createTemplate.mutateAsync(data);
    }
    onOpenChange(false);
  };

  // Build preview variables with generated course HTML
  const getPreviewVariables = () => {
    const vars = getSampleVariables(currentBranch?.name);
    if (hasCourseTable) {
      vars.course_table = generateCourseTableHtml(courses, courseFootnote);
    }
    if (hasCourseDescription) {
      vars.course_description = generateCourseDescriptionHtml(courseDescriptions);
    }
    return vars;
  };

  const isValid = name.trim() && subject.trim() && content.trim();
  const previewHtml = wrapWithPreviewStyles(renderTemplate(content, getPreviewVariables()));

  const handleWordConversion = (convertedHtml: string, suggestedName: string) => {
    setContent(convertedHtml);
    if (!name) {
      setName(suggestedName);
    }
    if (!subject) {
      setSubject(`${suggestedName} - {{branch_name}}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            {template
              ? "Update the email template settings and content"
              : "Create a new email template with merge fields"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Write Email
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Load Preset Template or Import from Word */}
            {!template && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowWordUpload(true)}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Import from Word
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Load Preset Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-80 overflow-y-auto">
                    <DropdownMenuLabel>Info Packs</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => loadPresetTemplate("eo3-jan-2026")}>
                      EO3 Jan 2026 (Full HTML)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loadPresetTemplate("basic")}>
                      Basic Template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Congratulations Templates</DropdownMenuLabel>
                    {CONGRATS_TEMPLATES.map((t) => (
                      <DropdownMenuItem key={t.name} onClick={() => loadPresetTemplate(t.name)}>
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., EO Class Info Pack"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Template Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classType">Class Type (Optional)</Label>
                <Select value={classType} onValueChange={setClassType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classTypeNames.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active" className="font-normal">
                    {isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Information about {{next_class}} Class"
              />
            </div>

            {/* Content - WYSIWYG Editor */}
            <div className="space-y-2">
              <Label>Email Content</Label>
              <p className="text-xs text-muted-foreground">
                Write your email just like you would in any email app. Use "Insert Field" to add merge fields. Use <code className="bg-muted px-1 rounded">{'{{course_table}}'}</code> and <code className="bg-muted px-1 rounded">{'{{course_description}}'}</code> to insert structured course info blocks.
              </p>
              <RichTextEditor
                content={content}
                onChange={setContent}
              />
            </div>

            {/* Structured Course Editors - only show when placeholders are in content */}
            {showCourseEditors && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">📋 Course Data (fills the placeholders above)</h3>
                </div>
                
                {hasCourseTable && (
                  <CourseTableEditor
                    courses={courses}
                    onChange={setCourses}
                    footnote={courseFootnote}
                    onFootnoteChange={setCourseFootnote}
                  />
                )}

                {hasCourseDescription && (
                  <CourseDescriptionEditor
                    descriptions={courseDescriptions}
                    onChange={setCourseDescriptions}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <strong>Subject:</strong> {renderTemplate(subject, getPreviewVariables())}
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[400px] bg-white"
                title="Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || createTemplate.isPending || updateTemplate.isPending}
          >
            {(createTemplate.isPending || updateTemplate.isPending) && (
              <span className="mr-2 animate-spin">⟳</span>
            )}
            {template ? "Update Template" : "Create Template"}
          </Button>
        </DialogFooter>

        <WordUploadModal
          open={showWordUpload}
          onOpenChange={setShowWordUpload}
          onConversionComplete={handleWordConversion}
        />
      </DialogContent>
    </Dialog>
  );
}
