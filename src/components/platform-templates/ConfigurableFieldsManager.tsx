
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurableField } from "@/hooks/usePlatformTemplates";
import { Plus, Trash2, GripVertical, Code } from "lucide-react";

interface ConfigurableFieldsManagerProps {
  fields: ConfigurableField[];
  onChange: (fields: ConfigurableField[]) => void;
}

export function ConfigurableFieldsManager({ fields, onChange }: ConfigurableFieldsManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addField = () => {
    const newField: ConfigurableField = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      placeholder: "",
      defaultValue: "",
    };
    onChange([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<ConfigurableField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const generateKeyFromLabel = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Configurable Fields</h3>
          <p className="text-sm text-muted-foreground">
            Define fields that branch admins can fill in when using this template
          </p>
        </div>
        <Button onClick={addField}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Code className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              No configurable fields yet. Add fields that branch admins can customize.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.key} className={editingIndex === index ? "ring-2 ring-primary" : ""}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div>
                      <CardTitle className="text-sm">{field.label}</CardTitle>
                      <CardDescription className="text-xs">
                        Merge field: <code className="bg-muted px-1 rounded">{`{{${field.key}}}`}</code>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    >
                      {editingIndex === index ? "Done" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {editingIndex === index && (
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          updateField(index, { 
                            label: e.target.value,
                            key: generateKeyFromLabel(e.target.value)
                          });
                        }}
                        placeholder="e.g., Class Start Date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Key</Label>
                      <Input
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value })}
                        placeholder="e.g., class_start_date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={field.type} 
                        onValueChange={(value: ConfigurableField["type"]) => 
                          updateField(index, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Hint text for branch admin"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Default Value</Label>
                      <Input
                        value={field.defaultValue || ""}
                        onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                        placeholder="Pre-filled value (optional)"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <h4 className="text-sm font-medium mb-2">System Fields (Always Available)</h4>
          <div className="flex flex-wrap gap-2">
            {[
              "handler_name", "handler_email", "handler_phone",
              "dog_name", "dog_breed",
              "branch_name", "branch_email", "branch_phone"
            ].map(key => (
              <code key={key} className="text-xs bg-background px-2 py-1 rounded border">
                {`{{${key}}}`}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
